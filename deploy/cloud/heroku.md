# ================================================================
# Heroku 部署
# 需要 Java 21 支持（Heroku 默认 Java 17 需额外配置）
# 安装: heroku create webchat-app
#       heroku stack:set container
#       git push heroku main
# ================================================================

# Heroku 使用 Container Registry + Docker 部署
# 前置条件:
#   heroku plugins:install @heroku-cli/plugin-container-registry
#
# 命令:
#   heroku create webchat-app --stack container
#   heroku addons:create jawsdb:kitefin        # MySQL
#   heroku addons:create mongodbye:free         # MongoDB
#   heroku addons:create rediscloud:30          # Redis
#   heroku config:set JWT_SECRET=your-secret
#   heroku container:push web
#   heroku container:release web
#   heroku open
