# 批量更新微服务Dockerfile

$services = @(
    @{name="cattle-service"; port="3003"},
    @{name="health-service"; port="3004"},
    @{name="feeding-service"; port="3005"},
    @{name="equipment-service"; port="3006"},
    @{name="procurement-service"; port="3007"},
    @{name="sales-service"; port="3008"},
    @{name="material-service"; port="3009"},
    @{name="notification-service"; port="3010"},
    @{name="file-service"; port="3011"},
    @{name="monitoring-service"; port="3012"}
)

$template = Get-Content "Dockerfile.template" -Raw

foreach ($service in $services) {
    $dockerfile = $template -replace "SERVICE_NAME", $service.name -replace "SERVICE_PORT", $service.port
    $dockerfilePath = "$($service.name)/Dockerfile"
    
    Write-Host "更新 $dockerfilePath" -ForegroundColor Green
    Set-Content -Path $dockerfilePath -Value $dockerfile
}

Write-Host "所有Dockerfile已更新完成！" -ForegroundColor Green