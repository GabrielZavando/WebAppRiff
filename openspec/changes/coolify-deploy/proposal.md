# Proposal: coolify-deploy

> **Origin ticket**: `cicd-coolify-deploy` (rama `feat/cicd-coolify-deploy`)
> **Title**: Implementar flujo CI/CD automático desde GitHub hacia Coolify para desplegar las aplicaciones frontend del monorepo
> **Tag**: [deploy]

## Why

El workflow actual `.github/workflows/deploy.yml` está roto: usa SSH directo
(`appleboy/ssh-action`) con build Docker en el runner y se omite por la variable
`DEPLOY_ENABLED` (no configurada), por lo que nada se despliega desde GitHub.
Coolify ya tiene los webhooks de deploy configurados para ambas apps de staging
(`riff-web-staging`, `riff-admin-staging`) y gestiona el build in-situ, por lo
que GitHub solo necesita notificar el merge a `main`. Flujo deseado: merge a
`main` → deploy automático de ambos frontends de staging, sin secrets SSH ni
gating por `DEPLOY_ENABLED`.

## What Changes

- Reemplazar el contenido de `.github/workflows/deploy.yml`: trigger en `push`
  a `main` + `workflow_dispatch`; job único que invoca los webhooks de Coolify
  vía `curl --request POST` con `Authorization: Bearer $COOLIFY_API_TOKEN`
  para ambas apps staging usando los secrets
  `COOLIFY_WEB_STAGING_WEBHOOK_URL` y `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`;
  no-op con aviso si un secret de URL falta; sin lógica de build/Docker ni SSH.
  *(Actualizado 2026-10-01: Bearer requerido — ver Design Validation.)*
- Eliminar los jobs legacy SSH/docker (`deploy-staging`, `deploy-production`,
  `rollback`) del workflow.
- Documentar el flujo en `docs/deploy-standards.md` (§Pipeline, §Deploy Flow
  Lane frontends, §Environment Variables).
- Fuera de alcance: lane de producción de frontends, lane backend Cloud Run
  (sin cambios), configuración de builds en Coolify, smoke tests.

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
