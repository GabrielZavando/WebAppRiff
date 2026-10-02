# Requirements: coolify-deploy

1. **REQ-001 — Trigger automático en push a main**: El workflow
   `.github/workflows/deploy.yml` debe dispararse automáticamente en push a la
   rama `main` (post-merge de PR). Traceable: SC-001, SC-004.
2. **REQ-002 — Invocación de webhooks Coolify vía curl POST con Bearer**: El
   workflow debe invocar mediante `curl --request POST` con
   `Authorization: Bearer $COOLIFY_API_TOKEN` los webhooks de deploy de Coolify
   para ambas aplicaciones staging (`riff-web-staging`,
   `riff-admin-staging`) usando los secrets `COOLIFY_WEB_STAGING_WEBHOOK_URL` y
   `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`. *(Actualizado 2026-10-01: los endpoints
   `/api/v1/deploy` exigen Bearer — TDD Failure Report de T3; decisión:
   opción A.)* Traceable: SC-002, SC-006.
3. **REQ-003 — Ejecución manual**: El workflow debe soportar
   `workflow_dispatch`, ejecutable manualmente seleccionando la rama `main`.
   Traceable: SC-003.
4. **REQ-004 — Sin gating ni lógica legacy**: El workflow no debe requerir la
   variable `DEPLOY_ENABLED`, ni secrets SSH, ni contener lógica de
   build/Docker (Coolify gestiona el build in-situ). Traceable: SC-001,
   SC-002, SC-004.
5. **REQ-005 — Degradación controlada**: Si un secret de webhook no está
   configurado, el paso correspondiente debe omitirse con aviso visible en el
   log, sin fallar el workflow ni bloquear el deploy de la otra aplicación.
   Traceable: SC-005.
6. **REQ-006 — Documentación del flujo**: `docs/deploy-standards.md` debe
   reflejar el nuevo flujo en §Pipeline, §Deploy Flow (Lane frontends) y
   §Environment Variables. Traceable: SC-001, SC-002, SC-005.
