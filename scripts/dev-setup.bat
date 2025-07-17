@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 开始设置肉牛管理系统开发环境...

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js未安装，请先安装Node.js 18+
    exit /b 1
)

:: 检查Docker是否安装
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    exit /b 1
)

echo ✅ 环境检查通过

:: 创建必要的目录
echo 📁 创建项目目录...
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\uploads" mkdir backend\uploads
if not exist "frontend\dist" mkdir frontend\dist
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "data\postgres" mkdir data\postgres
if not exist "data\redis" mkdir data\redis

:: 复制环境配置文件
echo ⚙️  设置环境配置...
if not exist "backend\.env" (
    copy "backend\.env.development" "backend\.env"
    echo ✅ 后端环境配置文件已创建
)

:: 安装依赖
echo 📦 安装项目依赖...

:: 后端依赖
echo 安装后端依赖...
cd backend
call npm install
cd ..

:: 前端依赖
echo 安装前端依赖...
cd frontend
call npm install
cd ..

:: 小程序依赖
echo 安装小程序依赖...
cd miniprogram
call npm install
cd ..

echo ✅ 依赖安装完成

:: 启动数据库服务
echo 🗄️  启动数据库服务...
docker-compose up -d postgres redis

:: 等待数据库启动
echo ⏳ 等待数据库启动...
timeout /t 10 /nobreak >nul

:: 初始化数据库
echo 🔧 初始化数据库...
cd backend
call npm run db:setup
cd ..

echo 🎉 开发环境设置完成！
echo.
echo 📋 可用命令：
echo   npm run dev:all     - 启动所有服务
echo   npm run dev:backend - 仅启动后端
echo   npm run dev:frontend - 仅启动前端
echo   npm run dev:docker  - 使用Docker启动
echo   npm run test:all    - 运行所有测试
echo.
echo 🌐 访问地址：
echo   前端应用: http://localhost:5173
echo   后端API: http://localhost:3000
echo   数据库管理: http://localhost:8080
echo.

pause