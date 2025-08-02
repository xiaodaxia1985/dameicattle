FROM dockerproxy.com/library/node:18-alpine

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制服务代码
WORKDIR /app
COPY procurement-service/package*.json ./
RUN npm install

COPY procurement-service/ ./
RUN npm run build

EXPOSE 3007

CMD ["npm", "start"]