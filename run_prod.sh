#!/bin/bash
# WebChat 生产启动脚本（单端口 3000）
set -e
export JAVA_HOME=/opt/jdk25
export PATH=$JAVA_HOME/bin:$PATH
cd "$(dirname "$0")"

# 1) 后端
nohup java -jar packages/server/target/webchat-server-1.0.0.jar --server.port=8080 > /tmp/backend.log 2>&1 &
echo "backend pid=$!"

# 2) 单端口前端 + 代理
sleep 6
nohup python3 serve.py packages/frontend/dist > /tmp/serve.log 2>&1 &
echo "web pid=$!"
