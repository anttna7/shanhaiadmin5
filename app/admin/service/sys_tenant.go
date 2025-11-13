package service

import (
	"errors"
	"fmt"
	"shadmin/app/admin/models"
	"shadmin/app/admin/service/dto"

	log "github.com/go-admin-team/go-admin-core/logger"
	"github.com/go-admin-team/go-admin-core/sdk/service"
	"gorm.io/gorm"

	"shadmin/common/actions"
	cDto "shadmin/common/dto"
)

type SysTenant struct {
	service.Service
}

// GetPage 获取租户列表
func (e *SysTenant) GetPage(c *dto.SysTenantGetPageReq, list *[]models.SysTenant, count *int64) error {
	var err error

	err = e.Orm.Model(&models.SysTenant{}).
		Scopes(
			cDto.MakeCondition(c.GetNeedSearch()),
			cDto.Paginate(c.GetPageSize(), c.GetPageIndex()),
		).
		Find(list).Limit(-1).Offset(-1).
		Count(count).Error
	if err != nil {
		e.Log.Errorf("db error: %s", err)
		return err
	}
	return nil
}

// Get 获取租户详情
func (e *SysTenant) Get(d *dto.SysTenantById, model *models.SysTenant) error {
	err := e.Orm.First(model, d.GetId()).Error
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		err = errors.New("租户不存在")
		e.Log.Errorf("db error: %s", err)
		return err
	}
	if err != nil {
		e.Log.Errorf("db error: %s", err)
		return err
	}
	return nil
}

// Insert 创建租户
func (e *SysTenant) Insert(c *dto.SysTenantInsertReq) (int, error) {
	var err error
	var data models.SysTenant
	var count int64

	// 检查租户代码是否已存在
	err = e.Orm.Model(&data).Where("tenant_code = ?", c.TenantCode).Count(&count).Error
	if err != nil {
		e.Log.Errorf("db error: %s", err)
		return 0, err
	}
	if count > 0 {
		err := errors.New("租户代码已存在")
		e.Log.Errorf("db error: %s", err)
		return 0, err
	}

	// 创建租户
	c.Generate(&data)
	err = e.Orm.Create(&data).Error
	if err != nil {
		e.Log.Errorf("db error: %s", err)
		return 0, err
	}

	return data.TenantId, nil
}

// Update 更新租户
func (e *SysTenant) Update(c *dto.SysTenantUpdateReq) error {
	var err error
	var model models.SysTenant

	db := e.Orm.First(&model, c.GetId())
	if err = db.Error; err != nil {
		e.Log.Errorf("Service UpdateSysTenant error: %s", err)
		return err
	}
	if db.RowsAffected == 0 {
		return errors.New("租户不存在")
	}

	c.Generate(&model)
	update := e.Orm.Model(&model).Where("tenant_id = ?", c.TenantId).Omit("created_at").Updates(&model)
	if err = update.Error; err != nil {
		e.Log.Errorf("db error: %s", err)
		return err
	}
	if update.RowsAffected == 0 {
		err = errors.New("更新失败")
		e.Log.Errorf("db error: %s", err)
		return err
	}
	return nil
}

// Remove 删除租户
func (e *SysTenant) Remove(d *dto.SysTenantById) error {
	var err error
	var data models.SysTenant

	db := e.Orm.Model(&data).Delete(&data, d.GetId())
	if err = db.Error; err != nil {
		e.Log.Errorf("Delete error: %s", err)
		return err
	}
	if db.RowsAffected == 0 {
		err = errors.New("租户不存在")
		return err
	}
	return nil
}

// InitTenantAdmin 初始化租户超级管理员
func (e *SysTenant) InitTenantAdmin(tenantId int, username, password, email string) error {
	var err error

	// 开始事务
	tx := e.Orm.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. 创建租户管理员角色
	role := models.SysRole{
		TenantId:  tenantId,
		RoleName:  "租户管理员",
		RoleKey:   fmt.Sprintf("tenant_admin_%d", tenantId),
		RoleSort:  1,
		RoleLevel: 99, // 最高级别
		Status:    "2",
		Admin:     true,
		DataScope: "1", // 全部数据权限
		Remark:    "租户超级管理员角色",
	}

	if err = tx.Create(&role).Error; err != nil {
		tx.Rollback()
		e.Log.Errorf("创建租户管理员角色失败: %s", err)
		return err
	}

	// 2. 创建租户管理员用户
	user := models.SysUser{
		TenantId: tenantId,
		Username: username,
		Password: password,
		NickName: "租户管理员",
		Email:    email,
		RoleId:   role.RoleId,
		Status:   "2",
		IsAdmin:  true, // 标记为租户管理员
	}

	if err = tx.Create(&user).Error; err != nil {
		tx.Rollback()
		e.Log.Errorf("创建租户管理员用户失败: %s", err)
		return err
	}

	// 提交事务
	if err = tx.Commit().Error; err != nil {
		e.Log.Errorf("事务提交失败: %s", err)
		return err
	}

	return nil
}
