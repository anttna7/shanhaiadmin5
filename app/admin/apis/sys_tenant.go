package apis

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-admin-team/go-admin-core/sdk/api"
	"github.com/go-admin-team/go-admin-core/sdk/pkg/jwtauth/user"
	_ "github.com/go-admin-team/go-admin-core/sdk/pkg/response"

	"shadmin/app/admin/models"
	"shadmin/app/admin/service"
	"shadmin/app/admin/service/dto"
	"shadmin/common/middleware"
)

type SysTenant struct {
	api.Api
}

// GetPage 获取租户列表
// @Summary 租户列表
// @Description 获取租户列表
// @Tags 租户管理
// @Param tenantName query string false "租户名称"
// @Param tenantCode query string false "租户代码"
// @Param status query string false "状态"
// @Param pageSize query int false "页条数"
// @Param pageIndex query int false "页码"
// @Success 200 {object} response.Response "{"code": 200, "data": [...]}"
// @Router /api/v1/tenant [get]
// @Security Bearer
func (e SysTenant) GetPage(c *gin.Context) {
	s := service.SysTenant{}
	req := dto.SysTenantGetPageReq{}
	err := e.MakeContext(c).
		MakeOrm().
		Bind(&req).
		MakeService(&s.Service).
		Errors
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, err.Error())
		return
	}

	// 只有平台管理员可以查看所有租户
	if !middleware.IsPlatformAdmin(c) {
		e.Error(403, nil, "只有平台管理员可以管理租户")
		return
	}

	list := make([]models.SysTenant, 0)
	var count int64

	err = s.GetPage(&req, &list, &count)
	if err != nil {
		e.Error(500, err, "查询失败")
		return
	}

	e.PageOK(list, int(count), req.GetPageIndex(), req.GetPageSize(), "查询成功")
}

// Get 获取租户详情
// @Summary 获取租户
// @Description 获取租户详情
// @Tags 租户管理
// @Param id path int true "租户ID"
// @Success 200 {object} response.Response "{"code": 200, "data": {...}}"
// @Router /api/v1/tenant/{id} [get]
// @Security Bearer
func (e SysTenant) Get(c *gin.Context) {
	s := service.SysTenant{}
	req := dto.SysTenantById{}
	err := e.MakeContext(c).
		MakeOrm().
		Bind(&req, nil).
		MakeService(&s.Service).
		Errors
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, err.Error())
		return
	}

	// 只有平台管理员可以查看租户详情
	if !middleware.IsPlatformAdmin(c) {
		e.Error(403, nil, "只有平台管理员可以管理租户")
		return
	}

	var object models.SysTenant
	err = s.Get(&req, &object)
	if err != nil {
		e.Error(http.StatusUnprocessableEntity, err, "查询失败")
		return
	}

	e.OK(object, "查询成功")
}

// Insert 创建租户
// @Summary 创建租户
// @Description 创建租户（会自动创建租户管理员）
// @Tags 租户管理
// @Accept application/json
// @Product application/json
// @Param data body dto.SysTenantInsertReq true "租户数据"
// @Success 200 {object} response.Response "{"code": 200, "data": {...}}"
// @Router /api/v1/tenant [post]
// @Security Bearer
func (e SysTenant) Insert(c *gin.Context) {
	s := service.SysTenant{}
	req := dto.SysTenantInsertReq{}
	err := e.MakeContext(c).
		MakeOrm().
		Bind(&req, binding.JSON).
		MakeService(&s.Service).
		Errors
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, err.Error())
		return
	}

	// 只有平台管理员可以创建租户
	if !middleware.IsPlatformAdmin(c) {
		e.Error(403, nil, "只有平台管理员可以创建租户")
		return
	}

	// 设置创建人
	req.SetCreateBy(user.GetUserId(c))

	// 创建租户
	tenantId, err := s.Insert(&req)
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, "创建失败")
		return
	}

	// 初始化租户管理员
	err = s.InitTenantAdmin(tenantId, req.AdminUsername, req.AdminPassword, req.AdminEmail)
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, "创建租户管理员失败")
		return
	}

	e.OK(tenantId, "创建成功")
}

// Update 更新租户
// @Summary 更新租户
// @Description 更新租户信息
// @Tags 租户管理
// @Accept application/json
// @Product application/json
// @Param id path int true "租户ID"
// @Param data body dto.SysTenantUpdateReq true "租户数据"
// @Success 200 {object} response.Response "{"code": 200, "data": {...}}"
// @Router /api/v1/tenant/{id} [put]
// @Security Bearer
func (e SysTenant) Update(c *gin.Context) {
	s := service.SysTenant{}
	req := dto.SysTenantUpdateReq{}
	err := e.MakeContext(c).
		MakeOrm().
		Bind(&req, binding.JSON, nil).
		MakeService(&s.Service).
		Errors
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, err.Error())
		return
	}

	// 只有平台管理员可以更新租户
	if !middleware.IsPlatformAdmin(c) {
		e.Error(403, nil, "只有平台管理员可以更新租户")
		return
	}

	// 设置更新人
	req.SetUpdateBy(user.GetUserId(c))

	err = s.Update(&req)
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, "更新失败")
		return
	}

	e.OK(req.GetId(), "更新成功")
}

// Delete 删除租户
// @Summary 删除租户
// @Description 删除租户
// @Tags 租户管理
// @Param id path int true "租户ID"
// @Success 200 {object} response.Response "{"code": 200, "data": {...}}"
// @Router /api/v1/tenant/{id} [delete]
// @Security Bearer
func (e SysTenant) Delete(c *gin.Context) {
	s := service.SysTenant{}
	req := dto.SysTenantById{}
	err := e.MakeContext(c).
		MakeOrm().
		Bind(&req, binding.JSON, nil).
		MakeService(&s.Service).
		Errors
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, err.Error())
		return
	}

	// 只有平台管理员可以删除租户
	if !middleware.IsPlatformAdmin(c) {
		e.Error(403, nil, "只有平台管理员可以删除租户")
		return
	}

	err = s.Remove(&req)
	if err != nil {
		e.Logger.Error(err)
		e.Error(500, err, "删除失败")
		return
	}

	e.OK(req.GetId(), "删除成功")
}
