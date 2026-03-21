# 使用官方 Node.js 20 镜像 ( alpine 版本更节省空间 )
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先拷贝 package.json 和 lock 文件，利用 Docker 缓存层优化构建速度
COPY package*.json ./

# 安装依赖
RUN npm install

# 拷贝后端所有源代码
COPY . .

# 暴露后端运行端口 (根据你的 index.js，默认是 5000)
EXPOSE 5000

# 启动命令
CMD ["npm", "start"]
