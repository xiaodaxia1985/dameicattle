# PowerShell版本的停止所有服务脚本

Write-Host "🛑 停止所有微服务..." -ForegroundColor Yellow

# 停止所有服务
docker-compose down

Write-Host "✅ 所有服务已停止" -ForegroundColor Green

# 可选：清理数据卷（谨慎使用）
$cleanup = Read-Host "是否清理数据卷？这将删除所有数据 (y/N)"
if ($cleanup -eq "y" -or $cleanup -eq "Y") {
    Write-Host "🗑️ 清理数据卷..." -ForegroundColor Red
    docker-compose down -v
    docker system prune -f
    Write-Host "✅ 数据卷清理完成" -ForegroundColor Green
}