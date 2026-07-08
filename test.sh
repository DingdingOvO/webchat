#!/bin/bash
# ============================================================
# WebChat 全量功能测试
# ============================================================

PASS=0
FAIL=0
BASE="http://localhost:8080"
TS=$(date +%s)
U1="tester_${TS}"
U2="friend_${TS}"
AUTH=""
AUTH2=""
USER_ID=""
FRIEND_ID=""

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  ✅ $desc"; PASS=$((PASS+1))
  else
    echo "  ❌ $desc (期望: $expected, 实际: $actual)"; FAIL=$((FAIL+1))
  fi
}

assert_contains() {
  local desc="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    echo "  ✅ $desc"; PASS=$((PASS+1))
  else
    echo "  ❌ $desc (未找到: $needle)"; FAIL=$((FAIL+1))
  fi
}

echo ""
echo "=========================================="
echo " WebChat 功能测试 (时间戳: $TS)"
echo "=========================================="
echo ""

# ---- 1. 服务器状态 ----
echo "【1/8】服务器状态"
assert_eq "根路径返回 200" "200" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/)"

# ---- 2. 注册 ----
echo ""
echo "【2/8】用户注册"
R1=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$U1\",\"password\":\"test1234\",\"nickname\":\"Tester\"}")
assert_contains "注册成功返回 token" "token" "$R1"
AUTH=$(echo "$R1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
USER_ID=$(echo "$R1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('userId',''))" 2>/dev/null)
assert_contains "注册返回 userId" "[0-9]" "$USER_ID"

R1b=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$U1\",\"password\":\"test1234\"}")
assert_contains "重复注册拒绝" "error" "$R1b"

# ---- 3. 登录 ----
echo ""
echo "【3/8】用户登录"
R2=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$U1\",\"password\":\"test1234\"}")
assert_contains "登录返回 token" "token" "$R2"
AUTH=$(echo "$R2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

R2b=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$U1\",\"password\":\"wrongpass\"}")
assert_contains "错误密码拒绝" "error" "$R2b"

if [ -z "$AUTH" ]; then
  echo "  ⚠️  无 token，终止测试"
  exit 1
fi

# ---- 4. 用户与好友 ----
echo ""
echo "【4/8】用户与好友"

# 注册第二个用户
R3=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$U2\",\"password\":\"123456\",\"nickname\":\"Friend\"}")
FRIEND_ID=$(echo "$R3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('userId',''))" 2>/dev/null)
AUTH2=$(echo "$R3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 搜索
R4=$(curl -s "$BASE/api/users/search?q=$U2" \
  -H "Authorization: Bearer $AUTH")
assert_contains "搜索找到好友" "$U2" "$R4"

# 好友列表（空）
R5=$(curl -s "$BASE/api/users/friends" \
  -H "Authorization: Bearer $AUTH")
assert_eq "好友列表为空" "[]" "$R5"

# 发送好友请求
R6=$(curl -s -X POST "$BASE/api/users/friend-request" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH" \
  -d "{\"userId\": $FRIEND_ID}")
assert_contains "好友请求发送成功" "ok" "$R6"

# 对方查看待处理
R7=$(curl -s "$BASE/api/users/friend-requests/pending" \
  -H "Authorization: Bearer $AUTH2")
assert_contains "对方看到待处理" "PENDING" "$R7"

# 接受请求
REQ_ID=$(echo "$R7" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])" 2>/dev/null)
R8=$(curl -s -X POST "$BASE/api/users/friend-requests/$REQ_ID/accept" \
  -H "Authorization: Bearer $AUTH2")
assert_contains "接受请求成功" "ok" "$R8"

# 好友列表（应有1人）
R9=$(curl -s "$BASE/api/users/friends" \
  -H "Authorization: Bearer $AUTH")
assert_contains "好友列表有数据" "$U2" "$R9"

# ---- 5. 群组 ----
echo ""
echo "【5/8】群组管理"
R10=$(curl -s -X POST "$BASE/api/users/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH" \
  -d "{\"name\":\"群_${TS}\",\"memberIds\":[$FRIEND_ID]}")
assert_contains "创建群组成功" "memberCount" "$R10"

GROUP_ID=$(echo "$R10" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
MC=$(echo "$R10" | python3 -c "import sys,json; print(json.load(sys.stdin).get('memberCount',0))" 2>/dev/null)
assert_contains "群组 memberCount>0" "[1-9]" "$MC"

R11=$(curl -s "$BASE/api/users/groups/$GROUP_ID/members" \
  -H "Authorization: Bearer $AUTH")
assert_contains "群成员列表有数据" "username" "$R11"

# ---- 6. 消息 ----
echo ""
echo "【6/8】消息存储"
R12=$(curl -s "$BASE/api/chat/messages?convKey=p2p:1:999" \
  -H "Authorization: Bearer $AUTH")
if [ "$R12" = "[]" ]; then
  echo "  ✅ 不存在的空会话返回空数组"; PASS=$((PASS+1))
else
  echo "  ❌ 不存在的空会话应返回空数组 (实际: $R12)"; FAIL=$((FAIL+1))
fi

# ---- 7. 安全 ----
echo ""
echo "【7/8】安全校验"
R13=$(curl -s "$BASE/api/users/friends" \
  -H "Authorization: Bearer invalidtoken")
assert_contains "无效 token 拒绝" "未授权" "$R13"

assert_eq "无认证返回 401" "401" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/auth/me)"

# ---- 8. 综合 ----
echo ""
echo "【8/8】综合验证"
R14=$(curl -s "$BASE/api/auth/me" \
  -H "Authorization: Bearer $AUTH")
assert_contains "获取当前用户" "$U1" "$R14"

echo ""
echo "=========================================="
echo " 测试结果"
echo "  通过: $PASS / 失败: $FAIL"
echo "=========================================="
echo ""
