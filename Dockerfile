FROM node:18.20.2-alpine3.19

LABEL maintainer="xiayi-foodie"
LABEL description="夏邑缘品荟智能餐饮系统"

ENV NODE_ENV=production
ENV PORT=3000

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache dumb-init tini && \
    rm -rf /var/cache/apk/*

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs -s /bin/ash -D nodejs && \
    chown -R nodejs:nodejs /home/nodejs

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production --no-audit && \
    npm cache clean --force && \
    rm -rf /root/.npm

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "lambda/server.js"]