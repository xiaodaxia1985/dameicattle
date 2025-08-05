#!/usr/bin/env pwsh

Write-Host "=== Creating Local Dockerfiles for Microservices ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service", 
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service", 
    "notification-service", "file-service", "monitoring-service", 
    "news-service"
)

# 基础Dockerfile模板（使用本地Node.js）
$dockerfileTemplate = @"
# 使用Alpine Linux作为基础镜像
FROM alpine:latest

# 安装基础依赖
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    ca-certificates

# 创建node用户
RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# 复制本地Node.js安装包
COPY ../node-v22.17.0-linux-x64.tar.xz /tmp/

# 解压Node.js到系统目录
RUN tar -xJf /tmp/node-v22.17.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v22.17.0-linux-x64.tar.xz

# 设置PATH环境变量
ENV PATH=/usr/local/bin:$PATH

# 验证Node.js安装
RUN node --version && npm --version

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . ./

# 如果是TypeScript项目，构建代码
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# 切换到node用户
USER node

# 暴露端口
EXPOSE SERVICE_PORT

# 启动命令
CMD ["npm", "start"]
"@

# 简化版Dockerfile模板（不需要构建的服务）
$simpleDockerfileTemplate = @"
# 使用Alpine Linux作为基础镜像
FROM alpine:latest

# 安装基础依赖
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    ca-certificates

# 创建node用户
RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# 复制本地Node.js安装包
COPY ../node-v22.17.0-linux-x64.tar.xz /tmp/

# 解压Node.js到系统目录
RUN tar -xJf /tmp/node-v22.17.0-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v22.17.0-linux-x64.tar.xz

# 设置PATH环境变量
ENV PATH=/usr/local/bin:$PATH

# 验证Node.js安装
RUN node --version && npm --version

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . ./

# 切换到node用户
USER node

# 暴露端口
EXPOSE SERVICE_PORT

# 启动命令
CMD ["npm", "start"]
"@

$portMap = @{
    "api-gateway" = 3000
    "auth-service" = 3001
    "base-service" = 3002
    "cattle-service" = 3003
    "health-service" = 3004
    "feeding-service" = 3005
    "equipment-service" = 3006
    "procurement-service" = 3007
    "sales-service" = 3008
    "material-service" = 3009
    "notification-service" = 3010
    "file-service" = 3011
    "monitoring-service" = 3012
    "news-service" = 3013
}

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "Creating Dockerfile.local for $service..." -ForegroundColor Cyan
        
        $port = $portMap[$service]
        
        # 检查是否是TypeScript项目
        $hasTypeScript = Test-Path "$service/tsconfig.json"
        
        if ($hasTypeScript) {
            $dockerfile = $dockerfileTemplate -replace "SERVICE_PORT", $port
        } else {
            $dockerfile = $simpleDockerfileTemplate -replace "SERVICE_PORT", $port
        }
        
        # 保存Dockerfile
        $dockerfile | Set-Content "$service/Dockerfile.local" -Encoding UTF8
        
        Write-Host "  ✓ Created $service/Dockerfile.local" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Service directory $service not found" -ForegroundColor Yellow
    }
}

Set-Location $originalPath

Write-Host "`n=== Local Dockerfiles created! ===" -ForegroundColor Green
Write-Host "All services now have Dockerfile.local that uses the local Node.js package." -ForegroundColor Cyan