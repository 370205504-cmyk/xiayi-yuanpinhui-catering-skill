FROM node:18-alpine

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D node

WORKDIR /app
RUN chown -R node:nodejs /app

USER node

COPY --chown=node:nodejs package*.json ./
RUN npm install --production
COPY --chown=node:nodejs . .

EXPOSE 3000

CMD ["node", "lambda/server.js"]
