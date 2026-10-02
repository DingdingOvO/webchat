#!/usr/bin/env python3
"""WebChat 单端口服务：托管前端静态产物 + 代理 /api 与 /ws/chat 到后端。

部署平台只暴露一个端口，因此把前端与后端 API/WebSocket 合并到同一端口，
避免依赖浏览器跨端口访问。
"""
import http.server
import os
import select
import socket
import socketserver
import sys
import threading
import urllib.error
import urllib.request

PORT = int(os.environ.get("PORT", "3000"))
DIR = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "packages/frontend/dist")
BACKEND_HOST = os.environ.get("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "8080"))

PROXY_PREFIXES = ("/api", "/ws/chat")


class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 + 显式 Content-Length 才构成合法的 keep-alive 帧。
    # 若停留在默认的 HTTP/1.0，BaseHTTPRequestHandler 会隐式补 `Connection: close`，
    # 而前置网关（部署平台）在复用连接时会把随后的字节判定为
    # “Data after `Connection: close`” 并抛 500 —— 这正是不定时“网络连接失败”的根因。
    protocol_version = "HTTP/1.1"
    # 复用连接时必须逐请求重算长度，否则残留字节会污染下一个响应。
    timeout = 30

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    # ---------- HTTP 代理 ----------
    def _proxy(self):
        body = None
        length = self.headers.get("Content-Length")
        if length:
            body = self.rfile.read(int(length))
        url = f"http://{BACKEND_HOST}:{BACKEND_PORT}{self.path}"
        req = urllib.request.Request(url, data=body, method=self.command)
        # X-Auth-Token 必须透传：部署平台网关会用自己的 JWT 覆盖 Authorization，
        # 后端因此优先读取应用自定义头 X-Auth-Token。
        for key in ("Authorization", "X-Auth-Token", "Content-Type", "Accept", "Cookie", "Origin"):
            if key in self.headers:
                req.add_header(key, self.headers[key])
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data, code, headers = resp.read(), resp.status, resp.headers
        except urllib.error.HTTPError as exc:
            data, code, headers = exc.read(), exc.code, exc.headers
        except Exception as exc:  # noqa: BLE001
            self.send_error(502, f"backend unreachable: {exc}")
            return
        self.send_response(code)
        self.send_header("Content-Type", headers.get("Content-Type", "application/json"))
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)
        # 明确本响应的边界，配合 HTTP/1.1 keep-alive 不产生多余字节。
        self.wfile.flush()

    # ---------- WebSocket 隧道 ----------
    def _is_websocket(self):
        # 只有真正指向 /ws/chat 且带 Upgrade 的请求才走隧道。
        # 否则网关在 /api 请求上附带的 Upgrade 头会把普通 API 错误地劫持成隧道，
        # 导致响应帧错乱。
        if not self.path.startswith("/ws/chat"):
            return False
        if self.headers.get("Upgrade", "").lower() != "websocket":
            return False
        return "upgrade" in self.headers.get("Connection", "").lower()

    def _ws_tunnel(self):
        client = self.connection
        try:
            upstream = socket.create_connection((BACKEND_HOST, BACKEND_PORT), timeout=10)
        except Exception:  # noqa: BLE001
            self.send_error(502, "backend unreachable for websocket")
            return

        raw = f"GET {self.path} HTTP/1.1\r\n"
        for key, value in self.headers.items():
            raw += f"{key}: {value}\r\n"
        raw += "\r\n"
        upstream.sendall(raw.encode())

        def pump(src, dst):
            try:
                while True:
                    ready, _, _ = select.select([src], [], [], 120)
                    if not ready:
                        break
                    chunk = src.recv(65536)
                    if not chunk:
                        break
                    dst.sendall(chunk)
            except Exception:  # noqa: BLE001
                pass
            finally:
                try:
                    dst.shutdown(socket.SHUT_WR)
                except Exception:  # noqa: BLE001
                    pass

        threading.Thread(target=pump, args=(upstream, client), daemon=True).start()
        pump(client, upstream)
        upstream.close()
        # 隧道期间该连接已被独占，不能回到 keep-alive 复用。
        self.close_connection = True

    # ---------- 路由 ----------
    def _route(self):
        if self.path.startswith(PROXY_PREFIXES):
            if self._is_websocket():
                return self._ws_tunnel()
            return self._proxy()
        return None

    def do_GET(self):  # noqa: N802
        if self._route() is not None:
            return
        target = os.path.normpath(os.path.join(DIR, self.path.split("?")[0].lstrip("/")))
        if not (target.startswith(DIR) and os.path.isfile(target)):
            self.path = "/index.html"  # SPA 回退
        return super().do_GET()

    def do_POST(self):  # noqa: N802
        if self._route() is None:
            self.send_error(404)

    def do_PUT(self):  # noqa: N802
        if self._route() is None:
            self.send_error(404)

    def do_DELETE(self):  # noqa: N802
        if self._route() is None:
            self.send_error(404)

    def do_OPTIONS(self):  # noqa: N802
        if self._route() is None:
            self.send_error(404)

    def log_message(self, fmt, *args):
        sys.stderr.write("[webchat] %s\n" % (fmt % args))


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    print(f"WebChat serving on 0.0.0.0:{PORT} (static={DIR}, backend={BACKEND_HOST}:{BACKEND_PORT})", flush=True)
    ThreadedServer(("0.0.0.0", PORT), Handler).serve_forever()
