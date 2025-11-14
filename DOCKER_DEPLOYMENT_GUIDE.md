# SHAdmin Docker 部署指南

## 📋 部署前检查清单

### 1. 系统要求
- ✅ Docker 20.10+
- ✅ Docker Compose 2.0+
- ✅ 至少2GB可用内存
- ✅ 至少10GB可用磁盘空间

### 2. 必要文件检查

运行以下命令检查所有必要文件是否存在：

```bash
# 进入项目目录
cd /path/to/shanhaiadmin5

# 检查关键文件
ls -la Dockerfile.prod
ls -la docker-compose.prod.yml
ls -la config/settings.prod.yml
ls -la go.mod
ls -la main.go
ls -la static/html/login.html
ls -la static/html/index.html
ls -la static/js/login.js
ls -la static/js/app.js
ls -la static/css/style.css
```

### 3. 配置文件检查

#### ⚠️ 重要：修改生产环境密钥

在部署前，**必须**修改 `config/settings.prod.yml` 中的JWT密钥：

```bash
# 生成强随机密钥
openssl rand -base64 32

# 编辑配置文件
vi config/settings.prod.yml

# 修改这一行：
# secret: CHANGE_THIS_SECRET_IN_PRODUCTION_USE_STRONG_PASSWORD
# 替换为刚才生成的随机字符串
```

## 🚀 快速部署步骤

### 方式一：使用预编译镜像（推荐）

如果你已经在有网络的机器上构建好了镜像：

```bash
# 1. 加载镜像（如果是从其他机器导出的）
docker load < shadmin-latest.tar

# 2. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 查看日志
docker-compose -f docker-compose.prod.yml logs -f shadmin-app
```

### 方式二：从源码构建

```bash
# 1. 构建镜像
docker-compose -f docker-compose.prod.yml build

# 2. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 📝 详细部署流程

### 步骤 1: 准备环境

```bash
# 检查Docker版本
docker --version
docker-compose --version

# 确保Docker服务运行
systemctl status docker

# 如果未运行，启动Docker
sudo systemctl start docker
```

### 步骤 2: 下载/克隆源代码

```bash
# 如果从Git克隆
git clone <your-repository-url>
cd shanhaiadmin5

# 或者如果是下载的压缩包
unzip shanhaiadmin5.zip
cd shanhaiadmin5
```

### 步骤 3: 配置修改

编辑 `config/settings.prod.yml`：

```yaml
settings:
  jwt:
    secret: YOUR_STRONG_SECRET_HERE  # ⚠️ 必须修改
  database:
    source: host=postgres port=5432 user=postgres password=postgres dbname=sh_admin sslmode=disable
```

如需修改数据库密码，同时修改 `docker-compose.prod.yml`：

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: your_strong_password  # 修改这里
```

### 步骤 4: 构建镜像

```bash
# 使用生产环境配置构建
docker-compose -f docker-compose.prod.yml build --no-cache

# 查看构建的镜像
docker images | grep shadmin
```

### 步骤 5: 启动服务

```bash
# 启动所有服务（后台运行）
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps
```

### 步骤 6: 初始化数据库

#### 方法一：自动初始化（首次启动）

应用会自动创建表结构。如需初始化示例数据：

```bash
# 进入应用容器
docker exec -it shadmin-app sh

# 运行数据库迁移（如果提供）
./shadmin migrate -c /app/config/settings.prod.yml

# 退出容器
exit
```

#### 方法二：手动导入SQL

```bash
# 进入PostgreSQL容器
docker exec -it shadmin-postgres psql -U postgres -d sh_admin

# 在psql命令行中执行初始化脚本
# 或者从外部导入
docker exec -i shadmin-postgres psql -U postgres -d sh_admin < config/db.sql
```

### 步骤 7: 验证部署

```bash
# 1. 检查容器状态
docker-compose -f docker-compose.prod.yml ps

# 2. 检查应用日志
docker-compose -f docker-compose.prod.yml logs -f shadmin-app

# 3. 检查数据库连接
docker exec shadmin-postgres pg_isready -U postgres

# 4. 测试HTTP访问
curl http://localhost:8000/api/v1/health

# 5. 在浏览器中访问
# http://localhost:8000/login
```

### 步骤 8: 创建默认管理员账号

如果是全新部署且没有导入初始数据，需要创建管理员账号：

```bash
# 进入PostgreSQL容器
docker exec -it shadmin-postgres psql -U postgres -d sh_admin

# 创建管理员账号（示例SQL，根据实际表结构调整）
INSERT INTO sys_user (username, password, nick_name, phone, email, status, create_time)
VALUES ('admin', 'e10adc3949ba59abbe56e057f20f883e', '超级管理员', '13800138000', 'admin@shadmin.com', '2', NOW());
# 注意：上面的密码是'123456'的MD5值，实际使用请根据系统的加密方式调整
```

## 🔍 故障排查

### 问题 1: 容器启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs

# 查看特定服务日志
docker logs shadmin-app
docker logs shadmin-postgres

# 检查容器状态
docker-compose -f docker-compose.prod.yml ps -a
```

### 问题 2: 数据库连接失败

```bash
# 1. 确认PostgreSQL已启动
docker-compose -f docker-compose.prod.yml ps postgres

# 2. 测试数据库连接
docker exec shadmin-postgres psql -U postgres -c "SELECT version();"

# 3. 检查应用配置
docker exec shadmin-app cat /app/config/settings.prod.yml | grep source

# 4. 网络连通性测试
docker exec shadmin-app ping -c 3 postgres
```

### 问题 3: 无法访问Web界面

```bash
# 1. 检查端口映射
docker port shadmin-app

# 2. 检查防火墙
sudo firewall-cmd --list-ports
sudo ufw status

# 3. 确认服务监听
docker exec shadmin-app netstat -tlnp | grep 8000

# 4. 测试本地访问
curl http://localhost:8000/
```

### 问题 4: 静态文件404

```bash
# 检查静态文件挂载
docker exec shadmin-app ls -la /app/static/

# 检查HTML文件
docker exec shadmin-app ls -la /app/static/html/

# 检查JS/CSS文件
docker exec shadmin-app ls -la /app/static/js/
docker exec shadmin-app ls -la /app/static/css/
```

## 🛠️ 运维命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs

# 实时跟踪日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs shadmin-app
docker-compose -f docker-compose.prod.yml logs postgres

# 查看最近100行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml stop

# 停止特定服务
docker-compose -f docker-compose.prod.yml stop shadmin-app

# 停止并删除容器
docker-compose -f docker-compose.prod.yml down

# 停止并删除容器+数据卷（⚠️ 会删除数据库数据）
docker-compose -f docker-compose.prod.yml down -v
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启应用服务
docker-compose -f docker-compose.prod.yml restart shadmin-app

# 重启数据库
docker-compose -f docker-compose.prod.yml restart postgres
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose -f docker-compose.prod.yml build --no-cache shadmin-app

# 3. 重启应用服务
docker-compose -f docker-compose.prod.yml up -d shadmin-app

# 4. 查看启动日志
docker-compose -f docker-compose.prod.yml logs -f shadmin-app
```

### 数据备份

```bash
# 备份PostgreSQL数据库
docker exec shadmin-postgres pg_dump -U postgres sh_admin > backup_$(date +%Y%m%d_%H%M%S).sql

# 备份数据卷
docker run --rm -v shadmin_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-backup-$(date +%Y%m%d).tar.gz /data

# 备份配置文件
tar czf config-backup-$(date +%Y%m%d).tar.gz config/
```

### 数据恢复

```bash
# 恢复数据库
cat backup.sql | docker exec -i shadmin-postgres psql -U postgres sh_admin

# 恢复数据卷（需要先停止服务）
docker-compose -f docker-compose.prod.yml stop postgres
docker run --rm -v shadmin_postgres-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres-data-backup.tar.gz --strip 1"
docker-compose -f docker-compose.prod.yml start postgres
```

## 🔐 安全加固建议

### 1. 修改默认密码

```bash
# 修改数据库密码
docker exec -it shadmin-postgres psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_strong_password';
\q

# 同步更新 docker-compose.prod.yml 和 settings.prod.yml
```

### 2. 使用环境变量存储敏感信息

创建 `.env` 文件：

```bash
cat > .env << EOF
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
EOF

# 修改 docker-compose.prod.yml 使用环境变量
```

### 3. 配置反向代理（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 启用HTTPS

```bash
# 使用Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### 5. 限制容器资源

在 `docker-compose.prod.yml` 中添加：

```yaml
services:
  shadmin-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 📊 性能监控

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器
docker stats shadmin-app shadmin-postgres

# 查看磁盘使用
docker system df

# 查看数据卷大小
docker volume ls
docker volume inspect shadmin_postgres-data
```

## 🔄 开发环境 vs 生产环境

| 特性 | 开发环境 | 生产环境 |
|------|----------|----------|
| 配置文件 | settings.yml | settings.prod.yml |
| 日志级别 | debug/trace | info/warn |
| Swagger文档 | 启用 | 禁用 |
| 数据库日志 | 启用 | 禁用 |
| JWT密钥 | 简单密钥 | 强随机密钥 |
| Token超时 | 1小时 | 2小时 |

## 📞 技术支持

遇到问题？

1. 检查本文档的"故障排查"章节
2. 查看应用日志：`docker-compose -f docker-compose.prod.yml logs`
3. 查看 [DEPLOYMENT_NOTES.md](./DEPLOYMENT_NOTES.md) 了解技术架构
4. 提交Issue到项目仓库

---

**部署日期**: 2025-01-14
**版本**: SHAdmin v2.0.0
**技术栈**: Go 1.24 + Gin 1.11 + PostgreSQL 18 + Docker
