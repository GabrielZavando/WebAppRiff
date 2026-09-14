# Requirements — fix-deploy-pipeline-gates

1. **R1 — Deploy gated por CI.** `deploy.yml` debe ser un workflow `workflow_run`
   que reaccione a `CI` con `conclusion: success` sobre el mismo commit; ninguna
   vía de deploy (push/tag) procede si CI falla. `workflow_dispatch` queda como
   excepción manual explícita. (SC-001, SC-002)
2. **R2 — Validación de Astro sin API viva.** El job `docker-build` de
   `deploy.yml` construye la imagen de Astro `riff-web:pr` con
   `--build-arg REQUIRE_API=false`. (SC-003)
3. **R3 — Builds de Coolify con REQUIRE_API=true.** Los builds reales (staging y
   producción) usan `REQUIRE_API=true` vía Build Variables de Coolify (config
   externa al repo); el workflow no fuerza `false` para esas imágenes. (SC-004)
4. **R4 — Webhooks autenticados con Bearer.** Cada webhook de Coolify se invoca
   con `curl --fail --silent --show-error --request GET "$URL" -H "Authorization:
   Bearer $COOLIFY_API_TOKEN"`; el token se lee de secret y nunca se loguea.
   (SC-005)
5. **R5 — Los 5 secrets Coolify referenciados.** El workflow usa
   `COOLIFY_API_TOKEN`, `COOLIFY_WEB_STAGING_WEBHOOK_URL`,
   `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`, `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL`,
   `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL`. Su creación es ops manual (fuera del
   change). (SC-009)
6. **R6 — Aislamiento de ambientes.** `deploy-frontends-staging` solo invoca
   webhooks de staging; `deploy-frontends-production` solo invoca webhooks de
   producción. (SC-006, SC-007)
7. **R7 — Orden Cloud Run → frontends.** En staging,
   `deploy-backend-staging` (Cloud Run + smoke) debe completar antes de
   `deploy-frontends-staging`. (SC-008)
8. **R8 — No-op resiliente.** Si un webhook no está configurado (secret vacío),
   el job imprime aviso y termina en éxito sin desplegar. (SC-009)
9. **R9 — PRs cubiertos por CI.** `deploy.yml` no se dispara en PRs; la
   protección de PR recae en `ci.yml` (typecheck/build/test/audit/docker).
   (SC-010)