# 多阶段构建 - 开发环境
FROM node:18-alpine AS development

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5173

# 开发模式启动命令
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境 - 使用Nginx
FROM nginx:alpine AS production

# 复制构建后的文件到Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]