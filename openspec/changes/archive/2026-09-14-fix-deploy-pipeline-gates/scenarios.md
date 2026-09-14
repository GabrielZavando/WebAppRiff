# Scenarios — fix-deploy-pipeline-gates

> Nota de validación de diseño: este change no toca entidades del data model ni
> endpoints del API. Sus aceptaciones verifican el **comportamiento del pipeline
> de CI/CD** (workflows GitHub), no reglas de negocio Firestore.

### SC-001: Deploy no comienza si CI falla (AC2)
**Given** un push a `main` con un commit cuyo workflow `CI` termina con errores
**When** GitHub evalúa el trigger de `deploy.yml`
**Then** el deploy NO se inicia (workflow_run requiere `conclusion: success` de `CI` sobre el mismo commit)
**And** ningún componente se despliega en Cloud Run ni en Coolify

### SC-002: Deploy comienza solo tras CI en éxito (AC2, happy path)
**Given** un push a `main` cuyo workflow `CI` termina correctamente (`conclusion: success`)
**When** GitHub dispara `deploy.yml` vía `workflow_run`
**Then** el pipeline de deploy se ejecuta apuntando al mismo commit validado por CI

### SC-003: Build de validación de Astro no depende de una API viva (AC4)
**Given** el job `docker-build` de `deploy.yml` valida la imagen de Astro en el runner
**When** ejecuta `docker build -f apps/web/Dockerfile`
**Then** pasa `--build-arg REQUIRE_API=false` para la imagen de validación `riff-web:pr`
**And** el build NO requiere una API local inexistente en el runner para compilar

### SC-004: Los builds reales de Coolify mantienen REQUIRE_API=true (AC4)
**Given** un despliegue real de Astro en staging o producción vía Coolify
**When** Coolify construye desde el repo con sus Build Variables
**Then** `REQUIRE_API` está en `true` (fuera del control del workflow; es config de Coolify, no del repo)
**And** si la API no responde o el catálogo vuelve vacío, el build de Astro falla (defensa existente en `apps/web`)

### SC-005: Webhooks de Coolify autenticados con Bearer (AC6)
**Given** el pipeline despliega frontends en staging o producción
**When** invoca el webhook de Coolify correspondiente
**Then** usa `curl --fail --silent --show-error --request GET "$URL" -H "Authorization: Bearer $COOLIFY_API_TOKEN"`
**And** el token nunca aparece en logs ni en la salida (solo en el header, vía secret)

### SC-006: Staging nunca dispara despliegue de producción (AC7)
**Given** el lane de staging (`push` a `main` validado por CI)
**When** dispara los frontends de Coolify
**Then** solo invoca `COOLIFY_WEB_STAGING_WEBHOOK_URL` y `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`
**And** NO toca los webhooks de producción

### SC-007: Producción se dispara solo desde el lane de producción (AC7)
**Given** el lane de producción (`tag v*` o `workflow_dispatch` validado)
**When** dispara los frontends de Coolify
**Then** solo invoca `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL` y `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL`
**And** no reutiliza webhooks de staging en producción

### SC-008: Los webhooks se disparan después del smoke de Cloud Run (AC3)
**Given** un push a `main` validado por CI en staging
**When** el lane de staging ejecuta
**Then** `deploy-backend-staging` (Cloud Run + smoke de staging) completa con éxito ANTES de que se dispare `deploy-frontends-staging`

### SC-009: Los secrets ausentes no rompen main (no-op con aviso)
**Given** que aún no se crearon los secrets de Coolify (ops manual pendiente)
**When** el pipeline corre los jobs de frontends
**Then** cada job detecta el secret vacío, imprime un aviso claro y termina en éxito (no-op), sin desplegar nada

### SC-010: Deploy por PR sigue cubierto por CI
**Given** un PR con un commit cuya imagen de alguna app está rota
**When** CI corre (`ci.yml` incluye typecheck/build/test/audit)
**Then** el PR queda en rojo sin llegar a deploy (los PRs no activan `deploy.yml`, que es `workflow_run`/dispatch)