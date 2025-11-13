package actions

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-admin-team/go-admin-core/sdk/pkg"
	"gorm.io/gorm"
	"shadmin/app/admin/models"
	"shadmin/common/middleware"
)

// CheckTenantPermission 检查租户权限
// 确保用户只能操作自己租户的数据
func CheckTenantPermission(c *gin.Context, targetTenantId int) error {
	currentTenantId := middleware.GetTenantId(c)

	// 平台管理员可以操作所有租户
	if middleware.IsPlatformAdmin(c) {
		return nil
	}

	// 租户用户只能操作自己租户的数据
	if currentTenantId != targetTenantId {
		return errors.New("无权操作其他租户的数据")
	}

	return nil
}

// CheckRoleLevelPermission 检查角色级别权限
// 确保管理员不能创建/修改权限高于自己的角色
func CheckRoleLevelPermission(c *gin.Context, targetRoleLevel int) error {
	// 平台管理员不受限制
	if middleware.IsPlatformAdmin(c) {
		return nil
	}

	currentRoleLevel := middleware.GetRoleLevel(c)

	// 租户管理员可以创建任何级别的角色
	if middleware.IsTenantAdmin(c) {
		return nil
	}

	// 普通管理员只能创建级别低于自己的角色
	if targetRoleLevel >= currentRoleLevel {
		return errors.New("不能创建或修改权限高于或等于自己的角色")
	}

	return nil
}

// CheckUserCreationPermission 检查用户创建权限
// 确保管理员创建的用户角色不高于自己
func CheckUserCreationPermission(c *gin.Context, roleId int) error {
	// 平台管理员不受限制
	if middleware.IsPlatformAdmin(c) {
		return nil
	}

	db, err := pkg.GetOrm(c)
	if err != nil {
		return err
	}

	// 获取目标角色信息
	var targetRole models.SysRole
	if err := db.First(&targetRole, roleId).Error; err != nil {
		return errors.New("角色不存在")
	}

	// 检查租户权限
	if err := CheckTenantPermission(c, targetRole.TenantId); err != nil {
		return err
	}

	// 检查角色级别
	return CheckRoleLevelPermission(c, targetRole.RoleLevel)
}

// EnsureTenantScope 确保数据查询限定在用户所属租户
// 用于自动添加租户过滤条件
func EnsureTenantScope(db *gorm.DB, c *gin.Context) *gorm.DB {
	// 平台管理员不需要租户过滤
	if middleware.IsPlatformAdmin(c) {
		return db
	}

	tenantId := middleware.GetTenantId(c)
	return db.Where("tenant_id = ?", tenantId)
}

// ValidateTenantStatus 验证租户状态
// 确保租户状态正常且未过期
func ValidateTenantStatus(db *gorm.DB, tenantId int) error {
	if tenantId == 0 {
		// 平台级别，无需验证
		return nil
	}

	var tenant models.SysTenant
	if err := db.First(&tenant, tenantId).Error; err != nil {
		return errors.New("租户不存在")
	}

	if tenant.Status != "2" {
		return errors.New("租户已被禁用")
	}

	// TODO: 添加过期时间检查
	// if tenant.ExpireTime != "" {
	//     // 检查是否过期
	// }

	return nil
}

// CheckTenantUserLimit 检查租户用户数量限制
func CheckTenantUserLimit(db *gorm.DB, tenantId int) error {
	if tenantId == 0 {
		// 平台级别，无限制
		return nil
	}

	var tenant models.SysTenant
	if err := db.First(&tenant, tenantId).Error; err != nil {
		return errors.New("租户不存在")
	}

	// 统计当前租户用户数
	var userCount int64
	if err := db.Model(&models.SysUser{}).Where("tenant_id = ?", tenantId).Count(&userCount).Error; err != nil {
		return err
	}

	if int(userCount) >= tenant.MaxUsers {
		return errors.New("租户用户数已达上限")
	}

	return nil
}
