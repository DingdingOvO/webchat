import json, time, urllib.request, urllib.error
import websocket

REST = "http://127.0.0.1:8080"
WS   = "ws://127.0.0.1:8080/ws/chat"

def call(method, path, payload=None, token=None):
    h = {"Content-Type": "application/json"}
    if token: h["X-Auth-Token"] = token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(REST + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()
            return r.status, (json.loads(body) if body.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]

def login(u, p):
    st, res = call("POST", "/api/auth/login", {"username": u, "password": p})
    return res["token"] if isinstance(res, dict) else None

td, ta, tb = login("demo","demo1234"), login("alice","1234"), login("bob","1234")
def uid(tok, name):
    st, res = call("GET", f"/api/users/search?q={name}", token=tok)
    return res[0]["id"] if isinstance(res, list) and res else None
id_a, id_b = uid(td,"alice"), uid(td,"bob")
print(f"demo=1 alice={id_a} bob={id_b}")

# 好友：正确路径 /friend-request（单数）
for other, tok in (("alice", ta), ("bob", tb)):
    st, _ = call("POST", "/api/users/friend-request", {"toUserId": uid(td, other)}, td)
    print(f"demo -> {other}: HTTP {st}")
    st2, pending = call("GET", "/api/users/friend-requests/pending", token=tok)
    if isinstance(pending, list) and pending:
        st3, _ = call("POST", f"/api/users/friend-requests/{pending[0]['id']}/accept", token=tok)
        print(f"  {other} 接受: HTTP {st3}")

# 群
st, grp = call("GET", "/api/groups", token=td)
if isinstance(grp, list) and grp:
    gid = grp[0]["id"]; print("复用已有群 id:", gid)
else:
    st, grp = call("POST", "/api/groups", {"name":"产品讨论组","memberIds":[id_a,id_b]}, td)
    gid = grp["id"]; print("新建群 id:", gid)

# 通过 WebSocket 发消息（唯一通道）
def connect(tok):
    return websocket.create_connection(f"{WS}?token={tok}", timeout=15)

socks = {}
for name, tok in (("demo",td), ("alice",ta), ("bob",tb)):
    socks[name] = connect(tok)
    time.sleep(0.4)
print("三个 WS 连接就绪")

msgs = [("alice","大家好，我是爱丽丝"), ("bob","鲍勃来了"), ("demo","群聊走单端口 WebSocket 也是通的")]
for who, txt in msgs:
    socks[who].send(json.dumps({"type":"group","receiverId":gid,"content":txt}))
    time.sleep(0.6)
print("群消息已发送:", [m[1] for m in msgs])

socks["alice"].send(json.dumps({"type":"p2p","receiverId":1,"content":"私聊测试消息"}))
time.sleep(0.6)
print("P2P 消息已发送")

for s in socks.values(): s.close()
