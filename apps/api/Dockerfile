# Stage 1: Base
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Stage 2: Build
FROM base AS build

# Copy all workspace manifests so pnpm can resolve the full closure
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/emails/package.json ./packages/emails/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build emails first — apps/api depends on it
WORKDIR /app/packages/emails
RUN pnpm build

# Build api
WORKDIR /app/apps/api
RUN pnpm build

# Stage 3: Runner
FROM node:22-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

# Copy all workspace manifests for production install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/emails/package.json ./packages/emails/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --prod --frozen-lockfile

# Copy built outputs from build stage
COPY --from=build --chown=nodeuser:nodegroup /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nodeuser:nodegroup /app/packages/emails/dist ./packages/emails/dist
COPY --from=build --chown=nodeuser:nodegroup /app/node_modules/.pnpm /app/node_modules/.pnpm

USER nodeuser

WORKDIR /app/apps/api

EXPOSE 3333

CMD ["node", "dist/src/main"]
