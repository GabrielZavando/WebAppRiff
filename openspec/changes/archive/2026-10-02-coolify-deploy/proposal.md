# Proposal: coolify-deploy

> **Origin ticket**: `cicd-coolify-deploy` (rama `feat/cicd-coolify-deploy`)
> **Title**: Implementar flujo CI/CD automático desde GitHub hacia Coolify para desplegar las aplicaciones frontend del monorepo
> **Tag**: [deploy]

## Why

El workflow `.github/workflows/deploy.yml` estaba roto (SSH/docker gated por
`DEPLOY_ENABLED`, nunca desplegaba). Un primer approach lo reemplazó por curl a
los webhooks de la API de Coolify (`/api/v1/deploy`), pero los endpoints
devolvían 401 sin Bearer y 404 incluso autenticado (uuid no encontrado).
Coolify ya gestiona el build in-situ y su GitHub App (`coolify-github-zavando`)
tiene acceso al repositorio: el deploy nativo en merge a `main` hace innecesario
cualquier workflow de Actions. Objetivo final: repositorio limpio, sin
workflows fallidos, confiando en el deploy nativo de Coolify.

## What Changes

- **Eliminar** `.github/workflows/deploy.yml` (workflow de deploy obsoleto — el
  approach previo con curl a webhooks `/api/v1/deploy` devolvía 404) y los
  tests asociados (`tests/deploy-workflow.spec.mjs`,
  `tests/deploy-standards-docs.spec.mjs`).
- Documentar en `docs/deploy-standards.md` el **deploy nativo vía la GitHub
  App de Coolify** (`coolify-github-zavando`): merge a `main` → Coolify
  despliega ambas apps staging (build in-situ), sin workflow de Actions, sin
  secrets de webhook; redeploy manual desde el panel.
- Fuera de alcance: lane de producción de frontends, lane backend Cloud Run
  (sin cambios), configuración de builds en Coolify, smoke tests, limpieza de
  secrets históricos en GitHub (opcional).

## Design Validation

- **Entidades data-model**: no aplican (change de CI/CD, sin entidades de BD).
- **Endpoints api-spec.yml**: no aplican; los únicos endpoints son los
  webhooks externos de Coolify provistos en el ticket.
- **Conflicto menor**: `deploy-standards.md` §Pipeline documenta un diseño
  nunca implementado (`workflow_run` sobre CI + POST con Bearer
  `COOLIFY_API_TOKEN`). Este change lo reemplaza por el flujo simple acordado
  (push a `main` + curl GET sobre webhooks uuid pre-autenticados) y actualiza
  la documentación, resolviendo el conflicto.
- **Decisión**: las URLs de webhook viven en GitHub secrets ya documentados
  (`COOLIFY_WEB_STAGING_WEBHOOK_URL`, `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`), no
  hardcodeadas — el uuid del webhook es un capability token y el estándar de
  secretos prohíbe exponerlo. El ticket prohíbe `DEPLOY_ENABLED` y secrets SSH,
  no los secrets de webhook Coolify.
- **Actualización 2026-10-01 (post-apply)**: la verificación de T3 descubrió
  que las URLs provistas (`/api/v1/deploy?uuid=...`) son endpoints de API de
  Coolify que exigen `Authorization: Bearer` (401 `Unauthenticated.` sin auth —
  TDD Failure Report, attempt 2). **Decisión del usuario: opción A** — Bearer
  `COOLIFY_API_TOKEN` (ya existe en GitHub) + `--request POST`. Coincide con el
  diseño original documentado en `deploy-standards.md`. REQ-004 intacto (token
  de API, no secret SSH).
- **Actualización 2026-10-02 (pivote de enfoque)**: el workflow de Actions con
  curl a `/api/v1/deploy` (opción A, Bearer) falló en el run real con **404**
  (uuid no encontrado en la instancia de Coolify) y resultó innecesario: la
  GitHub App de Coolify (`coolify-github-zavando`) ya tiene acceso al repo y
  despliega nativamente al hacer merge a `main`. Se elimina el workflow + tests
  asociados y se documenta el flujo nativo (REQ-001..REQ-005 reescritos, SC-001..SC-005
  reescritos). Los commits del approach webhook quedan revertidos por esta decisión.
