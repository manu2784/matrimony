FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS dev

RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS prod

ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "./bin/www"]
