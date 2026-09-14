# Tasks — fix-deploy-pipeline-gates

> Capas: no hay capas de aplicación — es un change de CI/CD (workflows GitHub) +
> docs de deploy. `.specboot.json` declara `services: ["."]`; los archivos son el
> workflow `deploy.yml` y `docs/deploy-standards.md`.

## Task 1 — Reescribir `deploy.yml` a workflow_run gated por CI (RED conceptual)

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: M

- [x] Cambiar el bloque `on:` para que use `workflow_run: { workflows: ['CI'], types: ['completed'] }` con check de `conclusion == 'success'` y el SHA del run disparador (no `github.sha` del push local).
- [x] Mantener `workflow_dispatch` como excepción manual explícita de deploy.
- [x] Eliminar el disparo por `push` a `main` que permitía deploy paralelo a CI (o condicionarlo a que concluya CI). Los PRs no deben activar deploy.
- [x] Sustituir la dependencia `needs: docker-build` de los jobs de deploy por una dependencia equivalente que también exija CI en verde (el trigger `workflow_run` ya lo garantiza; documentarlo).
- [x] (Validación) Confirmar con `actionlint`/parseo YAML que el workflow es válido (`npx actionlint .github/workflows/deploy.yml` si está disponible, o `ruby -e "require 'yaml'; YAML.load_file(...)"`).

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica (validación estática YAML/actionlint)

## Task 2 — Corregir el build de validación de Astro (AC4)

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: S

- [x] En el job `docker-build`, cambiar el step "Build web image" para pasar `--build-arg REQUIRE_API=false`:
  `docker build --build-arg REQUIRE_API=false -f apps/web/Dockerfile -t riff-web:pr .`
- [x] Mantener el build de backend (sin build-arg extra) y el de admin (sin REQUIRE_API — no aplica).
- [x] Verificar que el comando construye ambas imágenes sin intervención de red/API.

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica (validación estática + `docker build` local opcional)

## Task 3 — Reemplazar `trigger-coolify` por jobs por ambiente con Bearer (AC6/AC7)

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: M

- [x] Eliminar el job `trigger-coolify` global con `COOLIFY_WEBHOOK_URL`.
- [x] Crear `deploy-frontends-staging` (solo lane staging): invoca `COOLIFY_WEB_STAGING_WEBHOOK_URL` y `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`, cada uno con `curl --fail --silent --show-error --request GET "$URL" -H "Authorization: Bearer $COOLIFY_API_TOKEN"`, no-op con aviso si el secret está vacío.
- [x] Crear `deploy-frontends-production` (solo lane producción): invoca `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL` y `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL` con el mismo patrón Bearer.
- [x] Asegurar que ningún job loguea el token ni las URLs completas (solo el nombre del destino staging/prod).
- [x] En satging, `deploy-frontends-staging` con `needs: deploy-backend-staging` para garantizar el orden Cloud Run → frontends (AC3).

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica (validación estática)

## Task 4 — Sincronizar `docs/deploy-standards.md` (sección Pipeline)

**Prioridad**: Media · **Capa**: docs · **Estimación**: S

- [x] Actualizar la sección `Pipeline (.github/workflows/deploy.yml)`:
  - Documentar el nuevo gating por `workflow_run` del workflow `CI` (conclusion success, mismo commit) y `workflow_dispatch` como excepción manual.
  - Reemplazar la descripción de `trigger-coolify` por los jobs `deploy-frontends-staging`/`deploy-frontends-production` con autenticación Bearer y los 5 secrets.
  - Nota: los PRs no activan deploy; CI protege PRs (typecheck/build/test/audit/docker).
- [x] Asegurar que `docs/deploy-standards.md` no contradiga el resto (tabla de variables, reglas de secretos).

**Suggested Path**: `docs/deploy-standards.md`
**Test Path**: no aplica

## Task 5 — Verificación del change

**Prioridad**: Alta · **Capa**: transversal · **Estimación**: S

- [x] `npx actionlint` (o parseo YAML) sobre `.github/workflows/deploy.yml` y `ci.yml` sin errores.
- [x] `bash check-refs.sh` → 0 errores.
- [x] `bash specboot.sh --ci` → 0 errores.
- [x] Revisar el diff de `deploy.yml` y `docs/deploy-standards.md` para confirmar que no se loguean secretos ni URLs y que el aislamiento staging/prod está presente.

**Suggested Path**: no aplica (verificación transversal)
**Test Path**: no aplica

## Mandatory Steps

> Checklist obligatoria inyectada desde `docs/openspec-tasks-mandatory-steps.md`
> (fuente única de verdad) en el momento de generación del `tasks.md`.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).