#!/usr/bin/env python3
"""为本地/演示环境生成种子数据。

用途：初始化三个演示账号（demo / alice / bob）、互加好友、建一个群、灌入示例消息。
前置：后端已在 http://127.0.0.1:8080 运行，且 MySQL/MongoDB/Redis 可用。

本脚本可重复执行：账号已存在则登录，好友/群已存在则复用，不会重复创建。
"""

import json
import sys
import time
import urllib.error
import urllib.request

REST = "http://127.0.0.1:8080"
WS = "ws://127.0.0.1:8080/ws/chat"

ACCOUNTS = [
    ("demo", "demo1234", "演示用户"),
    ("alice", "1234", "爱丽丝"),
    ("bob", "1234", "鲍勃"),
]
GROUP_NAME = "产品讨论组"


def call(method, path, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["X-Auth-Token"] = token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(REST + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode()
            return resp.status, (json.loads(body) if body.strip() else None)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()[:200]
    except urllib.error.URLError as exc:
        print(f"无法连接后端 {REST}：{exc}", file=sys.stderr)
        sys.exit(1)


def ensure_account(username, password, nickname):
    """注册；若已存在（409/400）则直接登录。返回 token。"""
    status, body = call(
        "POST", "/api/auth/register",
        {"username": username, "password": password, "nickname": nickname},
    )
    if status == 200 and isinstance(body, dict):
        print(f"  注册 {username}")
        return body["token"]
    status, body = call("POST", "/api/auth/login", {"username": username, "password": password})
    if status == 200 and isinstance(body, dict):
        print(f"  登录 {username}（已存在）")
        return body["token"]
    print(f"  {username} 认证失败：HTTP {status} {body}", file=sys.stderr)
    sys.exit(1)


def user_id(token, username):
    _, res = call("GET", f"/api/users/search?q={username}", token=token)
    if isinstance(res, list):
        for u in res:
            if u.get("username") == username:
                return u["id"]
    return None


def main():
    print("== 1. 账号 ==")
    tokens = {u: ensure_account(u, p, n) for u, p, n in ACCOUNTS}
    ids = {u: user_id(tokens["demo"], u) for u, _, _ in ACCOUNTS}
    print(f"  用户 id：{ids}")

    print("== 2. 好友关系 ==")
    # 正确字段是 userId（后端 UserController 读 body.get("userId")），
    # 此前这里误写为 toUserId，导致请求静默失败、好友永远加不上。
    for name in ("alice", "bob"):
        target = ids[name]
        if target is None:
            print(f"  跳过 {name}：未找到该用户")
            continue
        call("POST", "/api/users/friend-request", {"userId": target}, tokens["demo"])
        # 让对方接受
        _, pending = call("GET", "/api/users/friend-requests/pending", token=tokens[name])
        if isinstance(pending, list):
            for req in pending:
                if req.get("fromUserId") == ids["demo"]:
                    call("POST", f"/api/users/friend-requests/{req['id']}/accept", token=tokens[name])
                    print(f"  demo <-> {name} 已互为好友")
                    break

    print("== 3. 群组 ==")
    _, groups = call("GET", "/api/groups", token=tokens["demo"])
    gid = None
    if isinstance(groups, list):
        for g in groups:
            if g.get("name") == GROUP_NAME:
                gid = g["id"]
                print(f"  复用已有群「{GROUP_NAME}」id={gid}")
                break
    if gid is None:
        members = [i for i in (ids["alice"], ids["bob"]) if i]
        status, grp = call("POST", "/api/groups", {"name": GROUP_NAME, "memberIds": members}, tokens["demo"])
        if isinstance(grp, dict):
            gid = grp["id"]
            print(f"  新建群「{GROUP_NAME}」id={gid}")
        else:
            print(f"  建群失败：HTTP {status} {grp}", file=sys.stderr)
            sys.exit(1)

    print("== 4. 消息（经 WebSocket 发送） ==")
    try:
        import websocket  # type: ignore
    except ImportError:
        print("  未安装 websocket-client，跳过消息播种。可执行：pip install websocket-client", file=sys.stderr)
        return

    socks = {}
    try:
        for name, tok in tokens.items():
            socks[name] = websocket.create_connection(f"{WS}?token={tok}", timeout=15)
            time.sleep(0.4)
        print(f"  {len(socks)} 个 WebSocket 连接就绪")

        for who, text in [
            ("alice", "大家好，我是爱丽丝"),
            ("bob", "鲍勃来了"),
            ("demo", "单端口部署下 WebSocket 也是通的"),
        ]:
            socks[who].send(json.dumps({"type": "group", "receiverId": gid, "content": text}))
            time.sleep(0.5)
        print("  群消息已发送")

        socks["alice"].send(json.dumps({
            "type": "p2p", "receiverId": ids["demo"], "content": "私聊测试消息",
        }))
        time.sleep(0.5)
        print("  私聊消息已发送")
    finally:
        for s in socks.values():
            try:
                s.close()
            except Exception:
                pass

    print("\n完成。可用账号：")
    for u, p, n in ACCOUNTS:
        print(f"  {u} / {p}  （{n}）")


if __name__ == "__main__":
    main()
