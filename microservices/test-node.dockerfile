FROM alpine:latest

# 安装基础依赖
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    ca-certificates \
    libc6-compat

# 复制Alpine版Node.js包
COPY node-v22.17.0-linux-x64-musl.tar.xz /tmp/

# 解压并安装Node.js
RUN cd /tmp && \
    tar -xJf node-v22.17.0-linux-x64-musl.tar.xz && \
    ls -la node-v22.17.0-linux-x64-musl/ && \
    cp -r node-v22.17.0-linux-x64-musl/* /usr/local/ && \
    rm -rf node-v22.17.0-linux-x64-musl* && \
    /usr/local/bin/node --version && \
    /usr/local/bin/npm --version

# 设置PATH
ENV PATH=/usr/local/bin:$PATH

# 验证PATH设置
RUN node --version && npm --version

CMD ["/bin/sh"]