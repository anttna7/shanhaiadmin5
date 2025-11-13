package dto

import (
	"shadmin/app/admin/models"
	"shadmin/common/dto"
	common "shadmin/common/models"
)

// SysTenantGetPageReq 租户列表查询请求
type SysTenantGetPageReq struct {
	dto.Pagination `search:"-"`
	TenantId       int    `form:"tenantId" search:"type:exact;column:tenant_id;table:sys_tenant" comment:"租户ID"`
	TenantName     string `form:"tenantName" search:"type:contains;column:tenant_name;table:sys_tenant" comment:"租户名称"`
	TenantCode     string `form:"tenantCode" search:"type:contains;column:tenant_code;table:sys_tenant" comment:"租户代码"`
	Status         string `form:"status" search:"type:exact;column:status;table:sys_tenant" comment:"状态"`
	SysTenantOrder
}

type SysTenantOrder struct {
	TenantIdOrder   string `search:"type:order;column:tenant_id;table:sys_tenant" form:"tenantIdOrder"`
	TenantNameOrder string `search:"type:order;column:tenant_name;table:sys_tenant" form:"tenantNameOrder"`
	CreatedAtOrder  string `search:"type:order;column:created_at;table:sys_tenant" form:"createdAtOrder"`
}

func (m *SysTenantGetPageReq) GetNeedSearch() interface{} {
	return *m
}

// SysTenantById 根据ID查询租户请求
type SysTenantById struct {
	TenantId int `uri:"id" comment:"租户ID"`
	common.ControlBy
}

func (s *SysTenantById) GetId() interface{} {
	return s.TenantId
}

// SysTenantInsertReq 创建租户请求
type SysTenantInsertReq struct {
	TenantName   string `json:"tenantName" comment:"租户名称" vd:"len($)>0"`
	TenantCode   string `json:"tenantCode" comment:"租户代码" vd:"len($)>0"`
	ContactName  string `json:"contactName" comment:"联系人"`
	ContactPhone string `json:"contactPhone" comment:"联系电话"`
	ContactEmail string `json:"contactEmail" comment:"联系邮箱"`
	Status       string `json:"status" comment:"状态"`
	ExpireTime   string `json:"expireTime" comment:"到期时间"`
	MaxUsers     int    `json:"maxUsers" comment:"最大用户数"`
	Remark       string `json:"remark" comment:"备注"`
	// 租户管理员信息
	AdminUsername string `json:"adminUsername" comment:"管理员用户名" vd:"len($)>0"`
	AdminPassword string `json:"adminPassword" comment:"管理员密码" vd:"len($)>0"`
	AdminEmail    string `json:"adminEmail" comment:"管理员邮箱" vd:"len($)>0"`
	common.ControlBy
}

func (s *SysTenantInsertReq) Generate(model *models.SysTenant) {
	model.TenantName = s.TenantName
	model.TenantCode = s.TenantCode
	model.ContactName = s.ContactName
	model.ContactPhone = s.ContactPhone
	model.ContactEmail = s.ContactEmail
	model.Status = s.Status
	if s.Status == "" {
		model.Status = "2" // 默认正常状态
	}
	model.ExpireTime = s.ExpireTime
	model.MaxUsers = s.MaxUsers
	if s.MaxUsers == 0 {
		model.MaxUsers = 10 // 默认10个用户
	}
	model.Remark = s.Remark
	model.CreateBy = s.CreateBy
	model.UpdateBy = s.UpdateBy
}

// SysTenantUpdateReq 更新租户请求
type SysTenantUpdateReq struct {
	TenantId     int    `uri:"id" comment:"租户ID" vd:"$>0"`
	TenantName   string `json:"tenantName" comment:"租户名称" vd:"len($)>0"`
	TenantCode   string `json:"tenantCode" comment:"租户代码" vd:"len($)>0"`
	ContactName  string `json:"contactName" comment:"联系人"`
	ContactPhone string `json:"contactPhone" comment:"联系电话"`
	ContactEmail string `json:"contactEmail" comment:"联系邮箱"`
	Status       string `json:"status" comment:"状态"`
	ExpireTime   string `json:"expireTime" comment:"到期时间"`
	MaxUsers     int    `json:"maxUsers" comment:"最大用户数"`
	Remark       string `json:"remark" comment:"备注"`
	common.ControlBy
}

func (s *SysTenantUpdateReq) GetId() interface{} {
	return s.TenantId
}

func (s *SysTenantUpdateReq) Generate(model *models.SysTenant) {
	if s.TenantId != 0 {
		model.TenantId = s.TenantId
	}
	model.TenantName = s.TenantName
	model.TenantCode = s.TenantCode
	model.ContactName = s.ContactName
	model.ContactPhone = s.ContactPhone
	model.ContactEmail = s.ContactEmail
	model.Status = s.Status
	model.ExpireTime = s.ExpireTime
	model.MaxUsers = s.MaxUsers
	model.Remark = s.Remark
	model.UpdateBy = s.UpdateBy
}
