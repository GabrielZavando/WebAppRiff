# syntax=docker/dockerfile:1
#
# Multi-stage build for the Angular admin panel (apps/admin) of the Riff
# monorepo.
#
# Build context: the monorepo root (npm ci --workspace needs the root lockfile):
#   docker build -f apps/admin/Dockerfile -t riff-admin .
#
# The runtime stage serves the compiled static bundle with nginx (no Node.js)
# using SPA fallback routing. The bundle contains no Firebase Admin secrets:
# the admin talks to Firebase Auth and the NestJS API from the browser.

# ---------- Stage 1: build ----------
FROM node:24 AS build
WORKDIR /app

# Manifests needed to resolve the workspace graph from the root lockfile.
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/package.json

# Install only the admin workspace dependencies (hoisted to /app/node_modules).
# --ignore-scripts: no lifecycle script runs inside Docker (the root postinstall
# and any workspace prepare need deps that filtered installs do not provide).
RUN npm ci --workspace=@riff/admin --include-workspace-root=false --ignore-scripts

COPY apps/admin/package.json apps/admin/angular.json apps/admin/tsconfig.json ./apps/admin/
COPY apps/admin/src ./apps/admin/src

RUN npm run build --workspace=@riff/admin

# ---------- Stage 2: runtime (static, SPA) ----------
FROM nginx:alpine AS runtime

COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist/admin/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
