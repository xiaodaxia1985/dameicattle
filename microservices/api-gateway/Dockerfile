FROM dockerproxy.com/library/node:18-alpine

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制API网关代码
WORKDIR /app
COPY api-gateway/package*.json ./
RUN npm install

COPY api-gateway/ ./
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]