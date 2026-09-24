# Stage 1: Base
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Stage 2: Build
FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile
COPY . .

WORKDIR /app/apps/api
RUN pnpm build

# Stage 3: Runner
FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

# Copy workspace config and package files to install production dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the build output and prisma client from build stage
COPY --from=build --chown=nodeuser:nodegroup /app/apps/api/dist ./apps/api/dist
# Copy generated prisma client (it goes into the root node_modules in pnpm workspaces)
COPY --from=build --chown=nodeuser:nodegroup /app/node_modules/.pnpm /app/node_modules/.pnpm

USER nodeuser

WORKDIR /app/apps/api

EXPOSE 3333

CMD ["node", "dist/src/main"]
