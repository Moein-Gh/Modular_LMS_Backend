FROM node:20-alpine3.20 AS builder
WORKDIR /app
# Copy root package.json and pnpm-lock.yaml for monorepo install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Use the exact pnpm version pinned in package.json
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate && pnpm install --frozen-lockfile
# Copy only api-admin app and libs after installing dependencies
COPY . .
RUN pnpm exec prisma migrate deploy
RUN pnpm exec prisma generate
# Explicitly build the api-admin project
RUN pnpm exec nest build api-admin           # => dist/apps/api-admin

FROM node:20-alpine3.20 AS prod
WORKDIR /app
COPY --from=builder /app/dist/apps/api-admin ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM node:20-alpine3.20 AS dev
WORKDIR /app
# Copy root package.json and pnpm-lock.yaml for monorepo install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Use the exact pnpm version pinned in package.json
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate && pnpm install
# Copy only api-admin app and libs after installing dependencies
COPY . .
RUN pnpm exec prisma generate
ENV NODE_ENV=development
EXPOSE 3000
# Start the correct project in watch mode
CMD ["pnpm", "run", "start:admin"]
