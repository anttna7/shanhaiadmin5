# 🚀 SHAdmin Docker 部署快速检查清单

## ✅ 部署前检查（在下载后立即检查）

### 1. 文件完整性检查

```bash
cd shanhaiadmin5

# 检查核心文件
[ -f "Dockerfile.prod" ] && echo "✅ Dockerfile.prod" || echo "❌ 缺少 Dockerfile.prod"
[ -f "docker-compose.prod.yml" ] && echo "✅ docker-compose.prod.yml" || echo "❌ 缺少 docker-compose.prod.yml"
[ -f "go.mod" ] && echo "✅ go.mod" || echo "❌ 缺少 go.mod"
[ -f "go.sum" ] && echo "✅ go.sum" || echo "❌ 缺少 go.sum"
[ -f "main.go" ] && echo "✅ main.go" || echo "❌ 缺少 main.go"

# 检查配置文件
[ -f "config/settings.prod.yml" ] && echo "✅ settings.prod.yml" || echo "❌ 缺少 settings.prod.yml"
[ -f "config/settings.yml" ] && echo "✅ settings.yml" || echo "❌ 缺少 settings.yml"

# 检查前端文件
[ -f "static/html/login.html" ] && echo "✅ login.html" || echo "❌ 缺少 login.html"
[ -f "static/html/index.html" ] && echo "✅ index.html" || echo "❌ 缺少 index.html"
[ -f "static/js/login.js" ] && echo "✅ login.js" || echo "❌ 缺少 login.js"
[ -f "static/js/app.js" ] && echo "✅ app.js" || echo "❌ 缺少 app.js"
[ -f "static/js/components.js" ] && echo "✅ components.js" || echo "❌ 缺少 components.js"
[ -f "static/css/style.css" ] && echo "✅ style.css" || echo "❌ 缺少 style.css"
[ -f "static/css/components.css" ] && echo "✅ components.css" || echo "❌ 缺少 components.css"

# 检查后端核心目录
[ -d "app/admin" ] && echo "✅ app/admin" || echo "❌ 缺少 app/admin"
[ -d "cmd" ] && echo "✅ cmd" || echo "❌ 缺少 cmd"
[ -d "common" ] && echo "✅ common" || echo "❌ 缺少 common"

echo ""
echo "文件检查完成！如果有❌标记，请重新下载完整源代码。"
```

### 2. 目录结构检查

```bash
tree -L 2 -d
```

预期输出：
```
.
├── app
│   ├── admin
│   ├── jobs
│   └── other
├── cmd
├── common
│   ├── database
│   ├── middleware
│   └── global
├── config
├── docs
├── static
│   ├── css
│   ├── html
│   └── js
└── temp
```

### 3. 环境检查

```bash
# Docker版本检查
docker --version          # 需要 >= 20.10
docker-compose --version  # 需要 >= 2.0

# 系统资源检查
free -h                   # 至少2GB可用内存
df -h                     # 至少10GB可用磁盘

# 端口检查（确保8000和5432端口未被占用）
netstat -tlnp | grep -E ':(8000|5432)'
# 或者
lsof -i :8000
lsof -i :5432
```

## ⚙️ 配置修改检查

### ⚠️ 必须修改的配置

```bash
# 1. 生成JWT密钥
openssl rand -base64 32

# 2. 编辑生产配置
vi config/settings.prod.yml

# 必须修改：
# - jwt.secret: 替换为上面生成的随机密钥
# - database.source: 确认数据库密码正确
```

### 可选修改的配置

```yaml
# docker-compose.prod.yml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: postgres  # 可修改为更强的密码
    ports:
      - "5432:5432"                # 可修改为其他端口避免冲突

  shadmin-app:
    ports:
      - "8000:8000"                # 可修改为其他端口
```

## 🏗️ 构建与部署检查

### 步骤1: 构建镜像

```bash
# 清理旧镜像（可选）
docker rmi shadmin:latest 2>/dev/null || true

# 构建新镜像
docker-compose -f docker-compose.prod.yml build --no-cache

# ✅ 检查点：镜像是否构建成功
docker images | grep shadmin
# 应该看到 shadmin:latest 镜像
```

### 步骤2: 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d

# ✅ 检查点：容器是否正在运行
docker-compose -f docker-compose.prod.yml ps
# 应该看到两个容器：shadmin-app 和 shadmin-postgres，状态都是 Up
```

### 步骤3: 健康检查

```bash
# 等待30-60秒让服务完全启动，然后执行：

# 1. PostgreSQL健康检查
docker exec shadmin-postgres pg_isready -U postgres
# 预期输出：/var/run/postgresql:5432 - accepting connections

# 2. 应用健康检查
curl http://localhost:8000/api/v1/health
# 预期输出：{"status":"ok"} 或类似的成功响应

# 3. 查看应用日志（确保没有ERROR）
docker-compose -f docker-compose.prod.yml logs shadmin-app | tail -50
# 应该看到类似 "Server started on :8000" 的消息
```

## 🌐 Web访问检查

### 1. 测试登录页

```bash
# 命令行测试
curl -I http://localhost:8000/login
# 预期：HTTP/1.1 200 OK

# 浏览器访问
# 打开：http://localhost:8000/login
# ✅ 应该看到登录界面，包含：
#    - 用户名输入框
#    - 密码输入框
#    - 验证码输入框和图片
#    - 登录按钮
```

### 2. 测试静态资源

```bash
# 测试CSS加载
curl -I http://localhost:8000/static/css/style.css
# 预期：HTTP/1.1 200 OK

# 测试JS加载
curl -I http://localhost:8000/static/js/login.js
# 预期：HTTP/1.1 200 OK

# 浏览器开发者工具检查
# F12 -> Network -> 刷新页面
# ✅ 所有静态资源应该返回 200 状态码
```

### 3. 测试验证码

```bash
# 浏览器访问登录页
# ✅ 检查点：
#    1. 验证码图片能正常显示
#    2. 点击验证码图片可以刷新
#    3. 验证码显示清晰，有干扰线和噪点
```

## 🗄️ 数据库检查

### 1. 数据库连接测试

```bash
# 进入PostgreSQL容器
docker exec -it shadmin-postgres psql -U postgres -d sh_admin

# 执行测试查询
\dt                          # 列出所有表
SELECT version();            # 查看PostgreSQL版本
\q                           # 退出
```

### 2. 表结构检查

```bash
# 查看主要表是否存在
docker exec shadmin-postgres psql -U postgres -d sh_admin -c "\dt" | grep -E "sys_user|sys_role|sys_menu|sys_dept"

# ✅ 预期应该看到这些表：
# - sys_user (用户表)
# - sys_role (角色表)
# - sys_menu (菜单表)
# - sys_dept (部门表)
# - sys_tenant (租户表 - 如果启用多租户)
```

### 3. 初始数据检查

```bash
# 检查是否有初始管理员账号
docker exec shadmin-postgres psql -U postgres -d sh_admin -c "SELECT username, nick_name FROM sys_user LIMIT 5;"

# 如果没有数据，需要导入初始数据：
docker exec -i shadmin-postgres psql -U postgres -d sh_admin < config/db.sql
```

## 🔐 登录功能测试

### 默认管理员账号（如果已导入初始数据）

```
用户名: admin
密码: 123456
```

### 测试步骤

```bash
# 1. 访问登录页
http://localhost:8000/login

# 2. 输入凭据
用户名：admin
密码：123456
验证码：（输入图片中显示的验证码）

# 3. 点击登录

# ✅ 成功标准：
#    - 显示"登录成功，正在跳转..."
#    - 自动跳转到系统主页 http://localhost:8000/
#    - 主页显示仪表板和侧边栏菜单
#    - 能看到用户统计、角色统计等数据
```

### 登录失败场景测试

```bash
# 测试1: 验证码错误
# 输入错误验证码 -> 应显示"验证码错误，请重新输入"

# 测试2: 密码错误
# 输入错误密码 -> 应显示"登录失败，请检查用户名和密码"

# 测试3: 用户名不存在
# 输入不存在的用户名 -> 应显示相应错误信息
```

## 📱 响应式布局测试

### 移动端测试

```bash
# 1. 浏览器开发者工具 (F12)
# 2. 切换到移动设备模式 (Ctrl+Shift+M)
# 3. 选择设备: iPhone 12 Pro / Pixel 5 等

# ✅ 检查点：
#    - 登录页在小屏幕上正常显示
#    - 主页侧边栏隐藏，显示汉堡菜单按钮
#    - 点击汉堡菜单，侧边栏从左侧滑入
#    - 点击遮罩层，侧边栏关闭
#    - 表格在移动端可以横向滚动
#    - 按钮触摸目标足够大（最小44px）
```

## 📊 性能检查

### 容器资源使用

```bash
# 实时监控
docker stats shadmin-app shadmin-postgres

# ✅ 正常指标：
# shadmin-app: CPU < 10%, MEM < 500MB (空闲时)
# shadmin-postgres: CPU < 5%, MEM < 200MB (空闲时)
```

### 应用响应时间

```bash
# 测试登录页加载时间
time curl http://localhost:8000/login > /dev/null

# ✅ 应该 < 1秒

# 测试API响应时间
time curl http://localhost:8000/api/v1/health

# ✅ 应该 < 200ms
```

## 🔥 常见问题快速修复

### 问题1: 容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs

# 常见原因：
# 1. 端口被占用 -> 修改docker-compose.prod.yml中的端口映射
# 2. 内存不足 -> 释放系统内存或增加swap
# 3. 配置文件错误 -> 检查settings.prod.yml语法
```

### 问题2: 数据库连接失败

```bash
# 1. 确认PostgreSQL容器运行
docker-compose -f docker-compose.prod.yml ps postgres

# 2. 检查数据库健康状态
docker exec shadmin-postgres pg_isready -U postgres

# 3. 测试网络连通性
docker exec shadmin-app ping -c 3 postgres

# 4. 检查配置是否正确
docker exec shadmin-app cat /app/config/settings.prod.yml | grep source
```

### 问题3: 静态文件404

```bash
# 检查文件是否存在
docker exec shadmin-app ls -la /app/static/html/
docker exec shadmin-app ls -la /app/static/css/
docker exec shadmin-app ls -la /app/static/js/

# 如果文件缺失，检查Dockerfile.prod中的COPY命令
# 重新构建镜像
docker-compose -f docker-compose.prod.yml build --no-cache shadmin-app
docker-compose -f docker-compose.prod.yml up -d shadmin-app
```

### 问题4: 验证码不显示

```bash
# 1. 检查浏览器控制台错误
# F12 -> Console -> 查看错误信息

# 2. 检查login.js是否加载
curl http://localhost:8000/static/js/login.js | head -20

# 3. 确认Canvas支持
# 现代浏览器都支持，如果是IE浏览器，需要升级
```

## ✅ 最终验收清单

部署完成后，请依次确认以下项目：

- [ ] Docker容器全部正常运行（`docker-compose ps`显示所有服务Up）
- [ ] PostgreSQL健康检查通过
- [ ] 应用健康检查API返回成功
- [ ] 登录页可以正常访问
- [ ] 验证码图片正常显示和刷新
- [ ] 可以使用默认账号成功登录
- [ ] 登录后跳转到系统主页
- [ ] 仪表板数据正常显示
- [ ] 侧边栏菜单正常显示
- [ ] 移动端汉堡菜单功能正常
- [ ] 所有静态资源（CSS/JS）加载正常
- [ ] 日志中没有ERROR级别错误
- [ ] JWT密钥已修改为强随机值

**如果以上所有项目都打✅，恭喜！部署成功！🎉**

## 📚 相关文档

- [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) - 详细部署指南
- [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md) - 技术架构说明
- [README.md](./README.md) - 项目介绍

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) 的故障排查章节
2. 检查容器日志：`docker-compose -f docker-compose.prod.yml logs`
3. 提交Issue到项目仓库并附上完整错误日志

---

**部署时间**: _________
**部署人员**: _________
**部署状态**: ⭕ 成功 / ❌ 失败
**备注**: _________
