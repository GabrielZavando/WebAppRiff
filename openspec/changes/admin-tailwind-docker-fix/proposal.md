# Proposal: Fix CSS del admin en build Docker (Tailwind v4 `@source`)

## Why

El admin de staging (`https://admin-staging.somosriff.cl/`) carga sin estilos:
Tailwind CSS v4 en el build Docker no detecta los archivos fuente
(`.html`/`.ts`) y emite un CSS de ~11 KB con solo tokens + preflight, sin
utilidades (en local el mismo build genera ~49 KB con todas las utilidades).
Sin CSS el login no es usable, lo que bloquea el cierre de las tareas 5.2, 6.1
y 6.2 del change archivado `backend-staging-deploy` y la tarea 7.5 del change
archivado `deploy-docker-hardening`.

## What Changes

- **Fix del CSS en Docker (ya aplicado y verificado)**: añadir
  `@source "../**/*.{html,ts}"` en `apps/admin/src/styles/globals.css` justo
  después de `@import "tailwindcss";`, para que Tailwind v4 escanee los fuentes
  del admin aunque el build corra dentro de Docker (los patrones de detección
  automática de Tailwind no cubren el layout del contenedor).
  - El fix ya está en el repo y verificado con `docker build` local: el CSS
    dentro de la imagen pasó de ~11 KB a ~50 KB, con utilidades. Este change
    lo documenta como completado; no se re-implementa.
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

- **Código**: `apps/admin/src/styles/globals.css` (directiva `@source`; ya
  aplicada, no se toca de nuevo).
- **Build output**: CSS del bundle de admin en Docker de ~11 KB → ~50 KB con
  utilidades (verificado con `docker build` local).
- **Infra**: redeploy de `riff-admin-staging` en Coolify tras el merge.
- **Cambios archivados**: tasks.md y verification.md de
  `2026-10-13-backend-staging-deploy` y `2026-10-12-deploy-docker-hardening`
  (solo cierre de tareas bloqueadas, tras confirmación del usuario).
- **Sin cambios**: specs de producto, dependencias, Dockerfiles, nginx, gates
  de CI.
