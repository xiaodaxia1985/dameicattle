FROM dockerproxy.com/library/node:18-alpine

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制认证服务代码
WORKDIR /app
COPY auth-service/package*.json ./
RUN npm install

COPY auth-service/ ./
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]