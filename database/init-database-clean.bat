@echo off
chcp 65001 >nul
echo =====================================================
echo Cattle Management System - Database Initialization
echo =====================================================
echo.

echo Initializing database...
echo.

REM Set database connection parameters
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGDATABASE=cattle_management

REM Execute initialization script
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f init-clean.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================
    echo Database initialization completed successfully!
    echo =====================================================
    echo.
    echo Database Information:
    echo   Host: %PGHOST%
    echo   Port: %PGPORT%
    echo   Database: %PGDATABASE%
    echo   Application User: cattle_user
    echo.
    echo Default Admin Account:
    echo   Username: admin
    echo   Password: admin123 ^(please change immediately^)
    echo.
    echo System is ready to use!
    echo =====================================================
) else (
    echo.
    echo =====================================================
    echo Database initialization failed!
    echo =====================================================
    echo Please check:
    echo 1. PostgreSQL service is running
    echo 2. Database connection parameters are correct
    echo 3. User has sufficient permissions
    echo 4. Database cattle_management exists
    echo =====================================================
)

echo.
pause