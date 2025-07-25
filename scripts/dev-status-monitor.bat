@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Development Environment Status Monitor for Windows
:: Real-time monitoring of all development services

set "PROJECT_NAME=cattle-management-system"
set "REFRESH_INTERVAL=5"
set "LOG_FILE=logs\dev-monitor-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

:: Colors (Windows 10+ with ANSI support)
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"
set "CYAN=[36m"
set "MAGENTA=[35m"
set "NC=[0m"

:: Service configurations
set "BACKEND_URL=http://localhost:3000/health"
set "FRONTEND_URL=http://localhost:5173"
set "ADMINER_URL=http://localhost:8080"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=5173"
set "DB_PORT=5432"
set "REDIS_PORT=6379"
set "ADMINER_PORT=8080"

:: Status tracking variables
set "BACKEND_STATUS=unknown"
set "FRONTEND_STATUS=unknown"
set "DATABASE_STATUS=unknown"
set "REDIS_STATUS=unknown"
set "ADMINER_STATUS=unknown"

set "BACKEND_ERRORS=0"
set "FRONTEND_ERRORS=0"
set "DATABASE_ERRORS=0"
set "REDIS_ERRORS=0"
set "ADMINER_ERRORS=0"

:: Logging function
:log_message
set "level=%~1"
set "message=%~2"
set "timestamp=%date% %time%"
echo [%timestamp%] [%level%] %message% >> "%LOG_FILE%"
goto :eof

:: Clear screen and show header
:show_header
cls
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                    Development Environment Status Monitor                    ║%NC%
echo %BLUE%║                              %PROJECT_NAME%                               ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%
echo.
echo %CYAN%Last Updated: %date% %time%%NC%
echo %CYAN%Refresh Interval: %REFRESH_INTERVAL%s%NC%
echo %CYAN%Log File: %LOG_FILE%%NC%
echo.
goto :eof

:: Check service health
:check_service_health
set "service=%~1"

if "%service%"=="Backend" (
    curl -s --max-time 3 "%BACKEND_URL%" >nul 2>&1
    if %errorlevel% equ 0 (
        set "BACKEND_STATUS=healthy"
        set "BACKEND_ERRORS=0"
    ) else (
        set "BACKEND_STATUS=unhealthy"
        set /a BACKEND_ERRORS+=1
    )
) else if "%service%"=="Frontend" (
    curl -s --max-time 3 "%FRONTEND_URL%" >nul 2>&1
    if %errorlevel% equ 0 (
        set "FRONTEND_STATUS=healthy"
        set "FRONTEND_ERRORS=0"
    ) else (
        set "FRONTEND_STATUS=unhealthy"
        set /a FRONTEND_ERRORS+=1
    )
) else if "%service%"=="Database" (
    netstat -an | findstr ":%DB_PORT% " >nul 2>&1
    if %errorlevel% equ 0 (
        set "DATABASE_STATUS=healthy"
        set "DATABASE_ERRORS=0"
    ) else (
        set "DATABASE_STATUS=unhealthy"
        set /a DATABASE_ERRORS+=1
    )
) else if "%service%"=="Redis" (
    netstat -an | findstr ":%REDIS_PORT% " >nul 2>&1
    if %errorlevel% equ 0 (
        set "REDIS_STATUS=healthy"
        set "REDIS_ERRORS=0"
    ) else (
        set "REDIS_STATUS=unhealthy"
        set /a REDIS_ERRORS+=1
    )
) else if "%service%"=="Adminer" (
    curl -s --max-time 3 "%ADMINER_URL%" >nul 2>&1
    if %errorlevel% equ 0 (
        set "ADMINER_STATUS=healthy"
        set "ADMINER_ERRORS=0"
    ) else (
        set "ADMINER_STATUS=unhealthy"
        set /a ADMINER_ERRORS+=1
    )
)
goto :eof

:: Get service process info
:get_service_process_info
set "service=%~1"
set "process_info=Not running"

if "%service%"=="Backend" (
    for /f "tokens=2" %%i in ('netstat -ano ^| findstr ":%BACKEND_PORT% " 2^>nul') do (
        set "process_info=PID: %%i"
        goto :eof
    )
) else if "%service%"=="Frontend" (
    for /f "tokens=2" %%i in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " 2^>nul') do (
        set "process_info=PID: %%i"
        goto :eof
    )
) else if "%service%"=="Database" (
    docker ps --format "{{.Names}}" | findstr "postgres" >nul 2>&1
    if %errorlevel% equ 0 (
        set "process_info=Container running"
    )
) else if "%service%"=="Redis" (
    docker ps --format "{{.Names}}" | findstr "redis" >nul 2>&1
    if %errorlevel% equ 0 (
        set "process_info=Container running"
    )
) else if "%service%"=="Adminer" (
    docker ps --format "{{.Names}}" | findstr "adminer" >nul 2>&1
    if %errorlevel% equ 0 (
        set "process_info=Container running"
    )
)
goto :eof

:: Get system resource usage
:get_system_resources
for /f "skip=1" %%p in ('wmic os get TotalVisibleMemorySize /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do set "TOTAL_MEM=%%i"
)
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory /value') do (
    for /f "tokens=2 delims==" %%i in ("%%p") do set "FREE_MEM=%%i"
)

if defined TOTAL_MEM if defined FREE_MEM (
    set /a "MEM_USAGE=100-(%FREE_MEM%*100/%TOTAL_MEM%)"
    set "SYSTEM_RESOURCES=Memory: !MEM_USAGE!%%"
) else (
    set "SYSTEM_RESOURCES=Memory: Unknown"
)

for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set "FREE_SPACE=%%a"
set "FREE_SPACE=%FREE_SPACE:,=%"
set /a "FREE_SPACE_GB=%FREE_SPACE%/1073741824"
set "SYSTEM_RESOURCES=%SYSTEM_RESOURCES% ^| Disk Free: %FREE_SPACE_GB%GB"

goto :eof

:: Display service status
:display_service_status
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                                Service Status                                ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%

echo Service      Status     Process Info         Errors   URL
echo ────────────────────────────────────────────────────────────────────────────────

:: Backend status
call :get_service_process_info "Backend"
if "%BACKEND_STATUS%"=="healthy" (
    echo Backend      %GREEN%healthy%NC%    %process_info%         %BACKEND_ERRORS%        %BACKEND_URL%
) else (
    echo Backend      %RED%unhealthy%NC%  %process_info%         %BACKEND_ERRORS%        %BACKEND_URL%
)

:: Frontend status
call :get_service_process_info "Frontend"
if "%FRONTEND_STATUS%"=="healthy" (
    echo Frontend     %GREEN%healthy%NC%    %process_info%         %FRONTEND_ERRORS%        %FRONTEND_URL%
) else (
    echo Frontend     %RED%unhealthy%NC%  %process_info%         %FRONTEND_ERRORS%        %FRONTEND_URL%
)

:: Database status
call :get_service_process_info "Database"
if "%DATABASE_STATUS%"=="healthy" (
    echo Database     %GREEN%healthy%NC%    %process_info%         %DATABASE_ERRORS%        Port %DB_PORT%
) else (
    echo Database     %RED%unhealthy%NC%  %process_info%         %DATABASE_ERRORS%        Port %DB_PORT%
)

:: Redis status
call :get_service_process_info "Redis"
if "%REDIS_STATUS%"=="healthy" (
    echo Redis        %GREEN%healthy%NC%    %process_info%         %REDIS_ERRORS%        Port %REDIS_PORT%
) else (
    echo Redis        %RED%unhealthy%NC%  %process_info%         %REDIS_ERRORS%        Port %REDIS_PORT%
)

:: Adminer status
call :get_service_process_info "Adminer"
if "%ADMINER_STATUS%"=="healthy" (
    echo Adminer      %GREEN%healthy%NC%    %process_info%         %ADMINER_ERRORS%        %ADMINER_URL%
) else (
    echo Adminer      %RED%unhealthy%NC%  %process_info%         %ADMINER_ERRORS%        %ADMINER_URL%
)

goto :eof

:: Display Docker status
:display_docker_status
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                                Docker Status                                 ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%

where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker info >nul 2>&1
    if %errorlevel% equ 0 (
        echo %GREEN%Docker daemon is running%NC%
        
        echo.
        echo Running containers:
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr -i "cattle postgres redis adminer" 2>nul
        if %errorlevel% neq 0 (
            echo %YELLOW%No project containers running%NC%
        )
        
        echo.
        echo Docker Compose services:
        docker-compose ps 2>nul || echo No docker-compose services found
    ) else (
        echo %RED%Docker daemon is not running%NC%
    )
) else (
    echo %RED%Docker is not installed%NC%
)
goto :eof

:: Display system information
:display_system_info
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                               System Information                             ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%

call :get_system_resources
echo System Resources: %SYSTEM_RESOURCES%

for /f "tokens=4-5 delims=. " %%i in ('ver') do set "VERSION=%%i.%%j"
echo Platform: Windows %VERSION%

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('node --version') do echo Node.js: %%i
) else (
    echo Node.js: Not installed
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('npm --version') do echo npm: %%i
) else (
    echo npm: Not installed
)

docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker --version') do (
        set "docker_ver=%%i"
        set "docker_ver=!docker_ver:,=!"
        echo Docker: !docker_ver!
    )
) else (
    echo Docker: Not installed
)

echo.
echo Network Status:
ping -n 1 127.0.0.1 >nul 2>&1
if %errorlevel% equ 0 (
    echo   Localhost connectivity: OK
) else (
    echo   Localhost connectivity: Failed
)

ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    echo   Internet connectivity: OK
) else (
    echo   Internet connectivity: Failed
)
goto :eof

:: Display recent logs
:display_recent_logs
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                                Recent Activity                               ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%

if exist "%LOG_FILE%" (
    echo Recent monitor logs:
    for /f "skip=0" %%i in ('more +0 "%LOG_FILE%" ^| tail -5 2^>nul') do echo %%i
) else (
    echo No recent logs
)

where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo Recent service logs:
    docker-compose logs --tail=3 --no-color 2>nul | head -10 || echo No Docker logs available
)
goto :eof

:: Display help information
:display_help
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║                                   Controls                                   ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════════════════════╝%NC%

echo Commands:
echo   q, quit     - Exit monitor
echo   r, refresh  - Force refresh
echo   h, help     - Show this help
echo   l, logs     - Show detailed logs
echo   s, services - Restart all services
echo   d, docker   - Show Docker status
echo.
echo Press any key to continue monitoring...
pause >nul
goto :eof

:: Handle user input
:handle_input
set "input="
set /p "input=Press 'q' to quit, 'h' for help, or Enter to continue: " <nul

:: Use choice command for better input handling
choice /c qrhlsd /t %REFRESH_INTERVAL% /d c /n >nul 2>&1
set "choice_result=%errorlevel%"

if %choice_result% equ 1 (
    echo.
    echo Exiting monitor...
    exit /b 0
) else if %choice_result% equ 2 (
    echo.
    echo Force refreshing...
    goto :eof
) else if %choice_result% equ 3 (
    call :display_help
) else if %choice_result% equ 4 (
    echo.
    echo Detailed logs:
    if exist "%LOG_FILE%" (
        more "%LOG_FILE%"
    ) else (
        echo No logs available
    )
    echo.
    pause
) else if %choice_result% equ 5 (
    echo.
    echo Restarting services...
    docker-compose restart 2>nul || echo Failed to restart services
    pause
) else if %choice_result% equ 6 (
    echo.
    docker-compose ps 2>nul || echo No Docker Compose services
    echo.
    pause
)
goto :eof

:: Main monitoring loop
:main_loop
:: Create log directory
if not exist "logs" mkdir logs

call :log_message "INFO" "Development environment monitor started"

:monitor_loop
:: Check all services
call :check_service_health "Backend"
call :log_message "DEBUG" "Checked Backend: %BACKEND_STATUS%"

call :check_service_health "Frontend"
call :log_message "DEBUG" "Checked Frontend: %FRONTEND_STATUS%"

call :check_service_health "Database"
call :log_message "DEBUG" "Checked Database: %DATABASE_STATUS%"

call :check_service_health "Redis"
call :log_message "DEBUG" "Checked Redis: %REDIS_STATUS%"

call :check_service_health "Adminer"
call :log_message "DEBUG" "Checked Adminer: %ADMINER_STATUS%"

:: Display status
call :show_header
call :display_service_status
call :display_docker_status
call :display_system_info
call :display_recent_logs

echo.
echo %CYAN%Press 'q' to quit, 'h' for help, or wait for auto-refresh...%NC%

:: Handle user input with timeout
call :handle_input

goto monitor_loop

:: Cleanup function
:cleanup
call :log_message "INFO" "Development environment monitor stopped"
echo.
echo Monitor stopped. Log file: %LOG_FILE%
goto :eof

:: Show usage if help requested
if "%~1"=="--help" goto show_help
if "%~1"=="-h" goto show_help
goto main

:show_help
echo Development Environment Status Monitor
echo.
echo Usage: %~nx0 [options]
echo.
echo Options:
echo   -i SECONDS    Set refresh interval (default: 5)
echo   -l FILE       Set log file path
echo   -h, --help    Show this help
echo.
echo Interactive commands:
echo   q - Quit monitor
echo   r - Force refresh
echo   h - Show help
echo   l - Show detailed logs
echo   s - Restart services
echo   d - Show Docker status
echo.
pause
goto :eof

:: Parse command line arguments
:parse_args
if "%~1"=="-i" (
    set "REFRESH_INTERVAL=%~2"
    shift
    shift
    goto parse_args
)
if "%~1"=="-l" (
    set "LOG_FILE=%~2"
    shift
    shift
    goto parse_args
)
if "%~1" neq "" (
    echo Unknown option: %~1
    exit /b 1
)
goto :eof

:main
call :parse_args %*
call :main_loop

:: Cleanup on exit
call :cleanup