@echo off
echo 正在初始化销售管理模块数据库...

set PGPASSWORD=dianxin99
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=cattle_management
set DB_USER=postgres

echo 连接数据库: %DB_NAME%
echo 主机: %DB_HOST%:%DB_PORT%
echo 用户: %DB_USER%
echo.

echo 执行销售管理模块数据库迁移...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f migrations/create_sales_tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 销售管理模块数据库初始化完成！
    echo.
    echo 已创建的表:
    echo - customers (客户表)
    echo - sales_orders (销售订单表)  
    echo - sales_order_items (销售订单明细表)
    echo - customer_visit_records (客户回访记录表)
    echo.
    echo 已插入测试数据:
    echo - 5个客户记录
    echo - 5个销售订单记录
    echo - 10个订单明细记录
    echo - 6个客户回访记录
) else (
    echo.
    echo ❌ 数据库初始化失败，请检查数据库连接和权限
)

echo.
pause