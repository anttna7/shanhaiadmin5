package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func init() {
	routerNoCheckRole = append(routerNoCheckRole, registerWebRouter)
}

// 注册Web前端路由
func registerWebRouter(v1 *gin.RouterGroup) {
	// 根路径重定向到登录页
	v1.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/html/index.html")
	})

	// 登录页面
	v1.GET("/login", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/html/login.html")
	})

	// 主页面
	v1.GET("/index", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/html/index.html")
	})
}
