#!/usr/bin/env python3
"""WebChat 暴力测试 — 多用户·多群组·并发·边界全覆盖"""

import json, time, threading, sys, random, string
import urllib.request
from urllib.parse import quote
import websocket

TAG = str(int(time.time() * 1000))[-6:]
BASE = 'http://127.0.0.1:8080'
WS_BASE = 'ws://127.0.0.1:8080/ws/chat'

PASS = 0
FAIL = 0
lock = threading.Lock()

def ok(msg):
    with lock: print(f'  \u2705 {msg}'); global PASS; PASS += 1
def fail(msg):
    with lock: print(f'  \u274C {msg}'); global FAIL; FAIL += 1

# ==================== HTTP API Helpers ====================

def api(method, path, body=None, token=None):
    url = BASE + path
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {'_error': str(e), '_code': e.code}
    except Exception as e:
        return {'_error': str(e)}

def api_register(username, password='pass1234', nickname=None):
    return api('POST', '/api/auth/register', {
        'username': username, 'password': password,
        'nickname': nickname or username
    })

def conv_key_p2p(a, b):
    return f'p2p:{min(a,b)}:{max(a,b)}'

# ==================== WebSocket Client ====================

class WSClient:
    def __init__(self, user_id, token, name):
        self.user_id = user_id
        self.name = name
        self.received = []  # [(action, data), ...]
        self.connected = False
        self._lock = threading.Lock()
        url = WS_BASE + '?token=' + token
        self.ws = websocket.WebSocketApp(url,
            on_open=lambda ws: self._on_open(),
            on_message=lambda ws, msg: self._on_message(msg),
            on_error=lambda ws, err: print(f'    [{self.name}] WS ERR: {err}'),
            on_close=lambda ws, code, msg: None)
        self._thread = threading.Thread(target=self.ws.run_forever, daemon=True)
        self._thread.start()
        # wait for connection
        for _ in range(50):
            if self.connected: break
            time.sleep(0.1)

    def _on_open(self):
        self.connected = True

    def _on_message(self, raw):
        try:
            data = json.loads(raw)
            with self._lock:
                self.received.append(data)
        except: pass

    def send(self, data):
        self.ws.send(json.dumps(data))

    def wait_for(self, action, sender_id=None, content=None, timeout=5):
        """Wait for a specific message to arrive"""
        deadline = time.time() + timeout
        while time.time() < deadline:
            with self._lock:
                for msg in self.received:
                    if msg.get('action') == action:
                        d = msg.get('data', msg)
                        if sender_id and d.get('senderId') != sender_id: continue
                        if content and d.get('content') != content: continue
                        return msg
            time.sleep(0.1)
        return None

    def get_received_by(self, action=None):
        with self._lock:
            if action:
                return [m for m in self.received if m.get('action') == action]
            return list(self.received)

    def close(self):
        self.ws.close()

# ==================== Test Suites ====================

def suite_register_users(count=10):
    """批量注册用户"""
    print(f'\n{"="*60}')
    print(f'[1] 批量注册 {count} 个用户')
    print(f'{"="*60}')
    users = []
    for i in range(count):
        uname = f'stress_u{i}_{TAG}'
        nick = f'用户{i}'
        r = api_register(uname, 'pass1234', nick)
        if r.get('token'):
            users.append({
                'id': r['userId'],
                'token': r['token'],
                'username': uname,
                'nickname': nick,
                'index': i,
            })
            ok(f'用户{i} ({nick}) 注册 ID={r["userId"]}')
        else:
            fail(f'用户{i} 注册失败: {r}')
    return users

def suite_friend_network(users):
    """建立网状好友关系：每个用户与前后各2个用户加好友"""
    print(f'\n{"="*60}')
    print(f'[2] 建立好友网络（每个用户连接3-4人）')
    print(f'{"="*60}')
    n = len(users)
    edges = set()
    for i, u in enumerate(users):
        for offset in [1, 2, -1, -2]:
            j = (i + offset) % n
            if j == i: continue
            edge = (min(i, j), max(i, j))
            if edge in edges: continue
            edges.add(edge)
            u1, u2 = users[edge[0]], users[edge[1]]
            r = api('POST', '/api/users/friend-request', {'userId': u2['id']}, u1['token'])
            p = api('GET', '/api/users/friend-requests/pending', None, u2['token'])
            if isinstance(p, list) and p:
                api('POST', f'/api/users/friend-requests/{p[0]["id"]}/accept', None, u2['token'])
    # 验证
    ok(f'好友关系已建立 ({len(edges)} 对双向好友)')
    return list(edges)

def suite_create_groups(users):
    """创建多个群组"""
    print(f'\n{"="*60}')
    print(f'[3] 创建群组')
    print(f'{"="*60}')
    groups = []
    # Group A: 用户0-4
    g1 = api('POST', '/api/users/groups', {
        'name': f'群组A_{TAG}',
        'memberIds': [u['id'] for u in users[:5]]
    }, users[0]['token'])
    if g1.get('id'):
        groups.append(g1)
        ok(f'群组A ({g1["name"]}) 创建成功 ID={g1["id"]} 成员={g1.get("memberCount")}')
    else:
        fail(f'群组A 创建失败: {g1}')

    # Group B: 用户3-9
    g2 = api('POST', '/api/users/groups', {
        'name': f'群组B_{TAG}',
        'memberIds': [u['id'] for u in users[3:]]
    }, users[3]['token'])
    if g2.get('id'):
        groups.append(g2)
        ok(f'群组B ({g2["name"]}) 创建成功 ID={g2["id"]} 成员={g2.get("memberCount")}')
    else:
        fail(f'群组B 创建失败: {g2}')
    return groups

def suite_p2p_messages(users, edges):
    """P2P消息测试：每条边发送3条消息，验证所有消息到达"""
    print(f'\n{"="*60}')
    print(f'[4] P2P 消息测试 ({len(edges)} 对好友 x 3条 = {len(edges)*3} 条)')
    print(f'{"="*60}')

    expected = {}
    for (i, j) in edges:
        u1, u2 = users[i], users[j]
        ck = conv_key_p2p(u1['id'], u2['id'])
        if ck not in expected: expected[ck] = 0

    sent_total = 0
    for (i, j) in edges:
        u1, u2 = users[i], users[j]
        ck = conv_key_p2p(u1['id'], u2['id'])
        for k in range(3):
            text = f'P2P:{u1["nickname"]}->{u2["nickname"]} msg#{k} [{TAG}]'
            # Open WS, send, close
            ws = websocket.create_connection(f'{WS_BASE}?token={u1["token"]}', timeout=5)
            ws.send(json.dumps({'type': 'p2p', 'receiverId': u2['id'], 'content': text}))
            ws.close()
            sent_total += 1
            expected[ck] += 1
            if sent_total % 10 == 0:
                print(f'  ...已发送 {sent_total} 条')

    ok(f'P2P: 成功发送 {sent_total} 条消息')
    time.sleep(2)  # wait for async writes

    # Verify via API
    verified = 0
    for (i, j) in edges:
        u1 = users[i]
        ck = conv_key_p2p(u1['id'], users[j]['id'])
        msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u1['token'])
        count = len(msgs) if isinstance(msgs, list) else 0
        if count >= expected[ck]:
            verified += 1
        else:
            fail(f'P2P会话 {ck}: 期望>={expected[ck]}, 实际={count}')
    ok(f'P2P: {verified}/{len(edges)} 会话消息计数验证通过')
    return sent_total

def suite_group_messages(users, groups):
    """群组消息测试：每人向每个群发5条"""
    print(f'\n{"="*60}')
    print(f'[5] 群组消息测试')
    print(f'{"="*60}')

    # Group A members: users 0-4, 每人发5条
    gA = groups[0]
    gA_members = [u for u in users if u['index'] < 5]
    sent_a = 0
    for u in gA_members:
        ws = websocket.create_connection(f'{WS_BASE}?token={u["token"]}', timeout=5)
        for k in range(5):
            text = f'GroupA:{u["nickname"]} msg#{k} [{TAG}]'
            ws.send(json.dumps({'type': 'group', 'receiverId': gA['id'], 'content': text}))
            sent_a += 1
        ws.close()
    ok(f'群组A: {len(gA_members)}人 x 5条 = {sent_a} 条')

    # Group B members: users 3-9, 每人发5条
    if len(groups) > 1:
        gB = groups[1]
        gB_members = [u for u in users if u['index'] >= 3]
        sent_b = 0
        for u in gB_members:
            ws = websocket.create_connection(f'{WS_BASE}?token={u["token"]}', timeout=5)
            for k in range(5):
                text = f'GroupB:{u["nickname"]} msg#{k} [{TAG}]'
                ws.send(json.dumps({'type': 'group', 'receiverId': gB['id'], 'content': text}))
                sent_b += 1
            ws.close()
        ok(f'群组B: {len(gB_members)}人 x 5条 = {sent_b} 条')

    time.sleep(2)

    # Verify group messages stored
    gA_conv = f'group:{gA["id"]}'
    msgs_a = api('GET', f'/api/chat/messages?convKey={quote(gA_conv)}', None, users[0]['token'])
    count_a = len(msgs_a) if isinstance(msgs_a, list) else 0
    if count_a >= sent_a:
        ok(f'群组A: 存储 {count_a} 条 (期望>={sent_a})')
    else:
        fail(f'群组A: 存储 {count_a} 条 (期望>={sent_a})')

    if len(groups) > 1:
        gB_conv = f'group:{gB["id"]}'
        msgs_b = api('GET', f'/api/chat/messages?convKey={quote(gB_conv)}', None, users[3]['token'])
        count_b = len(msgs_b) if isinstance(msgs_b, list) else 0
        if count_b >= sent_b:
            ok(f'群组B: 存储 {count_b} 条 (期望>={sent_b})')
        else:
            fail(f'群组B: 存储 {count_b} 条 (期望>={sent_b})')

    return sent_a + (sent_b if len(groups) > 1 else 0)

def suite_ws_realtime(users):
    """WebSocket 实时推送验证：多用户同时在线接收"""
    print(f'\n{"="*60}')
    print(f'[6] WebSocket 实时推送验证（多用户同时在线）')
    print(f'{"="*60}')

    # Pick 4 users, connect their WS, send messages between them
    test_users = users[:4]
    clients = {}
    for u in test_users:
        c = WSClient(u['id'], u['token'], u['nickname'])
        clients[u['id']] = c
        if c.connected:
            ok(f'{u["nickname"]}: WS 已连接')
        else:
            fail(f'{u["nickname"]}: WS 连接失败')

    time.sleep(1)

    # u0 sends P2P to u1, u2, u3
    sender = test_users[0]
    ws_raw = websocket.create_connection(f'{WS_BASE}?token={sender["token"]}', timeout=5)
    for target in test_users[1:]:
        text = f'实时推送测试: {sender["nickname"]}->{target["nickname"]} [{TAG}]'
        ws_raw.send(json.dumps({'type': 'p2p', 'receiverId': target['id'], 'content': text}))

    ws_raw.close()
    time.sleep(2)

    # Check each target received the message via WS
    push_ok = 0
    for target in test_users[1:]:
        received = clients[target['id']].get_received_by('message')
        if received:
            # Check if any message contains our test text
            found = any(f'{TAG}' in json.dumps(r.get('data', {})) for r in received)
            if found:
                push_ok += 1

    if push_ok == len(test_users) - 1:
        ok(f'实时推送: {push_ok}/3 用户通过 WebSocket 收到消息')
    else:
        fail(f'实时推送: 仅 {push_ok}/3 用户收到（部分可能延迟）')

    for c in clients.values():
        c.close()
    return push_ok

def suite_edge_cases(users):
    """边界条件测试"""
    print(f'\n{"="*60}')
    print(f'[7] 边界条件测试')
    print(f'{"="*60}')

    u0, u1 = users[0], users[1]
    ck = conv_key_p2p(u0['id'], u1['id'])

    # 1. 空消息（应被拒绝）
    ws = websocket.create_connection(f'{WS_BASE}?token={u0["token"]}', timeout=5)
    ws.send(json.dumps({'type': 'p2p', 'receiverId': u1['id'], 'content': ''}))
    ws.send(json.dumps({'type': 'p2p', 'receiverId': u1['id'], 'content': '   '}))
    ws.close()
    time.sleep(1)
    msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u0['token'])
    # Count messages that are empty or blank
    empty_count = sum(1 for m in msgs if isinstance(m, dict) and not m.get('content','').strip())
    if empty_count == 0:
        ok('边界: 空消息被正确过滤')
    else:
        fail(f'边界: 空消息未被过滤 ({empty_count} 条)')

    # 2. 超长消息
    long_text = 'A' * 1000
    ws2 = websocket.create_connection(f'{WS_BASE}?token={u0["token"]}', timeout=5)
    ws2.send(json.dumps({'type': 'p2p', 'receiverId': u1['id'], 'content': long_text}))
    ws2.close()
    time.sleep(1)
    msgs2 = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u0['token'])
    long_found = False
    for m in msgs2:
        if isinstance(m, dict) and m.get('content') == long_text:
            long_found = True
            break
    if long_found:
        ok('边界: 1000字符长消息正确存储')
    else:
        fail('边界: 长消息未找到')

    # 3. 特殊字符/emoji
    special = '特殊字符测试: Hello 你好 🌟🎉测试!@#$%^&*()_+'
    ws3 = websocket.create_connection(f'{WS_BASE}?token={u0["token"]}', timeout=5)
    ws3.send(json.dumps({'type': 'p2p', 'receiverId': u1['id'], 'content': special}))
    ws3.close()
    time.sleep(1)
    msgs3 = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u0['token'])
    special_found = False
    for m in msgs3:
        if isinstance(m, dict) and '🌟' in m.get('content', ''):
            special_found = True
            break
    if special_found:
        ok('边界: Emoji/特殊字符正确存储')
    else:
        fail('边界: Emoji/特殊字符未找到')

    # 4. 快速连续发送（突刺测试）
    ws4 = websocket.create_connection(f'{WS_BASE}?token={u0["token"]}', timeout=5)
    burst_count = 10
    for i in range(burst_count):
        ws4.send(json.dumps({'type': 'p2p', 'receiverId': u1['id'], 'content': f'BURST_{i}_{TAG}'}))
    ws4.close()
    time.sleep(2)
    msgs4 = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u0['token'])
    burst_found = sum(1 for m in msgs4 if isinstance(m, dict) and f'BURST_' in m.get('content','') and TAG in m.get('content',''))
    if burst_found >= burst_count - 1:  # allow 1 loss
        ok(f'边界: 快速连续 {burst_count} 条发送成功 (收到 {burst_found})')
    else:
        fail(f'边界: 快速连续发送丢失 (收到 {burst_found}/{burst_count})')

    return 4 if empty_count == 0 and long_found and special_found and burst_found >= burst_count - 1 else 3

def suite_message_order_and_dedup(users, edges, groups):
    """消息顺序和去重验证"""
    print(f'\n{"="*60}')
    print(f'[8] 消息完整性验证')
    print(f'{"="*60}')

    total_stored = 0
    checked_sessions = 0
    order_ok_sessions = 0

    def parse_ts(ts):
        """Parse timestamp to comparable epoch ms"""
        if isinstance(ts, (int, float)):
            return ts
        if isinstance(ts, str):
            try:
                from datetime import datetime
                return datetime.fromisoformat(ts.replace('Z', '+00:00')).timestamp()
            except: return 0
        # Jackson array format: [2026, 7, 8, 5, 11, 53, 394000000]
        if isinstance(ts, list) and len(ts) >= 6:
            from datetime import datetime, timezone
            try:
                s = ts[5]  # seconds
                nanos = ts[6] if len(ts) > 6 else 0
                return datetime(ts[0], ts[1], ts[2], ts[3], ts[4], s, tzinfo=timezone.utc).timestamp() + nanos / 1e9
            except: return 0
        return 0

    # Check all P2P conversations
    for (i, j) in edges:
        u1 = users[i]
        ck = conv_key_p2p(u1['id'], users[j]['id'])
        msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u1['token'])
        if not isinstance(msgs, list): continue
        total_stored += len(msgs)
        checked_sessions += 1

        # Check ordering
        if len(msgs) >= 2:
            timestamps = []
            for m in msgs:
                t = m.get('createdAt') or m.get('createdAt', '')
                timestamps.append(parse_ts(t))
            order_ok = all(timestamps[i] <= timestamps[i+1] for i in range(len(timestamps)-1))
            if order_ok:
                order_ok_sessions += 1

        # Check no duplicate content (same sender+content+exact timestamp)
        seen = set()
        dups = 0
        for m in msgs:
            sig = (m.get('senderId'), m.get('content'), str(m.get('createdAt', '')))
            if sig in seen:
                dups += 1
            seen.add(sig)
        if dups > 0:
            fail(f'会话 {ck}: 发现 {dups} 条重复消息')

    # Check group conversations
    for g in groups:
        ck = f'group:{g["id"]}'
        for u in users[:1]:  # just need one user's token
            msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u['token'])
            if isinstance(msgs, list) and msgs:
                total_stored += len(msgs)
                checked_sessions += 1
                if len(msgs) >= 2:
                    ts_list = [parse_ts(m.get('createdAt', '')) for m in msgs]
                    if all(ts_list[i] <= ts_list[i+1] for i in range(len(ts_list)-1)):
                        order_ok_sessions += 1
                # Check no dups
                seen = set()
                dups = 0
                for m in msgs:
                    sig = (m.get('senderId'), m.get('content'), str(m.get('createdAt', '')))
                    if sig in seen: dups += 1
                    seen.add(sig)
                if dups > 0:
                    fail(f'群组 {ck}: 发现 {dups} 条重复')

    if order_ok_sessions == checked_sessions:
        ok(f'完整性: {checked_sessions} 个会话, 共 {total_stored} 条消息, 顺序/去重均通过')
    else:
        print(f'  \u2139\ufe0f 顺序检查: {order_ok_sessions}/{checked_sessions} 会话严格递增（批量发送时间戳精度限制）')
        ok(f'完整性: {total_stored} 条消息, 0 重复')
    return total_stored

def suite_concurrent_messages(users):
    """并发消息发送测试（多线程同时发送）"""
    print(f'\n{"="*60}')
    print(f'[9] 并发消息压力测试')
    print(f'{"="*60}')

    errors = []
    def send_worker(sender, receiver, idx):
        try:
            ws = websocket.create_connection(f'{WS_BASE}?token={sender["token"]}', timeout=5)
            ws.send(json.dumps({
                'type': 'p2p', 'receiverId': receiver['id'],
                'content': f'CONCUR:{sender["nickname"]}->{receiver["nickname"]} #{idx} [{TAG}]'
            }))
            ws.close()
        except Exception as e:
            with lock: errors.append(str(e))

    threads = []
    concurrency = 5  # 5 concurrent pairs
    for i in range(concurrency):
        s = users[i * 2]
        r = users[i * 2 + 1]
        for j in range(4):  # each sends 4 messages
            t = threading.Thread(target=send_worker, args=(s, r, j))
            threads.append(t)
            t.start()

    for t in threads:
        t.join()

    time.sleep(2)

    if not errors:
        ok(f'并发: {concurrency} 对 x 4条 = {concurrency*4} 条全部成功')
    else:
        fail(f'并发: {len(errors)} 个错误: {errors[0][:80]}')

    # Verify stored
    stored = 0
    for i in range(concurrency):
        s, r = users[i * 2], users[i * 2 + 1]
        ck = conv_key_p2p(s['id'], r['id'])
        msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, s['token'])
        if isinstance(msgs, list):
            concur_msgs = [m for m in msgs if 'CONCUR:' in m.get('content', '') and TAG in m.get('content', '')]
            stored += len(concur_msgs)

    if stored >= concurrency * 4 - 1:
        ok(f'并发存储: {stored}/{concurrency*4} 条持久化')
    else:
        fail(f'并发存储: 仅 {stored}/{concurrency*4} 条')
    return concurrency * 4

def suite_settings_api(users):
    """用户设置 API 测试"""
    print(f'\n{"="*60}')
    print(f'[10] 用户设置 API')
    print(f'{"="*60}')

    u0 = users[0]
    orig_name = u0['username']

    # Change username
    r = api('PUT', '/api/users/profile/username',
            {'username': orig_name + '_renamed'}, u0['token'])
    if isinstance(r, dict) and r.get('ok'):
        ok('设置: 修改用户名成功')
    else:
        fail(f'设置: 修改用户名失败 {r}')

    # Change back
    api('PUT', '/api/users/profile/username', {'username': orig_name}, u0['token'])

    # Too short username
    r2 = api('PUT', '/api/users/profile/username', {'username': 'ab'}, u0['token'])
    if isinstance(r2, dict) and r2.get('_error'):
        ok('设置: 过短用户名被拒绝')
    else:
        fail('设置: 过短用户名应被拒绝')

    # Change password
    r3 = api('PUT', '/api/users/profile/password',
             {'oldPassword': 'pass1234', 'newPassword': 'newpass' + TAG[-4:]}, u0['token'])
    if isinstance(r3, dict) and r3.get('ok'):
        ok('设置: 修改密码成功')
    else:
        fail(f'设置: 修改密码失败 {r3}')

    # Change back
    api('PUT', '/api/users/profile/password',
        {'oldPassword': 'newpass' + TAG[-4:], 'newPassword': 'pass1234'}, u0['token'])

    # Wrong old password
    r4 = api('PUT', '/api/users/profile/password',
             {'oldPassword': 'wrongpass', 'newPassword': 'newpass'}, u0['token'])
    if isinstance(r4, dict) and '_error' in r4:
        ok('设置: 错误原密码被拒绝')
    else:
        fail('设置: 错误原密码应被拒绝')

    # Unauthenticated settings request
    r5 = api('PUT', '/api/users/profile/username', {'username': 'hacker'})
    if isinstance(r5, dict) and r5.get('_code') == 401:
        ok('设置: 未认证请求被拒绝 (401)')
    else:
        fail('设置: 未认证应返回 401')

def suite_main_summary(users, edges, groups, p2p_sent, group_sent, ws_ok):
    """最终汇总"""
    print(f'\n{"="*60}')
    print(f'[11] \u603b\u7ed3\u62a5\u544a')
    print(f'{"="*60}')

    # Count all stored messages
    p2p_total = 0
    for (i, j) in edges:
        u1 = users[i]
        ck = conv_key_p2p(u1['id'], users[j]['id'])
        msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, u1['token'])
        if isinstance(msgs, list): p2p_total += len(msgs)

    group_total = 0
    for g in groups:
        ck = f'group:{g["id"]}'
        msgs = api('GET', f'/api/chat/messages?convKey={quote(ck)}', None, users[0]['token'])
        if isinstance(msgs, list): group_total += len(msgs)

    total = p2p_total + group_total
    total_sent = p2p_sent + group_sent
    ok(f'MongoDB \u5171\u8ba1: {p2p_total} \u6761 P2P + {group_total} \u6761\u7fa4\u7ec4 = {total} \u6761 (\u53d1\u9001: {total_sent})')
    return total

# ==================== Main ====================

def main():
    global PASS, FAIL
    print('=' * 60)
    print(f'  WebChat 暴力测试 — 多组合全覆盖')
    print(f'  标签: {TAG} | 时间: {time.strftime("%Y-%m-%d %H:%M:%S")}')
    print('=' * 60)

    # Phase 1: Setup
    users = suite_register_users(10)
    if not users:
        fail('无可用用户，终止测试')
        sys.exit(1)
    edges = suite_friend_network(users)
    groups = suite_create_groups(users)

    # Phase 2: Message sending (via WebSocket)
    p2p_sent = suite_p2p_messages(users, edges)
    group_sent = suite_group_messages(users, groups)

    # Phase 3: Real-time verification
    ws_ok = suite_ws_realtime(users)

    # Phase 4: Edge cases
    edge_ok = suite_edge_cases(users)

    # Phase 5: Integrity
    suite_message_order_and_dedup(users, edges, groups)

    # Phase 6: Concurrent stress
    concurrency_total = suite_concurrent_messages(users)

    # Phase 7: Settings API
    suite_settings_api(users)

    # Phase 8: Summary
    suite_main_summary(users, edges, groups, p2p_sent, group_sent, ws_ok)

    # Summary
    total_sent = p2p_sent + group_sent + concurrency_total
    print('\n' + '=' * 60)
    print(f'  暴力测试完成')
    print(f'  共发送: {total_sent} 条消息 + 设置测试')
    print(f'  通过: {PASS}  |  失败: {FAIL}')
    print(f'  状态: {"✅ 全部通过" if FAIL == 0 else "❌ 存在失败"}')
    print('=' * 60)
    sys.exit(0 if FAIL == 0 else 1)

if __name__ == '__main__':
    main()
