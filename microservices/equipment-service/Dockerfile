FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3002

CMD ["npm", "start"]