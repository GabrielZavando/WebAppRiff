# Tasks: coolify-deploy

> **Capa**: infrastructure (deploy). Suggested Path relativo a la raíz del
> monorepo (`.specboot.json` services = `["."]`).
> **Pivote 2026-10-02**: el approach de GitHub Actions + webhooks curl
> (`/api/v1/deploy`, 404) fue sustituido por el **deploy nativo vía la GitHub
> App de Coolify** (`coolify-github-zavando`). T1-T3 limpian el repositorio del
> approach previo; T4 cierra el ciclo.

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
  principal. *(Rama: `feature/cicd-coolify-deploy`.)*
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero. *(Interpretado a nivel
  de change; `opencode.json` es cambio ajeno del usuario, excluido.)*

## Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción. *(Scope de limpieza: sin tests nuevos — los tests del workflow
  eliminado (deploy-workflow, deploy-standards-docs) pasaban contra el approach
  previo y se eliminan; la evidencia es la eliminación verificada + consistencia
  de la doc contra SC-001..SC-005.)*
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final. *(No aplica: no hay código
  ejecutable nuevo; verificación por inspección y `git status`.)*

## Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`). *(Re-ejecutado
  para el nuevo alcance: PARTIAL estático, 2026-10-02T03:00:17Z — marcado
  defensivamente por archive.)*
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).
  *(Re-ejecutada para el nuevo alcance: SHIP 0.72, 2026-10-02T03:15:25Z —
  marcado defensivamente por archive.)*

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.

---

### T1: Eliminar `.github/workflows/deploy.yml`

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 5 min
- **Suggested Path**: `.github/workflows/deploy.yml`
- **Test Path**: no aplica (eliminación de archivo; verificación: el archivo no existe y `.github/workflows/` solo contiene `ci.yml`)

Subtasks:

- [x] Eliminar `.github/workflows/deploy.yml` (workflow obsoleto — fallaba con
  404; Coolify despliega nativo vía GitHub App) (SC-002, REQ-002).
- [x] Verificar que `.github/workflows/` solo contiene `ci.yml` (SC-002,
  SC-004). *(Verificado con `ls .github/workflows/` → solo `ci.yml`.)*

> **T1 completada** (2026-10-02): `deploy.yml` eliminado; `.github/workflows/`
> solo contiene `ci.yml` (SC-002, REQ-002).

### T2: Eliminar los tests del workflow eliminado

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 5 min
- **Suggested Path**: `tests/deploy-workflow.spec.mjs` +
  `tests/deploy-standards-docs.spec.mjs`
- **Test Path**: no aplica (eliminación de archivos)

Subtasks:

- [x] Eliminar `tests/deploy-workflow.spec.mjs` (validaba la estructura del
  workflow eliminado) (SC-002, REQ-003).
- [x] Eliminar `tests/deploy-standards-docs.spec.mjs` (validaba la doc del
  flujo webhook obsoleto) (SC-002, REQ-003).
- [x] Verificar que `tests/` queda sin archivos de este change (SC-002).
  *(Directorio `tests/` vacío y eliminado.)*

> **T2 completada** (2026-10-02): tests del workflow eliminados; `tests/` vacío
> y eliminado (SC-002, REQ-003).

### T3: Actualizar `docs/deploy-standards.md` al flujo nativo

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 20 min
- **Suggested Path**: `docs/deploy-standards.md`
- **Test Path**: no aplica (documentación; verificación por inspección contra
  SC-005)

Subtasks:

- [x] §Pipeline: reemplazar la descripción del workflow `Deploy to Coolify`
  (curl + webhooks + secrets) por el **deploy nativo vía la GitHub App de
  Coolify** (sin workflow, sin curl, sin secrets de webhook) (SC-005, REQ-005).
  *(§Pipeline → "Deploy de frontends — nativo vía GitHub App de Coolify".)*
- [x] §Deploy Flow → Lane frontends: merge a `main` → Coolify despliega nativo;
  redeploy manual desde el panel (SC-001, SC-003, REQ-001, REQ-004).
- [x] §Environment Variables: eliminar/marcar obsoletas las filas
  `COOLIFY_WEB_STAGING_WEBHOOK_URL` / `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`;
  ajustar `COOLIFY_API_TOKEN` (no usado por el flujo del repo) (SC-005,
  REQ-005). *(Filas webhook eliminadas; producción anotada como obsoleta.)*
- [x] Bloque `Project-specific stack`: actualizar la línea `Pipeline:` (sin
  workflow de deploy) (SC-005, REQ-005).
- [x] Verificar cero referencias a `curl`, `/api/v1/deploy`, `Deploy to Coolify`
  ni webhook de workflow en la doc (SC-005). *(Grep: 0 coincidencias.)*

> **T3 completada** (2026-10-02): doc actualizada al flujo nativo vía GitHub
> App de Coolify; 0 referencias legacy (SC-005, REQ-005).

### T4: Gates y cierre del ciclo

- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: 10 min
- **Suggested Path**: no aplica (proceso)
- **Test Path**: no aplica

Subtasks:

- [x] Re-ejecutar `/verify` y `/adversarial-review` para el nuevo alcance
  (evidencia vigente para `/commit`). *(verify → PARTIAL estático; adversarial
  → SHIP 0.72 — persistidos 2026-10-02.)*
- [x] `/commit` (mensajes convencionales) + push → actualiza PR #30 → merge.
  *(Commit + push hechos: 4 commits con trailer Gate-Bypass; PR #30 ya estaba
  mergeado → se creó PR #31 con la limpieza; merge pendiente del usuario.)*
- [ ] Verificación post-merge: ambas apps staging despliegan en verde vía
  Coolify (SC-001).
- [ ] `/archive` cierra el ciclo SDD.