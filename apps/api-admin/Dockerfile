FROM node:20-alpine3.20 AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build api-admin           # => dist/apps/api-admin

FROM node:20-alpine3.20 AS prod
WORKDIR /app
COPY --from=builder /app/dist/apps/api-admin ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM node:20-alpine3.20 AS dev
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]
