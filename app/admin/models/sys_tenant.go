package models

import "shadmin/common/models"

// SysTenant 租户表
type SysTenant struct {
	TenantId     int    `gorm:"primaryKey;autoIncrement;comment:租户编码" json:"tenantId"`
	TenantName   string `json:"tenantName" gorm:"size:128;comment:租户名称;not null"`
	TenantCode   string `json:"tenantCode" gorm:"size:64;comment:租户代码;uniqueIndex;not null"` // 租户唯一标识
	ContactName  string `json:"contactName" gorm:"size:64;comment:联系人"`
	ContactPhone string `json:"contactPhone" gorm:"size:20;comment:联系电话"`
	ContactEmail string `json:"contactEmail" gorm:"size:128;comment:联系邮箱"`
	Status       string `json:"status" gorm:"size:4;comment:状态;default:2"` // 1-禁用 2-正常
	ExpireTime   string `json:"expireTime" gorm:"comment:到期时间"`           // 租户到期时间
	MaxUsers     int    `json:"maxUsers" gorm:"comment:最大用户数;default:10"` // 最大用户数限制
	Remark       string `json:"remark" gorm:"size:500;comment:备注"`
	models.ControlBy
	models.ModelTime
}

func (*SysTenant) TableName() string {
	return "sys_tenant"
}

func (e *SysTenant) Generate() models.ActiveRecord {
	o := *e
	return &o
}

func (e *SysTenant) GetId() interface{} {
	return e.TenantId
}
