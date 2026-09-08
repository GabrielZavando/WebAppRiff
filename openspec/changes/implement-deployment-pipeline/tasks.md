## 1. Contrato de env del sitio Astro (TDD)

- [x] 1.1 [SC-env-01/02] Escribir tests fallidos en `apps/web/src/lib/api/__tests__/` para `resolveApiBaseUrl()` (acepta base con y sin `/api/v1`, default `http://localhost:3000/api/v1`). Test Path: `apps/web/src/lib/api/__tests__/*.test.ts` *(Implementado y verificado: `apiBaseUrl.test.ts` con 7 tests de contrato; trabajo originado en sesión de subagente, validado en 16:55 con suite lib/api 34/34 verde.)*
- [x] 1.2 [SC-env-01/02] Implementar `resolveApiBaseUrl()` compartida y usarla en `products.ts`, `categories.ts`, `subcategories.ts`. Suggested Path: `apps/web/src/lib/api/` *(Verificado junto a 1.1.)*
- [x] 1.3 [SC-env-03/04/05] Escribir tests fallidos del fail-fast `REQUIRE_API` (API caída → build error; catálogo vacío → build error; sin `REQUIRE_API` → fallback con warning). Test Path: `apps/web/src/lib/api/__tests__/` *(RED verificado: 6 fallos esperados en `catalogFailFast.test.ts` antes de implementar.)*
- [x] 1.4 [SC-env-03/04/05] Implementar fail-fast en `getPublicProducts()`/espejos usando `REQUIRE_API` y `import.meta.env.PROD`. Suggested Path: `apps/web/src/lib/api/` *(GREEN: helpers `mustFailOnCatalogError`/`assertCatalogSourceAvailable`/`warnCatalogFallback` en `apiBaseUrl.ts`; lib/api 43/43, suite web 902/902.)*
- [ ] 1.5 [SC-env-06] Sincronizar `.env.example`: añadir `SITE_URL`, `REQUIRE_API`, `CATEGORIES_WEBHOOK_URL`; corregir `NESTJS_API_URL=http://localhost:3000/api/v1`; eliminar `LOG_LEVEL`/`LOG_FORMAT`. Suggested Path: `.env.example`

## 2. Dockerfiles frontends

- [x] 2.1 Crear `apps/web/Dockerfile` multi-stage (contexto raíz, build args `SITE_URL`/`NESTJS_API_URL`/`REQUIRE_API`, runtime nginx:alpine + healthcheck). Suggested Path: `apps/web/Dockerfile` *(Incluye stage 0 que compila `@riff/html-sanitize` y installs con `--ignore-scripts`; nginx con gzip, caché immutable `/_astro/` y 404.html.)*
- [x] 2.2 Crear `apps/admin/Dockerfile` multi-stage (contexto raíz, runtime nginx:alpine con SPA fallback + healthcheck). Suggested Path: `apps/admin/Dockerfile`
- [x] 2.3 Verificar builds locales de las tres imágenes (`docker build` backend/web/admin desde la raíz) y smoke de servidor estático con curl. *(Verificado 2026-09-08: 3 imágenes OK; smoke web 200/404 + healthcheck healthy; admin 200 con SPA fallback + healthy; backend: `require('@riff/html-sanitize')` resuelve en runtime y `dist/main.js` presente.)*

## 3. Pipeline Cloud Run (reemplazo de deploy.yml)

- [x] 3.1 Reescribir `.github/workflows/deploy.yml`: job `docker-build` (PR: build sin push de las 3 imágenes). Suggested Path: `.github/workflows/deploy.yml`
- [x] 3.2 Añadir lane backend staging: build/push Artifact Registry `southamerica-west1` (tag `sha-<commit>`) + `gcloud run deploy riff-api-staging` + smoke `/health`, con auth WIF de mínimo privilegio. *(Jobs GCP gated por `vars.GCP_PROJECT` hasta configurar los recursos cloud.)*
- [x] 3.3 Añadir lane producción manual (tag `v*` o `workflow_dispatch`): deploy del digest ya validado a `riff-api-prod` + smoke; sin `latest`. *(Resuelve el digest vía `gcloud artifacts docker images describe` y aplica smoke-gate de staging antes de promover.)*
- [x] 3.4 Trigger opcional de Coolify vía `COOLIFY_WEBHOOK_URL` (no-op si no está definida) y documentar que los frontends se despliegan por Git-integration de Coolify.
- [x] 3.5 Verificar ausencia de lógica legacy (hashFiles raíz, build sin push, `docker pull` VPS, tag `:previous`). *(grep verificado: sin patrones legacy.)*

## 4. Documentación y cierre

- [x] 4.1 Actualizar `docs/deploy-standards.md` si el resultado final difiere de lo documentado (nombres de servicios, tags, triggers).
- [x] 4.2 Revisar consistencia con `docs/project/stack.md` y la especificación `deployment-architecture` del change anterior.
- [x] 4.3 Ejecutar `make ci` y suite de tests web afectada; confirmar verde. *(make ci ✅ 2026-09-08; suite web 902/902.)*
- [ ] 4.4 Ejecutar `/verify` (evidencia ejecutable: tests de `lib/api`) y `/adversarial-review` antes de cerrar.

## Mandatory Steps

### Pre-implementación

- [ ] La **rama activa** sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).
