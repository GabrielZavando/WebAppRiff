# syntax=docker/dockerfile:1
#
# Multi-stage build for the Astro public site (apps/web) of the Riff monorepo.
#
# Build context: the monorepo root (npm ci --workspace needs the root lockfile):
#   docker build -f apps/web/Dockerfile -t riff-web \
#     --build-arg SITE_URL=https://somosriff.cl \
#     --build-arg NESTJS_API_URL=https://api.somosriff.cl/api/v1 \
#     --build-arg REQUIRE_API=true .
#
# Stage 0 builds the shared @riff/html-sanitize workspace package (its devDep
# typescript is only available in a dedicated, unfiltered install). The web
# stage then installs with --ignore-scripts so npm never runs html-sanitize's
# `prepare` there (typescript is absent under a filtered install); the
# pre-built dist is copied in instead. The runtime stage serves the baked
# static output with nginx (no Node.js) and contains no secrets:
# SITE_URL/NESTJS_API_URL/REQUIRE_API are public build inputs baked at build
# time (REQUIRE_API=true fails the build if the API is down or the catalog is
# empty — no silent empty-catalog publishing).

# ---------- Stage 0: build the shared html-sanitize package ----------
FROM node:24 AS html-sanitize-build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/html-sanitize/package.json packages/html-sanitize/tsconfig.json packages/html-sanitize/tsconfig.cjs.json ./packages/html-sanitize/
COPY packages/html-sanitize/src ./packages/html-sanitize/src

# --ignore-scripts: inside Docker no lifecycle script may run (the root
# `prepare: husky` and html-sanitize's `prepare` need devDeps that filtered
# installs do not provide). sharp/esbuild ship prebuilt binaries as optional
# dependencies, so skipping scripts is safe.
RUN npm ci --workspace=@riff/html-sanitize --include-workspace-root=false --ignore-scripts
RUN npm run build --workspace=@riff/html-sanitize

# ---------- Stage 1: build the Astro site ----------
FROM node:24 AS build
WORKDIR /app

ARG SITE_URL=http://localhost:4321
ARG NESTJS_API_URL=http://localhost:3000/api/v1
ARG REQUIRE_API=true

ENV SITE_URL=$SITE_URL \
    NESTJS_API_URL=$NESTJS_API_URL \
    REQUIRE_API=$REQUIRE_API

# Manifests needed to resolve the workspace graph from the root lockfile.
COPY package.json package-lock.json ./
COPY packages/html-sanitize/package.json ./packages/html-sanitize/package.json
COPY apps/web/package.json ./apps/web/package.json

# Pre-built dist of the linked workspace package. npm ci runs with
# --ignore-scripts (see header) so the `prepare` script never runs here.
COPY --from=html-sanitize-build /app/packages/html-sanitize/dist ./packages/html-sanitize/dist

# Install only the web workspace dependencies (hoisted to /app/node_modules).
RUN npm ci --workspace=@riff/web --include-workspace-root=false --ignore-scripts

COPY apps/web/package.json apps/web/tsconfig.json apps/web/astro.config.mjs ./apps/web/
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public

RUN npm run build --workspace=@riff/web

# ---------- Stage 2: runtime (static) ----------
FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
