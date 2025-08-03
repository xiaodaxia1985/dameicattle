FROM alpine:latest

# 瀹夎鍩虹渚濊禆
RUN apk add --no-cache \
    libstdc++ \
    libgcc \
    ca-certificates \
    bash

# 鍒涘缓node鐢ㄦ埛
RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# 澶嶅埗骞跺畨瑁匩ode.js
COPY node-v22.17.0-linux-x64-musl.tar.xz /tmp/
RUN tar -xJf /tmp/node-v22.17.0-linux-x64-musl.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node-v22.17.0-linux-x64-musl.tar.xz

# 璁剧疆PATH
ENV PATH=/usr/local/bin:

# 璁剧疆npm闀滃儚婧?
RUN npm config set registry https://registry.npmmirror.com

# 鏋勫缓鍏变韩搴?
WORKDIR /shared
COPY shared/ ./
RUN npm install
RUN npx tsc

# 鏋勫缓auth-service
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# 鍒囨崲鍒皀ode鐢ㄦ埛
USER node

# 鏆撮湶绔彛
EXPOSE 3001

# 鍚姩鍛戒护
CMD ["npm", "start"]
