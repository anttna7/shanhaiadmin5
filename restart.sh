#!/bin/bash
echo "go build"
go mod tidy
go build -o shadmin main.go
chmod +x ./shadmin
echo "kill shadmin service"
killall shadmin # kill shadmin service
nohup ./shadmin server -c=config/settings.dev.yml >> access.log 2>&1 & #后台启动服务将日志写入access.log文件
echo "run shadmin success"
ps -aux | grep shadmin
