# Stop all microservices

Write-Host "Stopping all microservices..." -ForegroundColor Yellow

# Kill all node processes
try {
    taskkill /f /im node.exe
    Write-Host "All Node.js processes stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "No Node.js processes found or already stopped" -ForegroundColor Yellow
}

Write-Host "All microservices stopped!" -ForegroundColor Green