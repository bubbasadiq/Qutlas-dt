FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV HUB_ID=hub-container
ENV GRPC_URL=backend-api:3002

CMD ["node", "dist/main.js"]
