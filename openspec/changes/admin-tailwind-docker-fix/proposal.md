# Proposal: Fix CSS del admin en build Docker (plugin PostCSS/Tailwind en la imagen)

## Why

El admin de staging (`https://admin-staging.somosriff.cl/`) carga sin estilos:
en el build Docker **Tailwind no se ejecuta** — el CSS desplegado contiene las
directivas en crudo (`@theme`, `@source`, `@layer`, `@font-face`) sin
utilidades. Causa raíz confirmada: `apps/admin/.postcssrc.json` (que declara
el plugin `@tailwindcss/postcss`) no se copia a la imagen, así que Angular CLI
no ejecuta PostCSS y el plugin nunca procesa `globals.css` (en local funciona
porque el archivo está en el working directory). Sin CSS el login no es
usable, lo que bloquea el cierre de las tareas 5.2, 6.1 y 6.2 del change
archivado `backend-staging-deploy` y la tarea 7.5 del change archivado
`deploy-docker-hardening`.

## What Changes

- **Fix del plugin en Docker (esta corrección)**: añadir
  `COPY apps/admin/.postcssrc.json ./apps/admin/` a `apps/admin/Dockerfile`,
  junto a los demás COPY de configuración y antes de `COPY apps/admin/src`.
  Verificado con `docker build` local comprobando **contenido** (utilidades
  presentes, sin directivas en crudo), no solo tamaño.
- **Fix de escaneo (ya aplicado, se mantiene)**: `@source "../**/*.{html,ts}"`
  en `apps/admin/src/styles/globals.css` tras `@import "tailwindcss";`. Es
  correcto y necesario (escaneo explícito de fuentes cuando el plugin corre),
  pero sin el plugin no tiene efecto. No se re-implementa ni se toca.
  - Nota: la verificación previa por tamaño (CSS ~11 KB → ~50 KB) resultó
    insuficiente — no comprobaba utilidades — y llevó a una primera hipótesis
    de causa raíz (detección automática basada en `.git`) hoy descartada; la
    evidencia corregida vive en design.md.
- **Despliegue y verificación end-to-end (operador)**: redespliegue del admin
  en Coolify tras el merge, verificación visual de estilos en
  `https://admin-staging.somosriff.cl/` y login real con
  `soporte@gabrielzavando.cl` contra el backend de staging (`/auth/me` → 200,
  header `Authorization: Bearer` presente).
- **Cierre de tareas bloqueadas (tras verificación)**: marcar 5.2, 6.1 y 6.2
  en `openspec/changes/archive/2026-10-13-backend-staging-deploy/tasks.md` y
  7.5 en `openspec/changes/archive/2026-10-12-deploy-docker-hardening/tasks.md`,
  actualizando el `verification.md` de ambos con resultado, fecha y ejecutor.

## Capabilities

### New Capabilities

Ninguna. Este change no introduce capacidades de producto.

### Modified Capabilities

Ninguna. Es un fix de build (housekeeping técnico) sin cambio de comportamiento
de producto: el CSS correcto es el comportamiento ya especificado del admin, no
un requisito nuevo. No se producen deltas de specs ni se crean archivos bajo
`specs/` (`skip_specs: true`).

## Impact

- **Código**: `apps/admin/Dockerfile` (nuevo `COPY` de `.postcssrc.json`);
  `apps/admin/src/styles/globals.css` (directiva `@source`, ya aplicada, no se
  toca de nuevo).
- **Build output**: CSS del bundle de admin en Docker con utilidades y sin
  directivas en crudo (~50 KB), verificado por contenido con `docker build`
  local.
- **Infra**: redeploy de `riff-admin-staging` en Coolify tras el merge.
- **Cambios archivados**: tasks.md y verification.md de
  `2026-10-13-backend-staging-deploy` y `2026-10-12-deploy-docker-hardening`
  (solo cierre de tareas bloqueadas, tras confirmación del usuario).
- **Sin cambios**: specs de producto, dependencias, otros Dockerfiles
  (backend, web), `.dockerignore`, nginx, gates de CI.
