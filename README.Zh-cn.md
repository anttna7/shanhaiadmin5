# SHAdmin

[English](https://github.com/anttna7/shadmin5/main/README.md) | 简体中文

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

## ✨ 特性

- 遵循 RESTful API 设计规范

- 基于 GIN WEB API 框架，提供了丰富的中间件支持（用户认证、跨域、访问日志、追踪ID等）

- 基于Casbin的 RBAC 访问控制模型

- JWT 认证

- 支持 Swagger 文档(基于swaggo)

- 基于 GORM 的数据库存储，可扩展多种类型数据库

- 配置文件简单的模型映射，快速能够得到想要的配置

- 代码生成工具

- 表单构建工具

- 多指令模式

- 多租户的支持

- TODO: 单元测试

## 🎁 内置

1. 多租户：系统默认支持多租户，按库分离，一个库一个租户。
1. 用户管理：用户是系统操作者，该功能主要完成系统用户配置。
2. 部门管理：配置系统组织机构（公司、部门、小组），树结构展现支持数据权限。
3. 岗位管理：配置系统用户所属担任职务。
4. 菜单管理：配置系统菜单，操作权限，按钮权限标识，接口权限等。
5. 角色管理：角色菜单权限分配、设置角色按机构进行数据范围权限划分。
6. 字典管理：对系统中经常使用的一些较为固定的数据进行维护。
7. 参数管理：对系统动态配置常用参数。
8. 操作日志：系统正常操作日志记录和查询；系统异常信息日志记录和查询。
9. 登录日志：系统登录日志记录查询包含登录异常。
1. 接口文档：根据业务代码自动生成相关的api接口文档。
1. 代码生成：根据数据表结构生成对应的增删改查相对应业务，全程可视化操作，让基本业务可以零代码实现。
1. 表单构建：自定义页面样式，拖拉拽实现页面布局。
1. 服务监控：查看一些服务器的基本信息。
1. 内容管理：demo功能，下设分类管理、内容管理。可以参考使用方便快速入门。
1. 定时任务：自动化任务，目前支持接口调用和函数调用。

## 准备工作

### 环境要求

- **Go**: 1.25 或更高版本
- **PostgreSQL**: 18 或更高版本
- **Git**: 用于代码管理

⚠️ **重要提示**：本版本采用单体架构，前端使用纯 HTML 5，**无需安装 Node.js 和 npm**。


## 📦 本地开发

### 获取代码

```bash
# 克隆项目
git clone <your-repository-url>
cd shanhaiadmin5
```

**注意**：本版本为单体架构，前端页面已集成在项目中的 `static/` 目录，无需单独克隆前端项目。

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

⚠️ **Windows CGO 注意事项**：在 Windows 环境下如果没有安装 CGO，可能会出现以下错误：

```bash
E:\shadmin>go build
# github.com/mattn/go-sqlite3
cgo: exec /missing-cc: exec: "/missing-cc": file does not exist
```

或者：

```bash
D:\Code\shadmin>go build
# github.com/mattn/go-sqlite3
cgo: exec gcc: exec: "gcc": executable file not found in %PATH%
```

解决方案：安装 MinGW-w64 或使用纯 Go 驱动（本项目推荐使用 PostgreSQL，无 CGO 依赖）。


#### 初始化数据库和启动服务

``` bash
# 首次配置需要初始化数据库资源信息
# macOS or linux 下使用
$ ./shadmin migrate -c config/settings.dev.yml

# ⚠️注意:windows 下使用
$ shadmin.exe migrate -c config/settings.dev.yml


# 启动项目，也可以用IDE进行调试
# macOS or linux 下使用
$ ./shadmin server -c config/settings.yml


# ⚠️注意:windows 下使用
$ shadmin.exe server -c config/settings.yml
```

#### sys_api 表的数据如何添加

在项目启动时，使用 `-a true` 参数，系统会自动添加缺少的接口数据：
```bash
./shadmin server -c config/settings.yml -a true
```

#### 使用 Docker 编译启动

```shell
# 编译镜像
docker build -t shadmin .

# 启动容器，第一个 shadmin 是容器名字，第二个 shadmin 是镜像名称
# -v 映射配置文件 本地路径：容器路径
docker run --name shadmin -p 8000:8000 -v /config/settings.yml:/config/settings.yml -d shadmin
```

#### 文档生成

```bash
go generate
```

#### 交叉编译

```bash
# windows
env GOOS=windows GOARCH=amd64 go build main.go

# or
# linux
env GOOS=linux GOARCH=amd64 go build main.go
```

### UI交互端启动说明

```bash
# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npmmirror.com

# 启动服务
npm run dev
```


## 🤟 打赏

> 如果你觉得这个项目帮助到了你，你可以帮作者买一杯果汁表示鼓励 :tropical_drink:

<img class="no-margin" src="https://github/antna7/image/master/img/pay.png"  height="200px" >



## 🔑 License

内部使用

Copyright (c) 2025 
