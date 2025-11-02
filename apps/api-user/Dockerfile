# ============================================
# Base Stage - Common dependencies
# ============================================
FROM node:20-alpine3.20 AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

# ============================================
# Dependencies Stage - Install all dependencies
# ============================================
FROM base AS dependencies
WORKDIR /app

# Copy package files (monorepo - no individual app package.json files)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including dev dependencies for build)
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN pnpm install --frozen-lockfile

# ============================================
# Builder Stage - Build the application
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy source code and configuration files
COPY prisma ./prisma
COPY tsconfig*.json nest-cli.json webpack.config.js ./
COPY apps ./apps
COPY libs ./libs

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the api-user application
RUN pnpm exec nest build api-user

# ============================================
# Production Dependencies Stage
# ============================================
FROM base AS prod-dependencies
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies only
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN pnpm install --prod --frozen-lockfile

# Copy and generate Prisma client for production
COPY prisma ./prisma
RUN pnpm exec prisma generate

# ============================================
# Production Stage - Optimized production image
# ============================================
FROM base AS prod
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production dependencies
COPY --from=prod-dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nestjs:nodejs /app/package.json ./

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist/apps/api-user ./dist

# Copy Prisma files for migrations (optional, can be removed if migrations run separately)
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production \
    PORT=3000

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]

# ============================================
# Development Stage - Hot reload support
# ============================================
FROM base AS dev
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate

# Set development environment
ENV NODE_ENV=development \
    PORT=3000

# Expose port
EXPOSE 3000

# Start in watch mode
CMD ["pnpm", "run", "start:user"]
