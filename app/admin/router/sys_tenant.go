package router

import (
	"github.com/gin-gonic/gin"
	jwt "github.com/go-admin-team/go-admin-core/sdk/pkg/jwtauth"
	"shadmin/app/admin/apis"
	"shadmin/common/middleware"
)

func init() {
	routerCheckRole = append(routerCheckRole, registerSysTenantRouter)
}

// 租户管理路由（只有平台管理员可访问）
func registerSysTenantRouter(v1 *gin.RouterGroup, authMiddleware *jwt.GinJWTMiddleware) {
	api := apis.SysTenant{}
	r := v1.Group("/tenant").Use(authMiddleware.MiddlewareFunc()).Use(middleware.AuthCheckRole())
	{
		r.GET("", api.GetPage)        // 获取租户列表
		r.GET("/:id", api.Get)         // 获取租户详情
		r.POST("", api.Insert)         // 创建租户
		r.PUT("/:id", api.Update)      // 更新租户
		r.DELETE("/:id", api.Delete)   // 删除租户
	}
}
