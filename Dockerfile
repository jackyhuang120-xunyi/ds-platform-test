# 第一阶段：构建环境
FROM node:20-alpine AS build-stage

WORKDIR /app

# 拷贝依赖配置
COPY package*.json ./

# 安装所有依赖 (包括 devDependencies 以进行构建)
RUN npm install

# 拷贝前端源代码
COPY . .

# 执行构建 (生成 dist 文件夹)
RUN npm run build

# 第二阶段：生产运行环境 (Nginx)
FROM nginx:alpine

# 从第一阶段拷贝构建好的静态文件到 Nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 拷贝自定义的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
