
# shadmin



English | [简体中文](https://github.com/antna7/shadmin5/main/README.Zh-cn.md)

## 技术栈更新版本

基于 **Go 1.25+**、**Gin 1.11+**、**PostgreSQL 18+** 和 **纯 HTML 5** 的单体架构权限管理系统。

### 核心技术栈

- **后端框架**: Gin 1.11+
- **编程语言**: Go 1.25+
- **数据库**: PostgreSQL 18+
- **前端技术**: 纯 HTML 5 + CSS 3 + JavaScript (ES6+)
- **架构模式**: 单体架构（Monolithic Architecture）

### 架构特点

本版本采用单体架构设计，前后端整合在同一应用中，具有以下特点：

- 部署简单，只需一个应用实例
- 开发效率高，无需维护多个项目
- 资源消耗少，适合中小型项目
- 易于调试和维护

## Ready to work

### 环境要求

- **Go**: 1.25 或更高版本
- **PostgreSQL**: 18 或更高版本
- **Git**: 用于代码管理

注意：本版本采用单体架构，前端使用纯 HTML 5，无需安装 Node.js 和 npm。

## 📦 本地开发

### 环境要求

- Go 1.25+
- PostgreSQL 18+

### 获取代码

```bash
# 克隆项目
git clone <your-repository-url>
cd shanhaiadmin5
```

注意：本版本为单体架构，前端页面已集成在项目中，无需单独克隆前端项目。

### 启动说明

#### 配置数据库

1. 安装 PostgreSQL 18+
2. 创建数据库：

```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE sh_admin;

# 退出
\q
```

3. 修改配置文件 `config/settings.yml`：

```yaml
database:
  driver: postgres
  source: host=127.0.0.1 port=5432 user=postgres password=你的密码 dbname=sh_admin sslmode=disable TimeZone=Asia/Shanghai
```

#### 编译和运行

```bash
# 更新依赖
go mod tidy

# 编译项目
go build

# 初始化数据库（首次运行）
./shadmin migrate -c config/settings.yml

# 启动服务
./shadmin server -c config/settings.yml
```

服务启动后，访问 http://localhost:8000 即可看到登录页面。

默认账号密码：admin / 123456

:::tip ⚠️Note that this problem will occur if CGO is not installed in the windows10+ environment;

```bash
E:\shadmin>go build
# github.com/mattn/go-sqlite3
cgo: exec /missing-cc: exec: "/missing-cc": file does not exist
```

or

```bash
D:\Code\shadmin>go build
# github.com/mattn/go-sqlite3
cgo: exec gcc: exec: "gcc": executable file not found in %PATH%
```

[Solve the cgo problem and enter](https://doc.go-admin.dev/guide/faq#cgo-%E7%9A%84%E9%97%AE%E9%A2%98)

:::

#### Initialize the database, and start the service

``` bash
# The first configuration needs to initialize the database resource information
# Use under macOS or linux
$ ./shadmin migrate -c config/settings.dev.yml

# ⚠️Note: Use under windows
$ shadmin.exe migrate -c config/settings.dev.yml

# Start the project, you can also use the IDE for debugging
# Use under macOS or linux
$ ./shadmin server -c config/settings.yml

# ⚠️Note: Use under windows
$ shadmin.exe server -c config/settings.yml
```

#### Use docker to compile and start

```shell
# Compile the image
docker build -t shadmin .


# Start the container, the first shadmin is the container name, and the second shadmin is the image name
# -v Mapping configuration file Local path: container path
docker run --name shadmin -p 8000:8000 -v /config/settings.yml:/config/settings.yml -d shadmin
```



#### Generation Document

```bash
go generate
```

#### Cross compile
```bash
# windows
env GOOS=windows GOARCH=amd64 go build main.go

# or
# linux
env GOOS=linux GOARCH=amd64 go build main.go
```

### 项目结构

```
shadmin/
├── app/              # 应用层
│   ├── admin/       # 管理后台模块
│   ├── jobs/        # 定时任务模块
│   └── other/       # 其他模块
├── cmd/             # 命令行工具
├── common/          # 公共组件
├── config/          # 配置文件
├── static/          # 静态资源（前端页面）
│   ├── html/       # HTML 页面
│   ├── css/        # 样式文件
│   └── js/         # JavaScript 文件
└── docs/            # 文档
```




