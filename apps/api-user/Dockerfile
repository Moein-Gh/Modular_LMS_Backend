# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build api-user

# ---------- production ----------
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=builder /app/dist/apps/api-user ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]

# ---------- development (watch) ----------
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "nest", "start", "api-user", "--watch"]
