# Tasks: coolify-deploy

> **Capa**: infrastructure (CI/CD GitHub Actions). Suggested Path relativo a la
> raíz del monorepo (`.specboot.json` services = `["."]`, sin mapa de layers →
> nomenclatura por defecto). Sin artefacto enriquecido: no hay Diseño de
> Clases/Componentes que mapear.

## Mandatory Steps

> **Rol de este documento**: es la **fuente única de verdad** del checklist
> obligatorio de implementación del ciclo SDD. El skill `plan-change` **inyecta
> su contenido** como sección `## Mandatory Steps` en todo `tasks.md` generado,
> leyéndolo en el momento de generación, de modo que la checklist viaja dentro
> del artefacto que el agente `build` ejecuta. Editar aquí actualiza todo
> `tasks.md` generado después; no duplicar esta lista dentro de skills ni
> agentes.

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de
implementación ejecutada vía `/apply`, tanto en el propio framework Specboot
(dogfooding) como en cualquier proyecto consumidor.

## Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero. *(Interpretado a nivel
  de change: primera ejecución de `/apply` tolera los artefactos de
  `openspec/changes/coolify-deploy/**` — pre-flight superado y persistido en
  `openspec/state/apply-preflight-coolify-deploy.json`.)*

## Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción. *(T1: 6/6 RED contra el workflow SSH.)*
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final. *(T1: suite del workflow
  ejecutada en cada iteración — RED y GREEN.)*

## Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`). *(PASS — corrida
  del agente verify: 14/14 tests vitest, evidencia ejecutable.)*
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).
  *(SHIP — 0 critical, 2 warnings corregidos en T6, 4 info aceptados.)*

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.

> Nota para este change (CI/CD declarativo): T1 y T2 tienen tests ejecutables
> reales (`tests/deploy-workflow.spec.mjs` y
> `tests/deploy-standards-docs.spec.mjs`, vitest-native con IDs `[SC-NNN]` en
> los nombres) que hicieron RED contra el workflow SSH y la doc legacy
> respectivamente (corridas históricas con node:test; migrados a vitest en T5
> para que el agente verify pueda ejecutarlos con `npx vitest run`).

---

### T1: Reemplazar `.github/workflows/deploy.yml` con trigger de webhooks Coolify

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 30 min
- **Suggested Path**: `.github/workflows/deploy.yml`
- **Test Path**: `tests/deploy-workflow.spec.mjs` (test de estructura del
  workflow con IDs `[SC-NNN]`, corrido con `npx vitest run tests/` — migrado a
  vitest-native, ver T5)

Subtasks:

- [x] Escribir test RED de estructura (`tests/deploy-workflow.spec.mjs`) con
  IDs `[SC-001]`..`[SC-006]` y verificar que falla contra el workflow SSH
  actual antes de reemplazarlo. *(RED verificado: 6/6 fallos contra el workflow
  SSH.)*
- [x] Definir triggers: `push` con `branches: [main]` + `workflow_dispatch`
  (SC-001, SC-003, SC-004); sin trigger de tags.
- [x] Mantener `permissions: contents: read`; sin paso `checkout` (el workflow
  solo invoca webhooks, no compila nada).
- [x] Job único `deploy-staging` con dos pasos: `Trigger riff-web-staging
  deploy` y `Trigger riff-admin-staging deploy` (SC-002).
- [x] Cada paso pasa el secret por `env:` (ej. `WEBHOOK_URL: ${{
  secrets.COOLIFY_WEB_STAGING_WEBHOOK_URL }}` / resp.
  `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`) y aplica guard
  `if [ -z "$WEBHOOK_URL" ]` → `::warning::` + `exit 0` (SC-005, REQ-005).
- [x] Invocación: `curl --fail --silent --show-error "$WEBHOOK_URL"` — GET por
  defecto; el webhook uuid de Coolify es pre-autenticado (SC-002, SC-006,
  REQ-002).
- [x] Eliminar los jobs legacy SSH/docker (`deploy-staging` actual,
  `deploy-production`, `rollback`): sin `DEPLOY_ENABLED`, sin
  `appleboy/ssh-action`, sin `docker build` (REQ-004).
- [x] Validar sintaxis YAML — aserción de parseo real añadida a la suite
  (`yaml@2.9.0`, `parse(workflow)` falla con sintaxis inválida); `python3`/
  `actionlint` no disponibles en el entorno (motor de permisos). *(Suite:
  7/7 PASS con `node --test`.)*

> **T1 completada** (2026-10-01): RED 6/6 → GREEN 7/7 (`node --test
> tests/deploy-workflow.spec.mjs`). Sin cambios en api-spec/data-model (no
> aplican).

### T2: Documentar el flujo en `docs/deploy-standards.md`

- **Priority**: medium
- **Layer**: infrastructure
- **Estimate**: 20 min
- **Suggested Path**: `docs/deploy-standards.md`
- **Test Path**: `tests/deploy-standards-docs.spec.mjs` (test de consistencia
  documental con IDs `[SC-NNN]`, corrido con `npx vitest run tests/` — migrado
  a vitest-native, ver T5)

Subtasks:

- [x] Escribir test RED de consistencia documental
  (`tests/deploy-standards-docs.spec.mjs`) con IDs `[SC-NNN]` y verificar que
  falla contra la doc actual antes de editarla. *(RED verificado: 5/6 fallos;
  la aserción `no DEPLOY_ENABLED` pasaba ya — doc limpia.)*
- [x] §Pipeline: reescribir para describir el workflow real (push a `main` +
  `workflow_dispatch` + curl GET a webhooks Coolify; eliminar la descripción
  legacy de `workflow_run`/`docker-build`/SSH) (REQ-006).
- [x] §Deploy Flow → Lane frontends: pasos 1-2 reflejan merge a `main` →
  webhook Coolify → build in-situ por app (REQ-006).
- [x] §Environment Variables: marcar `COOLIFY_WEB_STAGING_WEBHOOK_URL` /
  `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` como GitHub secrets requeridos por el
  workflow; sin referencias a `DEPLOY_ENABLED` (REQ-006). *(Filas añadidas a la
  tabla staging junto a `COOLIFY_API_TOKEN`.)*
- [x] Nota de rollback: el rollback de frontends sigue siendo redeploy manual
  en el panel Coolify (sección Rollback existente, sin cambios estructurales).
  *(Referenciada desde §Pipeline; sin edición estructural.)*
- [x] Bloque `Project-specific stack`: actualizar las líneas
  `Pipeline:`/`Registry backend:` para reflejar el workflow real (sin
  `docker-build`, tags ni gating `GCP_PROJECT`) — desviación declarada: línea
  contradictoria detectada, cubierta por REQ-006 y la consistencia
  doc/implementación de `deployment-architecture`.

> **T2 completada** (2026-10-01): RED 5/6 → GREEN 6/6
> (`node --test tests/deploy-standards-docs.spec.mjs`); regresión T1: 7/7 PASS
> (`node --test tests/deploy-workflow.spec.mjs`).

### T3: Configurar GitHub secrets de webhooks (ops, una vez)

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 10 min
- **Suggested Path**: no aplica (operación en GitHub — UI Actions o
  `gh secret set`)
- **Test Path**: no aplica

Subtasks:

- [x] Crear secret `COOLIFY_WEB_STAGING_WEBHOOK_URL` con la URL del webhook de
  riff-web-staging (provista en el ticket `cicd-coolify-deploy`). *(Creado
  2026-10-01, verificado con `gh secret list`.)*
- [x] Crear secret `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` con la URL del webhook
  de riff-admin-staging (provista en el ticket). *(Creado 2026-10-01, verificado
  con `gh secret list`.)*
- [ ] ~~Verificar la señal de los webhooks vía `curl` GET directo desde local~~
  *(obsoleto con la opción A: la señal exige `Authorization: Bearer` — 401
  `Unauthenticated.` sin auth; la verificación end-to-end se cierra post-merge
  vía dispatch, ver T4)*.
- [ ] Verificar vía `workflow_dispatch` manual (post-merge) que ambos deploys se
  disparan (SC-003) y terminan en verde en Coolify — requiere push de la rama +
  PR + merge a `main` primero (`git push` denegado para build; el dispatch
  ejecuta el workflow del ref remoto, aún el legacy saltado por
  `DEPLOY_ENABLED` hasta fusionar).

> **T3 parcialmente completada** (2026-10-01): secrets creados y verificados ✓;
> la verificación de señal vía curl GET falló con 401 (TDD Failure Report,
> attempt 2) → opción A adoptada; la verificación end-to-end (dispatch +
> verde en Coolify) se cierra post-merge.

### T4: Autenticación Bearer en la invocación de webhooks (fix 401)

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 20 min
- **Suggested Path**: `.github/workflows/deploy.yml` + `docs/deploy-standards.md`
- **Test Path**: `tests/deploy-workflow.spec.mjs` +
  `tests/deploy-standards-docs.spec.mjs`

Subtasks:

- [x] Actualizar tests del workflow (RED): SC-002 y el test de parseo esperan
  `--request POST` + `Authorization: Bearer $COOLIFY_API_TOKEN`; verificar que
  fallan contra el workflow actual (GET sin auth). *(RED: 3/14 fallos — SC-002
  y parseo; el resto pasaba.)*
- [x] Workflow: añadir `COOLIFY_API_TOKEN: ${{ secrets.COOLIFY_API_TOKEN }}` al
  `env:` de cada paso y cambiar la invocación a
  `curl --fail --silent --show-error --request POST "$WEBHOOK_URL" -H
  "Authorization: Bearer $COOLIFY_API_TOKEN"` (SC-002; el trigger de la API de
  Coolify es POST con uuid/force en query).
- [x] Actualizar test documental (RED): el §Pipeline debe describir la
  invocación Bearer (sustituir la aserción `doesNotMatch Bearer` por `match`);
  verificar que falla contra la doc actual. *(RED: la doc aún no describía
  Bearer.)*
- [x] Docs §Pipeline: actualizar la descripción de la invocación (POST + Bearer
  con `COOLIFY_API_TOKEN` — token de API, no SSH). *(También las filas
  `COOLIFY_*_STAGING_WEBHOOK_URL` de env vars.)*
- [x] Regresión completa: ambas suites en verde (workflow + docs). *(14/14
  PASS: 8 workflow + 6 docs.)*
- [ ] Verificación de señal end-to-end: requiere el valor de
  `COOLIFY_API_TOKEN` (secret de GitHub, no legible por build) o el dispatch
  post-merge (T3) — se cierra post-merge.

> **T4 completada** (2026-10-01): implementación RED→GREEN (3/14 → 14/14 PASS
> en `node --test`). La verificación de señal end-to-end queda post-merge
> (dispatch con el secret inyectado por GitHub — T3).

### T5: Migrar tests a vitest-native (habilitar evidencia ejecutable de verify)

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 15 min
- **Suggested Path**: `tests/deploy-workflow.spec.mjs` +
  `tests/deploy-standards-docs.spec.mjs`
- **Test Path**: `tests/deploy-workflow.spec.mjs` +
  `tests/deploy-standards-docs.spec.mjs`

Subtasks:

- [x] Reescribir ambos suites como vitest-native (`describe`/`it`/`expect`,
  runner canónico del proyecto `vitest@^4.1.10`), manteniendo los IDs
  `[SC-NNN]` en los nombres (`it`) para el mapeo de /verify. *(Estructura:
  `describe` por archivo + `it` por escenario/aserción-grupo.)*
- [x] Ejecutar `npx vitest run tests/` y confirmar GREEN (14 tests). *(14/14
  PASS, 2 archivos.)*

> **Origen**: el agente verify solo puede ejecutar `npx vitest` (su bash no
> permite `node *`) y vitest no recolecta archivos node:test — /verify cayó a
> fallback estático (PARTIAL). Los tests se reescriben con el runner canónico
> del proyecto para habilitar la evidencia ejecutable.

> **T5 completada** (2026-10-01): tests vitest-native (`describe`/`it`/`expect`,
> IDs `[SC-NNN]` en los `it`); `npx vitest run tests/` → **14/14 GREEN**. El
> agente verify puede ahora ejecutarlos con su runner permitido.

### T6: Fijar hallazgos adversarial (WARNINGs)

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 20 min
- **Suggested Path**: `.github/workflows/deploy.yml` + `docs/deploy-standards.md`
- **Test Path**: `tests/deploy-workflow.spec.mjs` + `tests/deploy-standards-docs.spec.mjs`

Subtasks:

- [x] Añadir `--max-time 60` al `curl` de cada paso (robustez: evitar step
  bloqueado hasta el default de 6h de GitHub Actions si Coolify se cuelga) —
  hallazgo WARNING del adversarial-review.
- [x] Alinear guard de degradación con la doc: omitir el paso si falta
  `WEBHOOK_URL` **o** `COOLIFY_API_TOKEN` (la doc promete "si un secret no está
  configurado, el paso se omite").
- [x] Corregir las 2 menciones legacy "curl GET" en `docs/deploy-standards.md`
  (Lane frontends y Project-specific stack) → POST + Bearer (hallazgo WARNING).
- [x] Actualizar tests (RED) con los nuevos patrones (`--max-time`, guard con
  token) y confirmar GREEN (14/14). *(RED: 3/7 fallos en los tests actualizados;
  GREEN: 14/14 PASS.)*

> **T6 completada** (2026-10-01): WARNINGs del adversarial-review corregidos
> (`--max-time 60`, guard con token, docs GET→POST) — 14/14 PASS.

> **Origen**: veredicto SHIP del adversarial-review (2026-10-01) con 2 WARNINGs
> a corregir antes de /commit.
> **INFO aceptados sin implementar**: (1) `concurrency group` — Coolify
> serializa internamente, un group no aporta; (2) `opencode.json` — configuración
> del usuario, fuera del change; (3) `npm audit` 30 vulns preexistentes — ticket
> separado de saneamiento (astro 7.3.5 es fix directo no-breaking).

> **Origen**: la verificación de T3 descubrió 401
> `{"message":"Unauthenticated."}` (TDD Failure Report, attempt 2) — las URLs
> del ticket son endpoints de API que exigen Bearer. Decisión del usuario:
> **opción A** (Bearer + POST), coincidente con el diseño original documentado
> en deploy-standards.md.
