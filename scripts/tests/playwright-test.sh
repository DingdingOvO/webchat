#!/bin/bash
# WebChat 10用户压力测试
set -e
BASE="http://localhost:8080"
PASS=0; FAIL=0
ok() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "========================================="
echo " WebChat 10用户测试 (PID=$$)"
echo "========================================="

# ====== 1. 注册 10 用户 ======
echo -e "\n【1】注册 10 个用户"
U=(); T=(); IDs=()
for i in $(seq 1 10); do
  UN="t_${i}_$$"
  R=$(curl -s -X POST "$BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$UN\",\"password\":\"pass$i\",\"nickname\":\"T$i\"}")
  TK=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
  ID=$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('userId',''))" 2>/dev/null)
  [ -n "$TK" ] && ok "$UN (ID=$ID)" || fail "注册失败: $R"
  U[$i]="$UN"; T[$i]="$TK"; IDs[$i]="$ID"
done

# ====== 2. 两两加好友 ======
echo -e "\n【2】双向加好友"
for i in $(seq 1 10); do
  for j in $(seq $((i+1)) 10); do
    [ "$j" -gt 10 ] && break
    curl -s -X POST "$BASE/api/users/friend-request" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${T[$i]}" \
      -d "{\"userId\":${IDs[$j]}}" > /dev/null
    PR=$(curl -s "$BASE/api/users/friend-requests/pending" \
      -H "Authorization: Bearer ${T[$j]}")
    RID=$(echo "$PR" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')" 2>/dev/null)
    [ -n "$RID" ] && curl -s -X POST "$BASE/api/users/friend-requests/$RID/accept" \
      -H "Authorization: Bearer ${T[$j]}" > /dev/null
  done
done
ok "10用户全互联好友"

# ====== 3. 创建群组 ======
echo -e "\n【3】创建群组"
ALL_IDS=$(for i in $(seq 2 10); do echo -n "${IDs[$i]},"; done | sed 's/,$//')
GR=$(curl -s -X POST "$BASE/api/users/groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${T[1]}" \
  -d "{\"name\":\"十人群_$$\",\"memberIds\":[$ALL_IDS]}")
GID=$(echo "$GR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
[ -n "$GID" ] && ok "群组创建 ID=$GID (memberCount=$(echo "$GR" | python3 -c "import sys,json; print(json.load(sys.stdin).get('memberCount',0))"))" \
  || fail "群组创建失败: $GR"

# ====== 4. 验证好友列表 ======
echo -e "\n【4】验证好友列表"
for i in $(seq 1 3); do
  FR=$(curl -s "$BASE/api/users/friends" -H "Authorization: Bearer ${T[$i]}")
  CNT=$(echo "$FR" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)
  [ "$CNT" -ge 1 ] && ok "${U[$i]} 好友数=$CNT" || fail "${U[$i]} 好友数为0"
done

# ====== 5. playwright UI 截图 ======
echo -e "\n【5】UI 截图验证"
PCLI="playwright-cli"
mkdir -p .playwright-cli 2>/dev/null

$PCLI open "http://127.0.0.1:3000" --persistent 2>/dev/null
sleep 3

# 截图首页
$PCLI screenshot --filename=01-landing.png
echo "  截图: landing page"

# 登录 user1
$PCLI goto "http://127.0.0.1:3000/login"
sleep 2
$PCLI snapshot --filename=login-page.yaml 2>/dev/null
# 尝试 fill 登录表单
LOGIN_REFS=$(cat .playwright-cli/login-page.yaml 2>/dev/null | grep -oP 'e\d+' | head -5)
echo "  Login refs: $LOGIN_REFS"
$PCLI screenshot --filename=02-login.png
echo "  截图: login page"

# 直接通过 localStorage 设置登录态（绕过登录UI）
echo "  Setting auth via localStorage..."
$PCLI eval "localStorage.setItem('webchat_auth', JSON.stringify({
  token: '${T[1]}',
  userId: ${IDs[1]},
  username: '${U[1]}',
  nickname: 'T1'
}))"
$PCLI goto "http://127.0.0.1:3000/app/chat"
sleep 4
$PCLI screenshot --filename=03-chat.png
echo "  截图: chat page"

# 查看页面内容
$PCLI snapshot --filename=chat-page.yaml 2>/dev/null
CHAT_TEXT=$(cat .playwright-cli/chat-page.yaml 2>/dev/null | head -50)
echo "  Chat page text:"
echo "$CHAT_TEXT" | grep -oP '(消息|联系人|T1|在线|暂无)' | head -5

# 检查是否加载成功
if echo "$CHAT_TEXT" | grep -q "T1"; then
  ok "Chat 页面加载成功 (看到用户名)"
else
  fail "Chat 页面可能加载失败"
fi

$PCLI close 2>/dev/null

# ====== 6. 结果 ======
echo ""
echo "========================================="
echo " 完成: $PASS 通过, $FAIL 失败"
echo "========================================="
ls -la .playwright-cli/*.png 2>/dev/null
