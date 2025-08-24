@echo off
set PGPASSWORD=dianxin99

echo Executing init-clean.sql to fix sales module tables...
D:\software\psql\bin\psql.exe -h localhost -U postgres -d cattle_management -f "d:\develop\dameicattle\database\init-clean.sql" -v ON_ERROR_STOP=1 --quiet

if %ERRORLEVEL% EQU 0 (
    echo Sales module tables fixed successfully!
) else (
    echo Error occurred during execution. Check the output above.
)
pause