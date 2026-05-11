FROM node:18-alpine

WORKDIR /app

COPY lambda/package*.json ./

RUN npm install --production

COPY lambda/ ./

EXPOSE 3000

CMD ["node", "server.js"]
