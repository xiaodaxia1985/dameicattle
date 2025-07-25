@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Development Environment Health Check and Troubleshooting Script for Windows
:: Validates all components and provides troubleshooting guidance

set "PROJECT_NAME=cattle-management-system"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=5173"
set "DB_PORT=5432"
set "REDIS_PORT=6379"
set "ADMINER_PORT=8080"

:: Colors (Windows 10+ with ANSI support)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

:: Health check counters
set "SUCCESS_COUNT=0"
set "WARNING_COUNT=0"
set "ERROR_COUNT=0"

echo %BLUE%🏥 Development Environment Health Check for %PROJECT_NAME%%NC%
echo ============================================================

:: Logging functions
:log_info
echo %BLUE%ℹ️  %~1%NC%
goto :eof

:log_success
echo %GREEN%✅ %~1%NC%
set /a SUCCESS_COUNT+=1
goto :eof

:log_warning
echo %YELLOW%⚠️  %~1%NC%
set /a WARNING_COUNT+=1
goto :eof

:log_error
echo %RED%❌ %~1%NC%
set /a ERROR_COUNT+=1
goto :eof

:: Check if port is in use
:check_port
set "port=%~1"
set "service=%~2"

netstat -an | findstr ":%port% " >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "%service% is running on port %port%"
    exit /b 0
) else (
    call :log_error "%service% is not running on port %port%"
    exit /b 1
)

:: Check service health endpoint
:check_health_endpoint
set "url=%~1"
set "service=%~2"

curl -s --max-time 5 "%url%" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "%service% health endpoint is responding"
    exit /b 0
) else (
    call :log_error "%service% health endpoint is not responding"
    exit /b 1
)

:: Check Docker service
:check_docker_service
set "service=%~1"

docker-compose ps %service% | findstr "Up" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Docker service '%service%' is running"
    exit /b 0
) else (
    call :log_error "Docker service '%service%' is not running"
    exit /b 1
)

:: Check file/directory existence
:check_directory
set "path=%~1"
set "description=%~2"

if exist "%path%" (
    call :log_success "%description% exists: %path%"
    exit /b 0
) else (
    call :log_error "%description% not found: %path%"
    exit /b 1
)

:: Check environment variables
:check_environment_variables
set "env_file=%~1"
set "service=%~2"

if exist "%env_file%" (
    call :log_success "%service% environment file exists"
    
    :: Check for required variables (basic check)
    if "%service%"=="Backend" (
        findstr /C:"DB_HOST=" "%env_file%" >nul && (
            call :log_success "%service% has DB_HOST configured"
        ) || (
            call :log_warning "%service% missing DB_HOST in environment file"
        )
        
        findstr /C:"JWT_SECRET=" "%env_file%" >nul && (
            call :log_success "%service% has JWT_SECRET configured"
        ) || (
            call :log_warning "%service% missing JWT_SECRET in environment file"
        )
    )
    
    if "%service%"=="Frontend" (
        findstr /C:"VITE_API_BASE_URL=" "%env_file%" >nul && (
            call :log_success "%service% has VITE_API_BASE_URL configured"
        ) || (
            call :log_warning "%service% missing VITE_API_BASE_URL in environment file"
        )
    )
    exit /b 0
) else (
    call :log_error "%service% environment file not found: %env_file%"
    exit /b 1
)

:: Check database connectivity
:check_database_connectivity
call :log_info "Checking database connectivity..."

call :check_docker_service "postgres"
if %errorlevel% equ 0 (
    docker-compose exec -T postgres pg_isready -U cattle_user -d cattle_management >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Database connection is working"
    ) else (
        call :log_error "Database connection failed"
        call :log_info "Try: docker-compose restart postgres"
    )
) else (
    call :log_error "PostgreSQL container is not running"
    call :log_info "Try: docker-compose up -d postgres"
)
goto :eof

:: Check Redis connectivity
:check_redis_connectivity
call :log_info "Checking Redis connectivity..."

call :check_docker_service "redis"
if %errorlevel% equ 0 (
    docker-compose exec -T redis redis-cli ping | findstr "PONG" >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Redis connection is working"
    ) else (
        call :log_error "Redis connection failed"
        call :log_info "Try: docker-compose restart redis"
    )
) else (
    call :log_error "Redis container is not running"
    call :log_info "Try: docker-compose up -d redis"
)
goto :eof

:: Check Node.js dependencies
:check_node_dependencies
set "component=%~1"
set "path=%~2"

call :log_info "Checking %component% dependencies..."

if exist "%path%\package.json" (
    if exist "%path%\node_modules" (
        for /f %%i in ('dir /b "%path%\node_modules" 2^>nul ^| find /c /v ""') do set "package_count=%%i"
        if !package_count! gtr 10 (
            call :log_success "%component% dependencies are installed (!package_count! packages)"
        ) else (
            call :log_warning "%component% has few dependencies installed"
            call :log_info "Try: cd %path% && npm install"
        )
    ) else (
        call :log_error "%component% dependencies are not installed"
        call :log_info "Try: cd %path% && npm install"
    )
) else (
    call :log_error "%component% package.json not found"
)
goto :eof

:: Check build artifacts
:check_build_artifacts
set "component=%~1"
set "build_path=%~2"

if exist "%build_path%" (
    for /f %%i in ('dir /s /b "%build_path%\*" 2^>nul ^| find /c /v ""') do set "file_count=%%i"
    if !file_count! gtr 0 (
        call :log_success "%component% build artifacts exist (!file_count! files)"
    ) else (
        call :log_warning "%component% build directory is empty"
    )
) else (
    call :log_info "%component% has not been built yet"
)
goto :eof

:: System resource check
:check_system_resources
call :log_info "Checking system resources..."

:: Check disk space
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set "FREE_SPACE=%%a"
set "FREE_SPACE=%FREE_SPACE:,=%"
if %FREE_SPACE% lss 1073741824 (
    call :log_warning "Low disk space detected"
) else (
    call :log_success "Disk space is adequate"
)

:: Check memory (simplified)
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do set "TOTAL_MEM=%%i"
)
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do set "FREE_MEM=%%i"
)

if defined TOTAL_MEM if defined FREE_MEM (
    set /a "MEM_USAGE=100-(%FREE_MEM%*100/%TOTAL_MEM%)"
    if !MEM_USAGE! gtr 80 (
        call :log_warning "High memory usage: !MEM_USAGE!%%"
    ) else (
        call :log_success "Memory usage is normal: !MEM_USAGE!%%"
    )
)
goto :eof

:: Network connectivity check
:check_network_connectivity
call :log_info "Checking network connectivity..."

:: Check internet connectivity
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Internet connectivity is working"
) else (
    call :log_warning "Internet connectivity issues detected"
)

:: Check localhost connectivity
curl -s --max-time 2 http://localhost >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Localhost connectivity is working"
) else (
    call :log_info "Localhost not responding (normal if no web server running)"
)
goto :eof

:: Docker health check
:check_docker_health
call :log_info "Checking Docker health..."

where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_success "Docker daemon is running"
        
        :: Check Docker Compose
        where docker-compose >nul 2>&1
        if %errorlevel% equ 0 (
            call :log_success "Docker Compose is available"
        ) else (
            docker compose version >nul 2>&1
            if %errorlevel% equ 0 (
                call :log_success "Docker Compose (plugin) is available"
            ) else (
                call :log_error "Docker Compose is not available"
            )
        )
        
        :: Check running containers
        for /f %%i in ('docker ps -q ^| find /c /v ""') do set "container_count=%%i"
        call :log_info "Running containers: !container_count!"
        
    ) else (
        call :log_error "Docker daemon is not running"
        call :log_info "Try: Start Docker Desktop"
    )
) else (
    call :log_error "Docker is not installed"
)
goto :eof

:: Generate troubleshooting report
:generate_troubleshooting_report
set "report_file=health-check-report-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.md"
set "report_file=%report_file: =0%"

(
echo # Development Environment Health Check Report
echo.
echo Generated: %date% %time%
echo.
echo ## Health Check Summary
echo.
echo - ✅ Passed: %SUCCESS_COUNT%
echo - ⚠️  Warnings: %WARNING_COUNT%
echo - ❌ Errors: %ERROR_COUNT%
echo.
echo ## Common Issues and Solutions
echo.
echo ### Port Conflicts
echo If services can't start due to port conflicts:
echo ```cmd
echo # Find what's using the port
echo netstat -ano ^| findstr :3000  # Backend
echo netstat -ano ^| findstr :5173  # Frontend
echo netstat -ano ^| findstr :5432  # PostgreSQL
echo netstat -ano ^| findstr :6379  # Redis
echo.
echo # Kill the process if needed
echo taskkill /f /pid ^<PID^>
echo ```
echo.
echo ### Database Issues
echo ```bash
echo # Restart database
echo docker-compose restart postgres
echo.
echo # Reset database
echo npm run db:reset
echo.
echo # Check database logs
echo docker-compose logs postgres
echo.
echo # Connect to database manually
echo docker-compose exec postgres psql -U cattle_user -d cattle_management
echo ```
echo.
echo ### Redis Issues
echo ```bash
echo # Restart Redis
echo docker-compose restart redis
echo.
echo # Check Redis logs
echo docker-compose logs redis
echo.
echo # Connect to Redis manually
echo docker-compose exec redis redis-cli
echo ```
echo.
echo ### Node.js Issues
echo ```cmd
echo # Clear npm cache
echo npm cache clean --force
echo.
echo # Delete node_modules and reinstall
echo rmdir /s /q node_modules
echo del package-lock.json
echo npm install
echo.
echo # Check Node.js version
echo node --version
echo npm --version
echo ```
echo.
echo ### Docker Issues
echo ```bash
echo # Restart Docker services
echo docker-compose down
echo docker-compose up -d
echo.
echo # Clean Docker system
echo docker system prune -f
echo.
echo # Rebuild containers
echo docker-compose up --build
echo ```
echo.
echo ### Permission Issues
echo ```cmd
echo # Fix file permissions (run as Administrator^)
echo icacls backend\uploads /grant Users:F /T
echo icacls logs /grant Users:F /T
echo ```
echo.
echo ### Environment Issues
echo ```cmd
echo # Check environment files
echo dir backend\.env
echo dir frontend\.env
echo dir .env
echo.
echo # Recreate environment files
echo copy backend\.env.development backend\.env
echo ```
echo.
echo ## Service URLs for Testing
echo.
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:3000
echo - Backend Health: http://localhost:3000/health
echo - Database Admin: http://localhost:8080
echo - API Documentation: http://localhost:3000/api/docs
echo.
echo ## Next Steps
echo.
echo 1. Address any ❌ errors shown above
echo 2. Restart services after fixing issues
echo 3. Run this health check again to verify fixes
echo 4. If issues persist, check the logs: `docker-compose logs`
echo.
echo ## Getting Help
echo.
echo - Check DEVELOPMENT_GUIDE.md for detailed setup instructions
echo - Review Docker logs: `docker-compose logs [service]`
echo - Check application logs in the logs/ directory
echo - Ensure all environment variables are properly configured
echo.
) > "%report_file%"

call :log_success "Troubleshooting report generated: %report_file%"
goto :eof

:: Main health check function
:main
:: System checks
call :check_system_resources
call :check_network_connectivity
call :check_docker_health

echo.
call :log_info "Checking project structure..."

:: Project structure checks
call :check_directory "backend\uploads" "Backend uploads directory"
call :check_directory "logs" "Logs directory"
call :check_environment_variables "backend\.env" "Backend"
call :check_environment_variables "frontend\.env" "Frontend"

echo.
call :log_info "Checking dependencies..."

:: Dependencies checks
call :check_node_dependencies "Root" "."
call :check_node_dependencies "Backend" "backend"
call :check_node_dependencies "Frontend" "frontend"
call :check_node_dependencies "Miniprogram" "miniprogram"

echo.
call :log_info "Checking services..."

:: Service checks
call :check_database_connectivity
call :check_redis_connectivity

:: Port checks
call :check_port %BACKEND_PORT% "Backend API"
call :check_port %FRONTEND_PORT% "Frontend"
call :check_port %DB_PORT% "PostgreSQL"
call :check_port %REDIS_PORT% "Redis"
call :check_port %ADMINER_PORT% "Adminer"

echo.
call :log_info "Checking build artifacts..."

:: Build artifacts
call :check_build_artifacts "Backend" "backend\dist"
call :check_build_artifacts "Frontend" "frontend\dist"
call :check_build_artifacts "Miniprogram" "miniprogram\dist"

echo.
echo ============================================================

echo Health Check Summary:
echo   ✅ Passed: %SUCCESS_COUNT%
echo   ⚠️  Warnings: %WARNING_COUNT%
echo   ❌ Errors: %ERROR_COUNT%

if %ERROR_COUNT% equ 0 if %WARNING_COUNT% equ 0 (
    call :log_success "All health checks passed! Your development environment is ready."
) else if %ERROR_COUNT% equ 0 (
    call :log_warning "Health check completed with warnings. Environment should work but may have minor issues."
) else (
    call :log_error "Health check found errors. Please address the issues above."
)

echo.
call :generate_troubleshooting_report

echo.
call :log_info "Quick fixes:"
echo   - Restart all services: docker-compose restart
echo   - Reinstall dependencies: npm run clean:all ^&^& npm install
echo   - Reset database: npm run db:reset
echo   - Full reset: scripts\dev-setup-enhanced.bat

pause
goto :eof

:: Run main function
call :main