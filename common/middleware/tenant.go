package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/go-admin-team/go-admin-core/sdk/pkg"
	"gorm.io/gorm"
)

// TenantIsolation 租户隔离中间件
// 自动为查询添加租户过滤条件
func TenantIsolation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从上下文获取租户ID
		tenantId, exists := c.Get("tenantId")
		if !exists || tenantId == nil {
			// 如果没有租户ID，默认为0（平台管理员）
			tenantId = 0
		}

		// 如果租户ID为0，表示是平台管理员，不需要租户隔离
		if tenantId == 0 {
			c.Next()
			return
		}

		// 获取数据库连接
		db, err := pkg.GetOrm(c)
		if err != nil {
			c.Next()
			return
		}

		// 为当前请求的所有查询添加租户过滤
		db = db.Session(&gorm.Session{})

		// 注入租户作用域
		db = db.Scopes(func(d *gorm.DB) *gorm.DB {
			// 检查表是否有tenant_id字段
			// 只对包含tenant_id的表进行过滤
			return d.Where("tenant_id = ?", tenantId)
		})

		// 将带租户过滤的db重新设置到上下文
		c.Set("db", db)

		c.Next()
	}
}

// GetTenantId 从上下文获取租户ID
func GetTenantId(c *gin.Context) int {
	if tenantId, exists := c.Get("tenantId"); exists {
		if id, ok := tenantId.(int); ok {
			return id
		}
	}
	return 0 // 默认返回0（平台管理员）
}

// IsTenantAdmin 判断是否为租户管理员
func IsTenantAdmin(c *gin.Context) bool {
	if isAdmin, exists := c.Get("isAdmin"); exists {
		if admin, ok := isAdmin.(bool); ok {
			return admin
		}
	}
	return false
}

// IsPlatformAdmin 判断是否为平台管理员
func IsPlatformAdmin(c *gin.Context) bool {
	return GetTenantId(c) == 0
}

// GetRoleLevel 从上下文获取角色级别
func GetRoleLevel(c *gin.Context) int {
	if roleLevel, exists := c.Get("roleLevel"); exists {
		if level, ok := roleLevel.(int); ok {
			return level
		}
	}
	return 0
}
