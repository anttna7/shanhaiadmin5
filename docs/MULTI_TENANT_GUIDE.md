# SHAdmin 多租户功能使用指南

## 概述

SHAdmin 实现了完整的多租户（Multi-Tenant）架构，支持租户隔离、租户管理员和细粒度的权限控制。

## 核心概念

### 1. 三级权限体系

#### 平台管理员 (Platform Admin)
- **标识**: `tenant_id = 0`
- **权限范围**: 全局
- **能力**:
  - 创建、管理所有租户
  - 查看所有租户的数据
  - 管理平台级别的角色和权限

#### 租户管理员 (Tenant Admin)
- **标识**: `tenant_id > 0` 且 `is_admin = true`
- **权限范围**: 本租户内
- **能力**:
  - 管理本租户的所有用户
  - 创建本租户的角色和权限
  - 创建其他租户管理员（权限不超过自己）
  - 无法访问其他租户的数据

#### 普通管理员 (Regular Admin)
- **标识**: `tenant_id > 0` 且 `is_admin = false`
- **权限范围**: 本租户内，受角色级别限制
- **能力**:
  - 管理权限级别低于自己的用户
  - 创建权限级别低于自己的角色
  - 无法创建租户管理员
  - 无法访问其他租户的数据

### 2. 角色级别 (Role Level)

角色级别用于实现权限继承控制：
- **级别 99**: 租户管理员（最高级别）
- **级别 1-98**: 普通管理员级别
- **级别 0**: 普通用户（默认）

**规则**: 管理员只能创建或修改级别**低于**自己的角色和用户。

## 功能说明

### 租户管理

#### 创建租户

**接口**: `POST /api/v1/tenant`

**权限**: 仅平台管理员

**请求示例**:
```json
{
  "tenantName": "测试公司",
  "tenantCode": "test_company",
  "contactName": "张三",
  "contactPhone": "13800138000",
  "contactEmail": "zhangsan@example.com",
  "status": "2",
  "maxUsers": 50,
  "expireTime": "2025-12-31",
  "remark": "测试租户",
  "adminUsername": "admin",
  "adminPassword": "Admin@123",
  "adminEmail": "admin@test.com"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": 1
}
```

创建成功后，系统会自动：
1. 创建租户记录
2. 创建租户管理员角色（role_level=99）
3. 创建租户管理员用户（is_admin=true）

#### 查询租户列表

**接口**: `GET /api/v1/tenant`

**权限**: 仅平台管理员

**查询参数**:
- `tenantName`: 租户名称（模糊查询）
- `tenantCode`: 租户代码（模糊查询）
- `status`: 状态（1-禁用，2-正常）
- `pageIndex`: 页码
- `pageSize`: 每页数量

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "tenantId": 1,
        "tenantName": "测试公司",
        "tenantCode": "test_company",
        "contactName": "张三",
        "contactPhone": "13800138000",
        "contactEmail": "zhangsan@example.com",
        "status": "2",
        "maxUsers": 50,
        "expireTime": "2025-12-31",
        "createdAt": "2025-11-13T10:00:00Z"
      }
    ],
    "count": 1,
    "pageIndex": 1,
    "pageSize": 10
  }
}
```

#### 更新租户

**接口**: `PUT /api/v1/tenant/:id`

**权限**: 仅平台管理员

**请求示例**:
```json
{
  "tenantName": "测试公司（已更新）",
  "contactName": "李四",
  "contactPhone": "13900139000",
  "maxUsers": 100,
  "status": "2"
}
```

#### 删除租户

**接口**: `DELETE /api/v1/tenant/:id`

**权限**: 仅平台管理员

**注意**: 删除租户前建议先清理租户下的所有数据。

### 租户管理员操作

#### 登录
租户管理员使用创建时设置的用户名密码登录：

```json
POST /api/v1/login
{
  "username": "admin",
  "password": "Admin@123"
}
```

登录后，JWT token 中会包含：
- `tenantId`: 租户ID
- `isAdmin`: true（租户管理员标识）
- `roleLevel`: 99（最高级别）

#### 创建租户用户

租户管理员可以创建本租户的用户：

```json
POST /api/v1/sys-user
{
  "username": "user001",
  "password": "User@123",
  "nickName": "普通用户",
  "email": "user001@test.com",
  "phone": "13800138001",
  "roleId": 2,
  "status": "2"
}
```

**权限检查**:
- 自动继承当前用户的 `tenantId`
- 不能创建其他租户的用户
- 不能创建角色级别高于自己的用户

#### 创建租户角色

租户管理员可以创建本租户的角色：

```json
POST /api/v1/sys-role
{
  "roleName": "部门经理",
  "roleKey": "dept_manager",
  "roleSort": 2,
  "roleLevel": 50,
  "status": "2",
  "dataScope": "2"
}
```

**权限检查**:
- 自动继承当前用户的 `tenantId`
- `roleLevel` 必须小于当前用户的角色级别
- 不能创建其他租户的角色

## 数据隔离机制

### 自动租户过滤

系统通过中间件自动为所有数据查询添加租户过滤：

```go
// 租户用户查询数据时，自动添加 WHERE tenant_id = ?
// 平台管理员查询数据时，不添加租户过滤
```

### 权限验证流程

1. **JWT Token 验证**: 提取用户信息和租户信息
2. **租户隔离**: 根据 tenantId 自动过滤数据
3. **角色级别检查**: 验证操作目标的角色级别
4. **权限验证**: 通过 Casbin 进行细粒度权限控制

## 最佳实践

### 1. 租户代码规范

租户代码（tenantCode）建议使用以下格式：
- 小写字母和下划线
- 具有业务含义
- 全局唯一
- 例如: `company_abc`, `org_xyz`

### 2. 用户数量规划

根据租户规模合理设置 `maxUsers`：
- 小型租户: 10-50 用户
- 中型租户: 50-200 用户
- 大型租户: 200-1000 用户

### 3. 角色级别设计

建议的角色级别划分：
- **级别 99**: 租户管理员（系统自动创建）
- **级别 80-90**: 高级管理员（副总、总监等）
- **级别 50-79**: 中级管理员（部门经理等）
- **级别 20-49**: 基层管理员（组长、主管等）
- **级别 1-19**: 特殊权限用户
- **级别 0**: 普通用户

### 4. 租户管理员管理

- 每个租户至少保持一个管理员
- 谨慎删除租户管理员
- 定期审查管理员权限
- 使用强密码策略

### 5. 数据安全

- 定期备份租户数据
- 监控跨租户访问尝试
- 审计租户管理员操作
- 及时处理到期租户

## 数据库迁移

首次使用多租户功能需要执行数据库迁移：

```bash
./shadmin migrate -c config/settings.yml
```

这将创建/更新以下表：
- `sys_tenant`: 租户表
- `sys_user`: 添加 tenant_id 和 is_admin 字段
- `sys_role`: 添加 tenant_id 和 role_level 字段

## API 接口列表

### 租户管理

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 租户列表 | GET | /api/v1/tenant | 平台管理员 | 获取所有租户 |
| 租户详情 | GET | /api/v1/tenant/:id | 平台管理员 | 获取指定租户详情 |
| 创建租户 | POST | /api/v1/tenant | 平台管理员 | 创建新租户 |
| 更新租户 | PUT | /api/v1/tenant/:id | 平台管理员 | 更新租户信息 |
| 删除租户 | DELETE | /api/v1/tenant/:id | 平台管理员 | 删除租户 |

## 常见问题

### Q1: 如何创建第一个租户？

A: 使用平台管理员账号（默认 admin）登录后，通过租户管理接口创建。

### Q2: 租户管理员忘记密码怎么办？

A: 平台管理员可以通过用户管理接口重置租户管理员密码。

### Q3: 如何限制租户的功能权限？

A: 通过 Casbin 配置租户角色的菜单和API权限。

### Q4: 租户之间的数据是否完全隔离？

A: 是的，数据在数据库层面通过 tenant_id 完全隔离。只有平台管理员可以跨租户查看数据。

### Q5: 可以将用户从一个租户转移到另一个租户吗？

A: 不建议。建议在目标租户重新创建用户。如必须转移，需要手动修改数据库的 tenant_id。

### Q6: 租户到期后会怎样？

A: 目前租户到期检查需要自行实现。建议在登录时检查租户状态和到期时间。

## 技术支持

如有问题，请：
1. 查看 DEPLOYMENT_NOTES.md
2. 查看项目 README
3. 提交 Issue 到项目仓库

---

**版本**: 2.0.0
**最后更新**: 2025-11-13
