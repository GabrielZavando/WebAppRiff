# syntax=docker/dockerfile:1
#
# Multi-stage build para el backend NestJS (apps/backend) del monorepo Riff.
#
# CONTEXTO DE BUILD: la raíz del monorepo (donde viven package.json,
# package-lock.json y apps/*). Build con:
#   docker build -f apps/backend/Dockerfile -t riff-backend .
#
# No se usa `apps/backend/` como contexto porque npm ci --workspace exige el
# lockfile raíz y los package.json de todos los workspaces declarados.

# ---------- Stage 1: build ----------
FROM node:22 AS build
WORKDIR /app

# Manifests del monorepo: raíz + los tres workspaces (npm ci --workspace necesita
# resolver el glob apps/* declarado en el package.json raíz).
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/admin/package.json ./apps/admin/package.json

# Instala SOLO las dependencias del workspace backend (hoisted a /app/node_modules).
RUN npm ci --workspace=@riff/backend --include-workspace-root=false

# Código y configs del backend.
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

# Compila a apps/backend/dist.
RUN npm run build --workspace=@riff/backend

# Podar devDependencies (jest, ts-jest, eslint, @nestjs/cli, typescript) para
# dejar solo deps de producción en /app/node_modules.
RUN npm prune --omit=dev --workspace=@riff/backend --include-workspace-root=false

# ---------- Stage 2: runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Solo el bundle compilado + deps de producción.
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# No correr como root: la app es read-only y el usuario `node` (uid 1000) de la
# imagen base puede leer los archivos copiados sin necesidad de chown.
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
