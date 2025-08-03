# Build auth-service with local Node.js

Write-Host "Building auth-service with local Node.js..." -ForegroundColor Green

# 确保共享库已构建
Write-Host "Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# 创建临时构建目录
$buildDir = "temp-build-auth"
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir

# 复制必要文件到构建目录
Write-Host "Preparing build context..." -ForegroundColor Yellow
Copy-Item "node-v22.17.0-linux-x64-musl.tar.xz" "$buildDir/"
Copy-Item -Recurse "shared" "$buildDir/"
Copy-Item -Recurse "auth-service/src" "$buildDir/"
Copy-Item "auth-service/package*.json" "$buildDir/"
Copy-Item "auth-service/tsconfig.json" "$buildDir/"

# 创建简化的Dockerfile
$dockerfileContent = @"
FROM alpine:latest

# 安装基础依赖
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    ca-certificates \
    bash

# 创建node用户
RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# 复制并安装Node.js
COPY node-v22.17.0-linux-x64-musl.tar.xz /tmp/
RUN tar -xJf /tmp/node-v22.17.0-linux-x64-musl.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v22.17.0-linux-x64-musl.tar.xz

# 设置PATH
ENV PATH=/usr/local/bin:$PATH

# 设置npm镜像源
RUN npm config set registry https://registry.npmmirror.com

# 构建共享库
WORKDIR /shared
COPY shared/ ./
RUN npm install
RUN npx tsc

# 构建auth-service
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# 切换到node用户
USER node

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]
"@

$dockerfileContent | Out-File -FilePath "$buildDir/Dockerfile" -Encoding UTF8

# 构建镜像
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t auth-service:local $buildDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Auth service built successfully!" -ForegroundColor Green
    
    # 清理临时目录
    Remove-Item -Recurse -Force $buildDir
    Write-Host "Cleaned up build directory" -ForegroundColor Gray
    
    # 验证镜像
    Write-Host "Verifying image..." -ForegroundColor Yellow
    docker images auth-service:local
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Build directory preserved at: $buildDir" -ForegroundColor Yellow
}