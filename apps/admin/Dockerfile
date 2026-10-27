# Stage 1: Base
FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Stage 2: Build
FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN pnpm install --frozen-lockfile
COPY . .

WORKDIR /app/apps/admin
RUN pnpm build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup
USER nodeuser

# Copy standalone build and static assets
COPY --from=build --chown=nodeuser:nodegroup /app/apps/admin/.next/standalone ./
COPY --from=build --chown=nodeuser:nodegroup /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build --chown=nodeuser:nodegroup /app/apps/admin/public ./apps/admin/public

EXPOSE 3002

# Next.js standalone server entry point
CMD ["node", "apps/admin/server.js"]
