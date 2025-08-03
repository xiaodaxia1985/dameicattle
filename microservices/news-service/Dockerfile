FROM alpine:latest

# 安装Node.js和npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# 首先复制并构建共享库
COPY shared/ /shared/
WORKDIR /shared
RUN npm install && npm run build

# 创建应用目录并复制package文件
WORKDIR /app
COPY news-service/package*.json ./

# 临时修改package.json以使用构建好的共享库
RUN sed -i 's|"@cattle-management/shared": "file:../shared"|"@cattle-management/shared": "file:/shared"|g' package.json

# 安装依赖
RUN npm install

# 复制服务代码
COPY news-service/src ./src
COPY news-service/tsconfig.json ./

# 构建应用
RUN npm run build

EXPOSE 3013

CMD ["npm", "start"]