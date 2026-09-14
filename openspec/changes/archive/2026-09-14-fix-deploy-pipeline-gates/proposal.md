# Proposal: Fix deploy pipeline gates (CI dependency, Coolify webhooks, Astro validation build)

- **Ticket ID**: RIFF-DEPLOY-01 (Change A del plan de despliegue)
- **Título original**: "[deploy] GCP infra provisioning / RIFF-DEPLOY-01 — pipeline gates"
- **Tag**: `[deploy]`
- **Change name**: `fix-deploy-pipeline-gates`

## Motivación

El pipeline de deploy ya está escrito (`deploy.yml`) pero no garantiza que CI haya
pasado antes de desplegar, y sus disparadores de Coolify no son seguros ni están
aislados por ambiente. Concretamente:

- **AC2 roto**: `deploy.yml` se dispara por `push` a `main` en paralelo a `ci.yml`.
  Un push que rompe CI puede igualmente disparar deploy (los jobs solo dependen de
  `docker-build`, no de `ci.yml`). No existen workflows paralelos que deban
  bloquear, pero el deploy no depende **explícitamente** del éxito de CI.
- **AC4 parcial**: el build de validación de Astro en `docker-build` corre
  `docker build -f apps/web/Dockerfile -t riff-web:pr .` **sin** pasar
  `--build-arg REQUIRE_API=false`. Como el Dockerfile por defecto usa
  `REQUIRE_API=true`, el build de validación en el runner depende de una API
  viva local inexistente → falso fallo o, si el runner la bota silenciosamente,
  riesgo de publicar un catálogo vacío.
- **AC6/AC7 rotos**: `trigger-coolify` usa un único `COOLIFY_WEBHOOK_URL` por POST
  sin `Authorization: Bearer` ni aislamiento staging/producción. El ticket exige 4
  webhooks (web/admin × staging/prod) autenticados con `COOLIFY_API_TOKEN`, e
  invocar los de **producción solo** desde el lane de producción (nunca en staging).
- **AC8 parcial**: la promoción a producción valida el digest en staging, pero el
  gate actual depende de `docker-build`; debe depender del éxito de CI.

## Decisión

1. **Gating AC2 (workflow_run)**: `deploy.yml` se convierte en un workflow
   `workflow_run` que reacciona al workflow `CI` con `conclusion: success` y el
   mismo commit. Si CI falla, deploy no se dispara (AC2). `workflow_dispatch`
   permanece como vía manual explícita de deploy.
2. **Secrets (AC6)**: el workflow referencia los 5 secrets
   (`COOLIFY_API_TOKEN`, `COOLIFY_WEB_STAGING_WEBHOOK_URL`,
   `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`, `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL`,
   `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL`). **Crear los secrets = ops manual**
   (fuera de este change); el workflow no los imprime ni los loguea. Cada webhook
   se invoca con `curl --fail --silent --show-error --request GET "$URL" -H
   "Authorization: Bearer $COOLIFY_API_TOKEN"`.
3. **Astro validation build (AC4)**: en `docker-build`, el build de validación de
   Astro pasa `--build-arg REQUIRE_API=false` (el runner no tiene API viva para
   validar, solo compila); los builds reales de Coolify siguen con
   `REQUIRE_API=true` (fallan si la API no responde o llega catálogo vacío).
4. **Aislamiento de ambientes (AC7)**: dos jobs Coolify — `deploy-frontends-staging`
   (solo en el lane staging, tras el smoke de Cloud Run) y
   `deploy-frontends-production` (solo en el lane producción). Staging **nunca**
   toca dominios/recursos de producción.

## Alcance

- `.github/workflows/deploy.yml` (reescritura de triggers/jobs de frontends + gating).
- `docs/deploy-standards.md` (sección Pipeline: nuevo gating `workflow_run`,
  secrets Coolify por ambiente, invocación Bearer).

## Fuera de alcance (track ops manual / otros changes)

- Crear los 4 recursos Coolify y los 5 secrets en GitHub (ops manual).
- Provisioning GCP (ops manual).
- Smoke tests de frontends completos (Change C) y rollback documentado extendido
  (Change C).
- Webhook de regeneración de catálogo en el backend (Change B).

## Riesgos

- `workflow_run` no se dispara en PRs (solo en main/tags); docker-build de PRs
  seguirá cubierto por `ci.yml`. Documentar.
- Los secrets ausentes (antes del ops) hacen que los jobs Coolify sean no-op con
  aviso, manteniendo main verde — mismo patrón que el gate `vars.GCP_PROJECT`.