# Scenarios: coolify-deploy

> **Fuente**: ticket `cicd-coolify-deploy` (sin artefacto enriquecido — el
> título incluye criterios de aceptación, se mapean 1:1 en SC-001..SC-003).
> Entidades de `data-model.md` y endpoints de `api-spec.yml`: no aplican
> (change de CI/CD; los únicos endpoints son los webhooks externos de Coolify
> provistos en el ticket).

### SC-001: Merge a main dispara el deploy automático

**Given** un PR desde una rama feature hacia `main` ha sido fusionado
**When** el push resultante a `main` completa
**Then** el workflow `Deploy to Coolify` (`.github/workflows/deploy.yml`) se ejecuta automáticamente
**And** no requiere la variable `DEPLOY_ENABLED` ni secrets SSH para dispararse

### SC-002: El workflow invoca los webhooks de ambas aplicaciones

**Given** el workflow `Deploy to Coolify` en ejecución sobre `main`
**When** el job de deploy ejecuta los pasos de invocación
**Then** se invoca vía `curl --request POST` con `Authorization: Bearer $COOLIFY_API_TOKEN` el webhook de `riff-web-staging` (secret `COOLIFY_WEB_STAGING_WEBHOOK_URL`)
**And** se invoca vía `curl --request POST` con `Authorization: Bearer $COOLIFY_API_TOKEN` el webhook de `riff-admin-staging` (secret `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`)
**And** Coolify recibe la señal y despliega ambas aplicaciones (build in-situ gestionado por Coolify)

> Actualizado 2026-10-01: la verificación de T3 descubrió 401 `{"message":"Unauthenticated."}` — las URLs del ticket son endpoints de API de Coolify que exigen Bearer (TDD Failure Report, attempt 2; decisión del usuario: opción A).

### SC-003: Ejecución manual vía workflow_dispatch

**Given** un operador abre la pestaña Actions del repositorio
**When** ejecuta manualmente el workflow `Deploy to Coolify` seleccionando la rama `main`
**Then** se dispara el deploy y se invocan los webhooks de ambas aplicaciones staging

### SC-004: Push a ramas que no son main no dispara deploy

**Given** un desarrollador hace push a una rama feature o abre un PR
**When** el push o el PR completa
**Then** el workflow `Deploy to Coolify` NO se ejecuta (solo `ci.yml` protege PRs)

### SC-005: Secret de webhook no configurado → no-op con aviso

**Given** el workflow en ejecución y `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` sin configurar
**When** el paso correspondiente evalúa el secret
**Then** el paso se omite emitiendo un `::warning::` visible en el log de Actions
**And** el deploy de la otra aplicación (web) procede normalmente
**And** el workflow no falla por el secret faltante

### SC-006: Fallo de webhook visible en el workflow

**Given** el workflow en ejecución y Coolify devolviendo un error HTTP (>= 400) en un webhook
**When** `curl --fail` completa con código de salida distinto de cero
**Then** el paso marca fallo y el job de deploy queda en rojo
**And** el error es visible en el log de Actions sin exponer el valor del secret
