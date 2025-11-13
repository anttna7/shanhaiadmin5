package models

// SysTenant 租户表（迁移模型）
type SysTenant struct {
	TenantId     int    `gorm:"primaryKey;autoIncrement;comment:租户编码" json:"tenantId"`
	TenantName   string `json:"tenantName" gorm:"type:varchar(128);comment:租户名称;not null"`
	TenantCode   string `json:"tenantCode" gorm:"type:varchar(64);comment:租户代码;uniqueIndex;not null"`
	ContactName  string `json:"contactName" gorm:"type:varchar(64);comment:联系人"`
	ContactPhone string `json:"contactPhone" gorm:"type:varchar(20);comment:联系电话"`
	ContactEmail string `json:"contactEmail" gorm:"type:varchar(128);comment:联系邮箱"`
	Status       string `json:"status" gorm:"type:varchar(4);comment:状态;default:2"`
	ExpireTime   string `json:"expireTime" gorm:"comment:到期时间"`
	MaxUsers     int    `json:"maxUsers" gorm:"comment:最大用户数;default:10"`
	Remark       string `json:"remark" gorm:"type:varchar(500);comment:备注"`
	ControlBy
	ModelTime
}

func (*SysTenant) TableName() string {
	return "sys_tenant"
}
