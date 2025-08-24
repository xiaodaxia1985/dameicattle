@echo off
echo Fixing login issues...

echo.
echo 1. Fixing database view dependencies...
psql -h localhost -U postgres -d cattle_management -f "database\fix-database-views.sql"

echo.
echo 2. Rebuilding auth-service...
cd microservices\auth-service
call npm run build

echo.
echo 3. Rebuilding feeding-service...
cd ..\feeding-service
call npm run build

echo.
echo 4. Going back to root directory...
cd ..\..

echo.
echo Fix completed! You can now restart the services.
echo Run: npm run dev:microservices
pause