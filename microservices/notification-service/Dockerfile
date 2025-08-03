FROM alpine:latest

# 安装Node.js和npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制服务代码
WORKDIR /app
COPY notification-service/package*.json ./
RUN npm install

COPY notification-service/ ./
RUN npm run build

EXPOSE 3010

CMD ["npm", "start"]