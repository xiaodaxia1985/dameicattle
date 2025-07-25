@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Enhanced Cross-Platform Development Environment Setup Script for Windows
:: Comprehensive error handling and validation

set "PROJECT_NAME=cattle-management-system"
set "MIN_NODE_VERSION=18"
set "MIN_DOCKER_VERSION=20"

:: Colors (Windows 10+ with ANSI support)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

:: Enable ANSI colors if supported
for /f "tokens=2 delims=[]" %%i in ('ver') do set "WIN_VER=%%i"
if "%WIN_VER%" geq "10.0.10586" (
    echo [?25l >nul 2>&1
)

echo %BLUE%🚀 Starting Enhanced Development Environment Setup for %PROJECT_NAME%%NC%
echo ==================================================================

:: Logging functions
:log_info
echo %BLUE%ℹ️  %~1%NC%
goto :eof

:log_success
echo %GREEN%✅ %~1%NC%
goto :eof

:log_warning
echo %YELLOW%⚠️  %~1%NC%
goto :eof

:log_error
echo %RED%❌ %~1%NC%
goto :eof

:: Error handling
:handle_error
call :log_error "Setup failed with error code %errorlevel%"
call :log_error "Please check the error messages above and try again"
pause
exit /b %errorlevel%

:: Check if running as administrator
:check_admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    call :log_warning "Not running as administrator. Some operations may fail."
    set /p "continue=Continue anyway? (y/N): "
    if /i not "!continue!"=="y" exit /b 1
)
goto :eof

:: Check system requirements
:check_system_requirements
call :log_info "Checking system requirements..."

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set "VERSION=%%i.%%j"
if "%VERSION%" lss "10.0" (
    call :log_warning "Windows 10 or later is recommended"
)

:: Check available disk space (minimum 5GB)
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set "FREE_SPACE=%%a"
set "FREE_SPACE=%FREE_SPACE:,=%"
if %FREE_SPACE% lss 5368709120 (
    call :log_error "Insufficient disk space. Need at least 5GB free space"
    goto handle_error
)

call :log_success "System requirements check passed"
goto :eof

:: Check Node.js installation and version
:check_nodejs
call :log_info "Checking Node.js installation..."

where node >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "Node.js is not installed"
    call :log_info "Please install Node.js %MIN_NODE_VERSION%+ from https://nodejs.org/"
    
    :: Check if Chocolatey is available
    where choco >nul 2>nul
    if %errorlevel% equ 0 (
        set /p "install_node=Install Node.js using Chocolatey? (y/N): "
        if /i "!install_node!"=="y" (
            choco install nodejs
        ) else (
            goto handle_error
        )
    ) else (
        goto handle_error
    )
)

:: Get Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set "NODE_VERSION=%%i"
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set "NODE_MAJOR=%%i"

if %NODE_MAJOR% lss %MIN_NODE_VERSION% (
    call :log_error "Node.js version %NODE_VERSION% is too old. Need version %MIN_NODE_VERSION%+"
    goto handle_error
)

call :log_success "Node.js version %NODE_VERSION% is compatible"

:: Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "npm is not installed"
    goto handle_error
)

for /f %%i in ('npm -v') do set "NPM_VERSION=%%i"
call :log_success "npm version %NPM_VERSION% found"
goto :eof

:: Check Docker installation and version
:check_docker
call :log_info "Checking Docker installation..."

where docker >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "Docker is not installed"
    call :log_info "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    
    :: Check if Chocolatey is available
    where choco >nul 2>nul
    if %errorlevel% equ 0 (
        set /p "install_docker=Install Docker Desktop using Chocolatey? (y/N): "
        if /i "!install_docker!"=="y" (
            choco install docker-desktop
            call :log_info "Please restart your computer after Docker installation"
            pause
        )
    )
    goto handle_error
)

:: Check if Docker daemon is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    call :log_error "Docker daemon is not running"
    call :log_info "Please start Docker Desktop and try again"
    goto handle_error
)

:: Get Docker version
for /f "tokens=3 delims=, " %%i in ('docker --version') do (
    set "DOCKER_VERSION=%%i"
    set "DOCKER_VERSION=!DOCKER_VERSION:~0,-1!"
)
for /f "tokens=1 delims=." %%i in ("%DOCKER_VERSION%") do set "DOCKER_MAJOR=%%i"

if %DOCKER_MAJOR% lss %MIN_DOCKER_VERSION% (
    call :log_error "Docker version %DOCKER_VERSION% is too old. Need version %MIN_DOCKER_VERSION%+"
    goto handle_error
)

call :log_success "Docker version %DOCKER_VERSION% is compatible"

:: Check Docker Compose
docker-compose --version >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=3 delims=, " %%i in ('docker-compose --version') do (
        set "COMPOSE_VERSION=%%i"
        set "COMPOSE_VERSION=!COMPOSE_VERSION:~0,-1!"
    )
    call :log_success "Docker Compose version %COMPOSE_VERSION% found"
) else (
    docker compose version >nul 2>nul
    if %errorlevel% equ 0 (
        for /f "tokens=4" %%i in ('docker compose version --short') do set "COMPOSE_VERSION=%%i"
        call :log_success "Docker Compose (plugin) version %COMPOSE_VERSION% found"
    ) else (
        call :log_error "Docker Compose is not installed"
        goto handle_error
    )
)
goto :eof

:: Check additional tools
:check_additional_tools
call :log_info "Checking additional development tools..."

:: Check git
where git >nul 2>nul
if %errorlevel% neq 0 (
    call :log_warning "Git is not installed. Some features may not work properly"
    
    :: Check if Chocolatey is available
    where choco >nul 2>nul
    if %errorlevel% equ 0 (
        set /p "install_git=Install Git using Chocolatey? (y/N): "
        if /i "!install_git!"=="y" (
            choco install git
        )
    )
) else (
    for /f "tokens=3" %%i in ('git --version') do set "GIT_VERSION=%%i"
    call :log_success "Git version %GIT_VERSION% found"
)

:: Check curl
where curl >nul 2>nul
if %errorlevel% neq 0 (
    call :log_warning "curl is not installed. Some scripts may not work properly"
)

:: Check PowerShell version
for /f "tokens=1" %%i in ('powershell -command "$PSVersionTable.PSVersion.Major"') do set "PS_VERSION=%%i"
if %PS_VERSION% lss 5 (
    call :log_warning "PowerShell version %PS_VERSION% is old. Consider upgrading to PowerShell 7+"
) else (
    call :log_success "PowerShell version %PS_VERSION% found"
)
goto :eof

:: Create project directories
:create_directories
call :log_info "Creating project directories..."

set "DIRECTORIES=backend\logs backend\uploads backend\uploads\temp backend\uploads\cattle backend\uploads\documents frontend\dist miniprogram\dist nginx\ssl nginx\cache data\postgres data\redis logs\backend logs\frontend logs\nginx logs\monitoring monitoring\data scripts\backup scripts\logs"

for %%d in (%DIRECTORIES%) do (
    if not exist "%%d" (
        mkdir "%%d" 2>nul
        if exist "%%d" (
            call :log_success "Created directory: %%d"
        ) else (
            call :log_warning "Failed to create directory: %%d"
        )
    )
)

:: Set appropriate permissions
icacls backend\uploads /grant Users:F >nul 2>&1
icacls logs /grant Users:F >nul 2>&1

call :log_success "Project directories created"
goto :eof

:: Setup environment files
:setup_environment_files
call :log_info "Setting up environment configuration files..."

:: Backend environment
if not exist "backend\.env" (
    if exist "backend\.env.development" (
        copy "backend\.env.development" "backend\.env" >nul
        call :log_success "Created backend\.env from development template"
    ) else (
        call :log_warning "backend\.env.development template not found"
    )
) else (
    call :log_info "backend\.env already exists"
)

:: Frontend environment
if not exist "frontend\.env" (
    (
        echo # Frontend Development Environment
        echo VITE_API_BASE_URL=http://localhost:3000/api/v1
        echo VITE_APP_TITLE=肉牛管理系统
        echo VITE_APP_VERSION=1.0.0
        echo VITE_ENABLE_MOCK=false
        echo VITE_ENABLE_DEVTOOLS=true
    ) > "frontend\.env"
    call :log_success "Created frontend\.env"
) else (
    call :log_info "frontend\.env already exists"
)

:: Docker environment
if not exist ".env" (
    (
        echo # Docker Development Environment
        echo COMPOSE_PROJECT_NAME=%PROJECT_NAME%
        echo POSTGRES_PASSWORD=dianxin99
        echo POSTGRES_REPLICATION_PASSWORD=replication123
        echo JWT_SECRET=your-jwt-secret-key-change-in-production
        echo GRAFANA_PASSWORD=admin123
        echo NODE_ENV=development
    ) > ".env"
    call :log_success "Created .env for Docker"
) else (
    call :log_info ".env already exists"
)
goto :eof

:: Install dependencies
:install_dependencies
call :log_info "Installing project dependencies..."

:: Root dependencies
if exist "package.json" (
    call :log_info "Installing root dependencies..."
    call npm install
    if %errorlevel% neq 0 goto handle_error
    call :log_success "Root dependencies installed"
)

:: Backend dependencies
if exist "backend\package.json" (
    call :log_info "Installing backend dependencies..."
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        cd ..
        goto handle_error
    )
    cd ..
    call :log_success "Backend dependencies installed"
)

:: Frontend dependencies
if exist "frontend\package.json" (
    call :log_info "Installing frontend dependencies..."
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        cd ..
        goto handle_error
    )
    cd ..
    call :log_success "Frontend dependencies installed"
)

:: Miniprogram dependencies
if exist "miniprogram\package.json" (
    call :log_info "Installing miniprogram dependencies..."
    cd miniprogram
    call npm install
    if %errorlevel% neq 0 (
        cd ..
        goto handle_error
    )
    cd ..
    call :log_success "Miniprogram dependencies installed"
)
goto :eof

:: Setup database
:setup_database
call :log_info "Setting up database..."

:: Start database services
call :log_info "Starting database services..."
docker-compose up -d postgres redis
if %errorlevel% neq 0 goto handle_error

:: Wait for database to be ready
call :log_info "Waiting for database to be ready..."
set "MAX_ATTEMPTS=30"
set "ATTEMPT=1"

:wait_db_loop
docker-compose exec -T postgres pg_isready -U cattle_user -d cattle_management >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Database is ready"
    goto db_ready
)

if %ATTEMPT% geq %MAX_ATTEMPTS% (
    call :log_error "Database failed to start after %MAX_ATTEMPTS% attempts"
    goto handle_error
)

call :log_info "Waiting for database... (attempt %ATTEMPT%/%MAX_ATTEMPTS%)"
timeout /t 2 /nobreak >nul
set /a ATTEMPT+=1
goto wait_db_loop

:db_ready
:: Initialize database
if exist "backend\package.json" (
    call :log_info "Initializing database schema..."
    cd backend
    call npm run db:setup
    if %errorlevel% neq 0 (
        call :log_warning "Database setup failed - may need manual initialization"
    )
    cd ..
)
goto :eof

:: Validate installation
:validate_installation
call :log_info "Validating installation..."

call :log_info "Testing service startup..."

:: Test backend (simplified for Windows)
if exist "backend\package.json" (
    cd backend
    start /b "" cmd /c "npm run dev >nul 2>&1"
    timeout /t 5 /nobreak >nul
    tasklist /fi "imagename eq node.exe" | find "node.exe" >nul
    if %errorlevel% equ 0 (
        call :log_success "Backend can start successfully"
        taskkill /f /im node.exe >nul 2>&1
    ) else (
        call :log_warning "Backend startup test failed"
    )
    cd ..
)

:: Test frontend (simplified for Windows)
if exist "frontend\package.json" (
    cd frontend
    start /b "" cmd /c "npm run dev >nul 2>&1"
    timeout /t 5 /nobreak >nul
    tasklist /fi "imagename eq node.exe" | find "node.exe" >nul
    if %errorlevel% equ 0 (
        call :log_success "Frontend can start successfully"
        taskkill /f /im node.exe >nul 2>&1
    ) else (
        call :log_warning "Frontend startup test failed"
    )
    cd ..
)
goto :eof

:: Generate development guide
:generate_dev_guide
call :log_info "Generating development guide..."

(
echo # Development Environment Guide
echo.
echo ## Quick Start
echo.
echo ### Start All Services
echo ```bash
echo npm run dev:all
echo ```
echo.
echo ### Start Individual Services
echo ```bash
echo npm run dev:backend    # Backend API (Port 3000^)
echo npm run dev:frontend   # Frontend Web (Port 5173^)
echo npm run dev:miniprogram # WeChat Miniprogram
echo ```
echo.
echo ### Using Docker
echo ```bash
echo npm run dev:docker     # Start all services with Docker
echo npm run docker:logs    # View logs
echo npm run docker:down    # Stop all services
echo ```
echo.
echo ## Available Commands
echo.
echo ### Development
echo - `npm run dev:all` - Start backend and frontend
echo - `npm run dev:backend` - Start backend only
echo - `npm run dev:frontend` - Start frontend only
echo - `npm run dev:miniprogram` - Start miniprogram development
echo - `npm run dev:docker` - Start with Docker Compose
echo.
echo ### Testing
echo - `npm run test:all` - Run all tests
echo - `npm run test:backend` - Run backend tests
echo - `npm run test:frontend` - Run frontend tests
echo - `npm run test:watch` - Run tests in watch mode
echo.
echo ### Building
echo - `npm run build:all` - Build all components
echo - `npm run build:backend` - Build backend
echo - `npm run build:frontend` - Build frontend
echo - `npm run build:miniprogram` - Build miniprogram
echo.
echo ### Database
echo - `npm run db:setup` - Initialize database
echo - `npm run db:reset` - Reset database
echo - `npm run db:backup` - Backup database
echo - `npm run db:restore` - Restore database
echo.
echo ### Code Quality
echo - `npm run lint:all` - Lint all code
echo - `npm run lint:fix:all` - Fix linting issues
echo - `npm run format:all` - Format all code
echo.
echo ## Service URLs
echo.
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:3000
echo - Database Admin: http://localhost:8080
echo - API Documentation: http://localhost:3000/api/docs
echo.
echo ## Troubleshooting
echo.
echo ### Port Conflicts
echo If you encounter port conflicts, check what's running on the ports:
echo ```cmd
echo netstat -ano ^| findstr :3000  # Backend
echo netstat -ano ^| findstr :5173  # Frontend
echo netstat -ano ^| findstr :5432  # PostgreSQL
echo netstat -ano ^| findstr :6379  # Redis
echo ```
echo.
echo ### Database Issues
echo ```bash
echo # Reset database
echo npm run db:reset
echo.
echo # Check database status
echo docker-compose ps postgres
echo.
echo # View database logs
echo docker-compose logs postgres
echo ```
echo.
echo ### Clean Installation
echo ```bash
echo # Clean all dependencies and reinstall
echo npm run clean:all
echo npm install
echo npm run setup
echo ```
echo.
echo ## Windows-Specific Notes
echo.
echo - Use Command Prompt or PowerShell as Administrator for best results
echo - If you encounter permission issues, run: `icacls . /grant Users:F /T`
echo - For path issues, use forward slashes in npm scripts
echo - Docker Desktop must be running before using Docker commands
echo.
echo ## Environment Variables
echo.
echo ### Backend (^.env^)
echo - `DB_HOST` - Database host
echo - `DB_PORT` - Database port
echo - `DB_NAME` - Database name
echo - `DB_USER` - Database user
echo - `DB_PASSWORD` - Database password
echo - `REDIS_HOST` - Redis host
echo - `REDIS_PORT` - Redis port
echo - `JWT_SECRET` - JWT secret key
echo - `PORT` - Server port
echo.
echo ### Frontend (^.env^)
echo - `VITE_API_BASE_URL` - Backend API URL
echo - `VITE_APP_TITLE` - Application title
echo - `VITE_ENABLE_MOCK` - Enable mock data
echo.
echo ## Hot Reload
echo.
echo All components support hot reload:
echo - Backend: Uses nodemon for automatic restart
echo - Frontend: Uses Vite HMR
echo - Miniprogram: Uses uni-app watch mode
echo.
echo ## Docker Development
echo.
echo The Docker setup includes:
echo - PostgreSQL database
echo - Redis cache
echo - Backend API service
echo - Frontend web service
echo - Nginx reverse proxy
echo - Adminer database management
echo.
echo Start with: `npm run dev:docker`
) > "DEVELOPMENT_GUIDE.md"

call :log_success "Development guide created: DEVELOPMENT_GUIDE.md"
goto :eof

:: Main function
:main
call check_admin
call check_system_requirements
call check_nodejs
call check_docker
call check_additional_tools
call create_directories
call setup_environment_files
call install_dependencies
call setup_database
call validate_installation
call generate_dev_guide

echo ==================================================================
call :log_success "Development environment setup completed successfully!"
echo.
call :log_info "Next steps:"
echo   1. Review DEVELOPMENT_GUIDE.md for detailed instructions
echo   2. Run 'npm run dev:all' to start all services
echo   3. Visit http://localhost:5173 for the frontend
echo   4. Visit http://localhost:3000 for the backend API
echo.
call :log_info "For troubleshooting, run: scripts\dev-health-check.bat"
echo.
pause
goto :eof

:: Run main function
call :main