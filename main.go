package main

import (
	"shadmin/cmd"
)

//go:generate swag init --parseDependency --parseDepth=6 --instanceName admin -o ./docs/admin

// @title SHAdmin API
// @version 2.0.0
// @description 基于 Gin + PostgreSQL + HTML5 的单体架构权限管理系统的接口文档
// @description SHAdmin - 企业级后台管理系统
// @license.name MIT
// @license.url https://github.com/shadmin-team/shadmin/blob/master/LICENSE.md

// @securityDefinitions.apikey Bearer
// @in header
// @name Authorization
func main() {
	cmd.Execute()
}
