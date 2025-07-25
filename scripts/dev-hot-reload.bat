@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Hot Reload Development Server Script for Windows
:: Starts all components with hot reload enabled

set "PROJECT_NAME=cattle-management-system"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=5173"
set "MINIPROGRAM_PORT=8080"

:: Colors (Windows 10+ with ANSI support)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "NC=[0m"

:: PID tracking
set "BACKEND_PID="
set "FRONTEND_PID="
set "MINIPROGRAM_PID="

echo %BLUE%🔥 Starting Hot Reload Development Environment for %PROJECT_NAME%%NC%
echo =================================================================

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

:: Cleanup function
:cleanup
call :log_info "Shutting down services..."

if defined BACKEND_PID (
    call :log_info "Stopping Backend (PID: %BACKEND_PID%)"
    taskkill /f /pid %BACKEND_PID% >nul 2>&1
)

if defined FRONTEND_PID (
    call :log_info "Stopping Frontend (PID: %FRONTEND_PID%)"
    taskkill /f /pid %FRONTEND_PID% >nul 2>&1
)

if defined MINIPROGRAM_PID (
    call :log_info "Stopping Miniprogram (PID: %MINIPROGRAM_PID%)"
    taskkill /f /pid %MINIPROGRAM_PID% >nul 2>&1
)

:: Kill any remaining node processes for this project
taskkill /f /im node.exe >nul 2>&1

call :log_success "All services stopped"
goto :eof

:: Set up signal handlers
:setup_handlers
:: Create a temporary script for Ctrl+C handling
echo @echo off > temp_cleanup.bat
echo call :cleanup >> temp_cleanup.bat
echo exit /b >> temp_cleanup.bat

:: This is a simplified approach for Windows
goto :eof

:: Check if port is available
:check_port
set "port=%~1"
set "service=%~2"

netstat -an | findstr ":%port% " >nul 2>&1
if %errorlevel% equ 0 (
    call :log_error "Port %port% is already in use (needed for %service%)"
    call :log_info "Kill the process using: netstat -ano | findstr :%port%"
    exit /b 1
)
exit /b 0

:: Start backend with hot reload
:start_backend
call :log_info "Starting backend with hot reload..."

if not exist "backend\package.json" (
    call :log_error "Backend package.json not found"
    exit /b 1
)

call :check_port %BACKEND_PORT% "Backend"
if %errorlevel% neq 0 exit /b 1

cd backend

:: Ensure nodemon is installed
npm list nodemon >nul 2>&1
if %errorlevel% neq 0 (
    call :log_info "Installing nodemon for hot reload..."
    call npm install --save-dev nodemon
)

:: Create nodemon configuration if it doesn't exist
if not exist "nodemon.json" (
    (
        echo {
        echo   "watch": ["src"],
        echo   "ext": "ts,js,json",
        echo   "ignore": ["src/**/*.test.ts", "src/**/*.spec.ts", "dist/**/*", "node_modules/**/*"],
        echo   "exec": "ts-node -r tsconfig-paths/register src/app.ts",
        echo   "env": {
        echo     "NODE_ENV": "development",
        echo     "DEBUG": "app:*"
        echo   },
        echo   "delay": 1000,
        echo   "verbose": true
        echo }
    ) > nodemon.json
    call :log_success "Created nodemon.json configuration"
)

:: Start backend with nodemon
start /b "" cmd /c "npm run dev"

:: Get the PID (simplified approach for Windows)
timeout /t 2 /nobreak >nul
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh ^| findstr node') do (
    set "BACKEND_PID=%%i"
    goto backend_pid_found
)

:backend_pid_found
cd ..

:: Wait for backend to start
set "count=0"
:wait_backend
curl -s http://localhost:%BACKEND_PORT%/health >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Backend started with hot reload on port %BACKEND_PORT%"
    goto :eof
)

set /a count+=1
if %count% lss 30 (
    timeout /t 1 /nobreak >nul
    goto wait_backend
)

call :log_warning "Backend may not have started properly"
goto :eof

:: Start frontend with hot reload
:start_frontend
call :log_info "Starting frontend with hot reload..."

if not exist "frontend\package.json" (
    call :log_error "Frontend package.json not found"
    exit /b 1
)

call :check_port %FRONTEND_PORT% "Frontend"
if %errorlevel% neq 0 exit /b 1

cd frontend

:: Create or update Vite configuration for optimal hot reload
if not exist "vite.config.ts" (
    call :log_info "Creating Vite configuration for hot reload..."
    
    (
        echo import { defineConfig } from 'vite'
        echo import vue from '@vitejs/plugin-vue'
        echo import { resolve } from 'path'
        echo import AutoImport from 'unplugin-auto-import/vite'
        echo import Components from 'unplugin-vue-components/vite'
        echo import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
        echo.
        echo export default defineConfig({
        echo   plugins: [
        echo     vue(^),
        echo     AutoImport({
        echo       resolvers: [ElementPlusResolver(^)],
        echo     }^),
        echo     Components({
        echo       resolvers: [ElementPlusResolver(^)],
        echo     }^),
        echo   ],
        echo   resolve: {
        echo     alias: {
        echo       '@': resolve(__dirname, 'src'^),
        echo     },
        echo   },
        echo   server: {
        echo     port: 5173,
        echo     host: true,
        echo     open: false,
        echo     hmr: {
        echo       overlay: true,
        echo       clientPort: 5173,
        echo     },
        echo     watch: {
        echo       usePolling: true,
        echo       interval: 1000,
        echo     },
        echo   },
        echo   build: {
        echo     outDir: 'dist',
        echo     sourcemap: true,
        echo     rollupOptions: {
        echo       output: {
        echo         manualChunks: {
        echo           vendor: ['vue', 'vue-router', 'pinia'],
        echo           elementPlus: ['element-plus'],
        echo         },
        echo       },
        echo     },
        echo   },
        echo }^)
    ) > vite.config.ts
    call :log_success "Created Vite configuration for hot reload"
)

:: Start frontend with Vite
start /b "" cmd /c "npm run dev"

:: Get the PID (simplified approach for Windows)
timeout /t 2 /nobreak >nul
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh ^| findstr node') do (
    if not defined FRONTEND_PID if not "%%i"=="%BACKEND_PID%" (
        set "FRONTEND_PID=%%i"
        goto frontend_pid_found
    )
)

:frontend_pid_found
cd ..

:: Wait for frontend to start
set "count=0"
:wait_frontend
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Frontend started with hot reload on port %FRONTEND_PORT%"
    goto :eof
)

set /a count+=1
if %count% lss 30 (
    timeout /t 1 /nobreak >nul
    goto wait_frontend
)

call :log_warning "Frontend may not have started properly"
goto :eof

:: Start miniprogram with hot reload
:start_miniprogram
call :log_info "Starting miniprogram with hot reload..."

if not exist "miniprogram\package.json" (
    call :log_error "Miniprogram package.json not found"
    exit /b 1
)

cd miniprogram

:: Update vue.config.js for better hot reload
if not exist "vue.config.js" (
    call :log_info "Creating vue.config.js for hot reload..."
    
    (
        echo const { defineConfig } = require('@vue/cli-service'^)
        echo.
        echo module.exports = defineConfig({
        echo   transpileDependencies: true,
        echo   
        echo   // Configure webpack for better hot reload
        echo   configureWebpack: {
        echo     watchOptions: {
        echo       poll: 1000,
        echo       aggregateTimeout: 300,
        echo       ignored: /node_modules/,
        echo     },
        echo     devtool: 'eval-cheap-module-source-map',
        echo   },
        echo   
        echo   // Disable host check for development
        echo   devServer: {
        echo     disableHostCheck: true,
        echo     watchOptions: {
        echo       poll: true,
        echo     },
        echo   },
        echo   
        echo   // uni-app specific configuration
        echo   pluginOptions: {
        echo     'uni-app': {
        echo       // Enable hot reload for uni-app
        echo       hotReload: true,
        echo     },
        echo   },
        echo }^)
    ) > vue.config.js
    call :log_success "Created vue.config.js for hot reload"
)

:: Start miniprogram in watch mode
start /b "" cmd /c "npm run dev:mp-weixin"

:: Get the PID (simplified approach for Windows)
timeout /t 2 /nobreak >nul
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh ^| findstr node') do (
    if not defined MINIPROGRAM_PID if not "%%i"=="%BACKEND_PID%" if not "%%i"=="%FRONTEND_PID%" (
        set "MINIPROGRAM_PID=%%i"
        goto miniprogram_pid_found
    )
)

:miniprogram_pid_found
cd ..

call :log_success "Miniprogram started with hot reload (watch mode)"
goto :eof

:: Monitor services
:monitor_services
call :log_info "Monitoring services for changes..."
call :log_info "Press Ctrl+C to stop all services"

:monitor_loop
:: Check if services are still running
set "running_count=0"

if defined BACKEND_PID (
    tasklist /fi "pid eq %BACKEND_PID%" | findstr "%BACKEND_PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        set /a running_count+=1
    ) else (
        call :log_warning "Backend has stopped unexpectedly"
        set "BACKEND_PID="
    )
)

if defined FRONTEND_PID (
    tasklist /fi "pid eq %FRONTEND_PID%" | findstr "%FRONTEND_PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        set /a running_count+=1
    ) else (
        call :log_warning "Frontend has stopped unexpectedly"
        set "FRONTEND_PID="
    )
)

if defined MINIPROGRAM_PID (
    tasklist /fi "pid eq %MINIPROGRAM_PID%" | findstr "%MINIPROGRAM_PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        set /a running_count+=1
    ) else (
        call :log_warning "Miniprogram has stopped unexpectedly"
        set "MINIPROGRAM_PID="
    )
)

if %running_count% equ 0 (
    call :log_error "All services have stopped"
    goto :eof
)

timeout /t 5 /nobreak >nul
goto monitor_loop

:: Display service information
:show_service_info
echo.
call :log_success "Hot reload development environment is running!"
echo.
echo 🌐 Service URLs:
echo   Frontend:     http://localhost:%FRONTEND_PORT%
echo   Backend API:  http://localhost:%BACKEND_PORT%
echo   API Health:   http://localhost:%BACKEND_PORT%/health
echo   API Docs:     http://localhost:%BACKEND_PORT%/api/docs
echo.
echo 🔥 Hot Reload Features:
echo   ✅ Backend: Automatic restart on TypeScript/JavaScript changes
echo   ✅ Frontend: Vite HMR with instant updates
echo   ✅ Miniprogram: Watch mode for uni-app development
echo.
echo 📁 Watched Directories:
echo   Backend:     backend\src\**\*
echo   Frontend:    frontend\src\**\*
echo   Miniprogram: miniprogram\src\**\*
echo.
echo 🛠️  Development Tips:
echo   - Changes are automatically detected and applied
echo   - Check browser console for HMR status
echo   - Use browser dev tools for debugging
echo   - Logs are displayed in this terminal
echo.
goto :eof

:: Main function
:main
:: Check prerequisites
call :log_info "Checking prerequisites..."

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Node.js is not installed"
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "npm is not installed"
    exit /b 1
)

:: Start database services if not running
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    call :log_info "Starting database services..."
    docker-compose up -d postgres redis >nul 2>&1
)

:: Start services based on arguments or start all
set "service=%~1"
if "%service%"=="" set "service=all"

if "%service%"=="backend" (
    call :start_backend
) else if "%service%"=="frontend" (
    call :start_frontend
) else if "%service%"=="miniprogram" (
    call :start_miniprogram
) else (
    call :start_backend
    timeout /t 2 /nobreak >nul
    call :start_frontend
    timeout /t 2 /nobreak >nul
    call :start_miniprogram
)

:: Show service information
call :show_service_info

:: Monitor services
call :monitor_services

goto :eof

:: Show usage if help requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto main

:show_help
echo Hot Reload Development Server
echo.
echo Usage: %~nx0 [service]
echo.
echo Services:
echo   all         Start all services (default)
echo   backend     Start only backend with hot reload
echo   frontend    Start only frontend with hot reload
echo   miniprogram Start only miniprogram with hot reload
echo.
echo Examples:
echo   %~nx0              # Start all services
echo   %~nx0 backend      # Start only backend
echo   %~nx0 frontend     # Start only frontend
echo.
pause
goto :eof

:: Run main function
call :main %*

:: Cleanup on exit
call :cleanup