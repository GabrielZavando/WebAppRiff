# syntax=docker/dockerfile:1
#
# Multi-stage build for the Angular admin panel (apps/admin) of the Riff
# monorepo.
#
# Build context: the monorepo root (npm ci --workspace needs the root lockfile):
#   docker build -f apps/admin/Dockerfile -t riff-admin \
#     --build-arg FIREBASE_API_KEY=... \
#     --build-arg FIREBASE_AUTH_DOMAIN=... \
#     --build-arg FIREBASE_PROJECT_ID=... \
#     --build-arg FIREBASE_APP_ID=... \
#     --build-arg API_BASE_URL=https://api.example.com/api/v1 .
#
# The runtime stage serves the compiled static bundle with nginx (no Node.js)
# using SPA fallback routing. The bundle contains no Firebase Admin secrets:
# the admin talks to Firebase Auth and the NestJS API from the browser. The
# five build args above are the public client-side config (Firebase web API
# key, auth domain, project, app id and the public API base); the gitignored
# environment.production.ts is generated FROM them at build time (see D1 of
# change deploy-docker-hardening) and never travels in the build context
# (excluded in .dockerignore).

# ---------- Stage 1: build ----------
FROM node:24 AS build
WORKDIR /app

# Client-side config injected at build time (same vars as scripts/write-env.mjs
# consumes). Values without a default are expected from Coolify Build
# Variables; write-env.mjs warns and writes empty strings if they are missing.
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_APP_ID
ARG API_BASE_URL=http://localhost:3000/api/v1

# ARGs are only visible to FROM/ENV/RUN lines that reference them directly;
# promote to ENV so the build step (npm scripts) can read them.
ENV FIREBASE_API_KEY=$FIREBASE_API_KEY \
    FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN \
    FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
    FIREBASE_APP_ID=$FIREBASE_APP_ID \
    API_BASE_URL=$API_BASE_URL

# Manifests needed to resolve the workspace graph from the root lockfile.
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/package.json

# Install only the admin workspace dependencies (hoisted to /app/node_modules).
# --ignore-scripts: no lifecycle script runs inside Docker (the root postinstall
# and any workspace prepare need deps that filtered installs do not provide).
RUN npm ci --workspace=@riff/admin --include-workspace-root=false --ignore-scripts

COPY apps/admin/package.json apps/admin/angular.json apps/admin/tsconfig.json apps/admin/tsconfig.app.json apps/admin/.postcssrc.json ./apps/admin/
COPY apps/admin/scripts ./apps/admin/scripts
COPY apps/admin/src ./apps/admin/src
# Favicon source: the single binary lives in apps/web/public (design D4). The
# prebuild hook (scripts/sync-favicon.mjs) copies it into src/favicon/ at
# build time, where the angular.json assets mapping picks it up and emits it
# at /logo_riff.png — same file and URL as the public site.
COPY apps/web/public/logo_riff.png ./apps/web/public/logo_riff.png

# Generate the gitignored environment.production.ts from the build args BEFORE
# the build (the postinstall that normally writes it never runs under
# --ignore-scripts, and the file is excluded from the build context on purpose).
# The script resolves the app root from its own location (apps/admin).
RUN node apps/admin/scripts/write-env.mjs --target=prod

RUN npm run build --workspace=@riff/admin

# ---------- Stage 2: runtime (static, SPA) ----------
FROM nginx:alpine AS runtime

COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist/admin/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
