# Simple Docker build approach

Write-Host "Building microservices with Docker (simplified approach)..." -ForegroundColor Green

# 确保我们有必要的文件
if (-not (Test-Path "node-v22.17.0-linux-x64-musl.tar.xz")) {
    Write-Host "❌ Alpine Node.js package not found" -ForegroundColor Red
    Write-Host "Please run: .\scripts\download-node-alpine.ps1" -ForegroundColor Yellow
    exit 1
}

# 先在本地构建共享库
Write-Host "Building shared library locally..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# 创建一个简化的Dockerfile，避免在容器内编译TypeScript
Write-Host "Creating simplified Dockerfile..." -ForegroundColor Yellow

$dockerfileContent = @"
FROM alpine:latest

# 安装基础依赖
RUN apk add --no-cache libstdc++ libgcc ca-certificates

# 创建node用户
RUN addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node

# 复制并安装Node.js
COPY node-v22.17.0-linux-x64-musl.tar.xz /tmp/
RUN tar -xJf /tmp/node-v22.17.0-linux-x64-musl.tar.xz -C /usr/local --strip-components=1 && \
    rm /tmp/node-v22.17.0-linux-x64-musl.tar.xz

# 设置PATH
ENV PATH=/usr/local/bin:$PATH

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 设置工作目录
WORKDIR /app

# 复制已构建的共享库
COPY shared/dist /app/node_modules/@cattle-management/shared/dist
COPY shared/package.json /app/node_modules/@cattle-management/shared/

# 复制服务的package.json并安装依赖
COPY package*.json ./
RUN npm install --production

# 复制已编译的代码（我们将在本地编译）
COPY dist ./dist

# 切换到node用户
USER node

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
"@

# 为auth-service创建构建目录
$buildDir = "temp-docker-auth"
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir

# 复制必要文件
Copy-Item "node-v22.17.0-linux-x64-musl.tar.xz" "$buildDir/"
Copy-Item -Recurse "shared" "$buildDir/"

# 在本地编译auth-service
Write-Host "Compiling auth-service locally..." -ForegroundColor Yellow
Set-Location auth-service
npm install
npm run build
Set-Location ..

# 复制编译后的文件
Copy-Item -Recurse "auth-service/dist" "$buildDir/"
Copy-Item "auth-service/package*.json" "$buildDir/"

# 创建Dockerfile
$dockerfileContent | Out-File -FilePath "$buildDir/Dockerfile" -Encoding UTF8

# 构建Docker镜像
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t auth-service:local $buildDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Auth service Docker image built successfully!" -ForegroundColor Green
    
    # 测试镜像
    Write-Host "Testing Docker image..." -ForegroundColor Yellow
    docker run --rm auth-service:local node --version
    
    # 清理
    Remove-Item -Recurse -Force $buildDir
    Write-Host "Cleaned up build directory" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "🎉 Docker image ready!" -ForegroundColor Green
    Write-Host "To run: docker run -p 3001:3001 --env-file .env auth-service:local" -ForegroundColor Cyan
} else {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    Write-Host "Build directory preserved at: $buildDir" -ForegroundColor Yellow
}