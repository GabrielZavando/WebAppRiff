# Tasks: add-git-workflow-standards

> **Capa**: docs (documentación del proyecto). Suggested Path relativo a la raíz
> del monorepo (`.specboot.json` services = `["."]`).
> Change documental: sin código ejecutable ni tests; la verificación es por
> inspección contra los escenarios SC-001..SC-008 y grep de las referencias
> (precedente: `coolify-deploy`).

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
  principal. *(Rama: `feature/add-git-workflow-standards`, creada en Step 1½
  desde `main` actualizado.)*
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero. *(Interpretado a nivel
  de change: primera corrida tolera los artefactos del plan
  (`openspec/changes/add-git-workflow-standards/**`); `opencode.json` resuelto
  por el usuario y `openspec/tickets/DOCS-001-enriched.md` committeado.)*

## Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción. *(No aplica: change documental sin código ejecutable — la
  verificación es por inspección contra SC-001..SC-008 y grep de las 4
  referencias; precedente `coolify-deploy`.)*
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final. *(No aplica: no hay código
  ejecutable nuevo; verificación por inspección.)*

## Post-implementación

Antes de dar la tarea por cerrada:

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.

---

### T1: Crear `docs/git-workflow-standards.md` — §1 flujo de ramas + §2 naming

- **Priority**: high
- **Layer**: docs
- **Estimate**: 15 min
- **Suggested Path**: `docs/git-workflow-standards.md`
- **Test Path**: no aplica (documentación; verificación por inspección contra SC-001, SC-002, SC-008)

Subtasks:

- [x] Crear el archivo con §1 **Flujo estándar de ramas**: `feature/{name}`
  desde `main` → PR → merge a `main`; acumulación de historia (merge de `main`
  en la rama); la rama del ticket la crea `/plan-change` (Step 1½) sobre árbol
  git limpio (SC-001, REQ-001). *(§1 creado con los 4 pasos del flujo y ejemplo
  real del repo.)*
- [x] §2 **Convención de naming de ramas**: patrón
  `{type}/{short-name-kebab-case}` sin ticket ID; tipos `feature/`, `fix/`,
  `chore/`, `docs/`, `test/`, `refactor/`; el doc es la fuente de verdad
  (SC-002, REQ-002). *(§2 con tabla de tipos y reglas.)*
- [x] Incluir nota dogfooding: la rama de este change
  (`feature/add-git-workflow-standards`) cumple el patrón documentado
  (SC-008, REQ-002). *(Ramas reales del repo listadas como evidencia.)*

> **T1 completada** (2026-10-02): `docs/git-workflow-standards.md` creado con
> §1 flujo de ramas + §2 naming (SC-001, SC-002, SC-008).

### T2: §3 proceso de commit + §4 proceso de PR

- **Priority**: high
- **Layer**: docs
- **Estimate**: 15 min
- **Suggested Path**: `docs/git-workflow-standards.md`
- **Test Path**: no aplica (documentación; verificación por inspección contra SC-003, SC-004)

Subtasks:

- [x] §3 **Proceso de commit**: Conventional Commits en inglés (`feat:`,
  `fix:`, `docs:`, `refactor:`, `test:`, `chore:`); 1 commit = 1 cambio lógico;
  gates duros (verify `PASS` + adversarial `SHIP`) previos al commit; ownership
  de `git commit`/`git push` exclusivo de `/commit` (SC-003, REQ-003). *(§3
  creado con gates M-901 y ownership.)*
- [x] §4 **Proceso de PR**: pre-check
  `git merge-base --is-ancestor origin/main HEAD` (avisar si la rama está
  desactualizada); título conventional + cuerpo referenciando el change; merge
  a `main` — push directo a `main` prohibido (SC-004, REQ-004). *(§4 creado con
  los 5 pasos.)*

> **T2 completada** (2026-10-02): §3 commit + §4 PR añadidos (SC-003, SC-004).

### T3: §5 integración con Coolify

- **Priority**: high
- **Layer**: docs
- **Estimate**: 10 min
- **Suggested Path**: `docs/git-workflow-standards.md`
- **Test Path**: no aplica (documentación; verificación por inspección contra SC-005, SC-008)

Subtasks:

- [x] §5 **Integración con Coolify**: merge a `main` → deploy automático nativo
  vía GitHub App `coolify-github-zavando` (staging `riff-web-staging`/
  `riff-admin-staging`, build in-situ `web`/`admin`); redeploy manual (panel de
  Coolify o push a `main`) (SC-005, REQ-005). *(§5 creado.)*
- [x] Dejar explícito que la lane backend (Cloud Run) está pendiente de
  workflow propio, sin inventar pasos (SC-005, REQ-005). *(Lane backend
  documentada como pendiente.)*
- [x] Verificar consistencia con `docs/deploy-standards.md` §"Deploy de
  frontends — nativo vía GitHub App de Coolify": sin referencias a webhooks
  obsoletos ni a un workflow de deploy (SC-008, REQ-005). *(Verificado: grep 0
  coincidencias de `webhook`/`deploy.yml`/`COOLIFY_API_TOKEN`/`/api/v1/deploy`
  en el doc nuevo.)*

> **T3 completada** (2026-10-02): §5 Coolify añadido (SC-005, SC-008); grep de
> consistencia verificado (0 coincidencias legacy).

### T4: Verificación de referencias, integridad y gates de cierre

- **Priority**: high
- **Layer**: docs
- **Estimate**: 15 min
- **Suggested Path**: no aplica (proceso + herramientas del puente)
- **Test Path**: no aplica

Subtasks:

- [x] Verificar que las 4 referencias existentes resuelven:
  `ai-specs/skills/plan-change/SKILL.md`, `ai-specs/agents/plan-agent.md`,
  `.opencode/commands/apply.md`, `docs/framework-contract.md` (SC-006, REQ-006).
  *(Verificado: el archivo existe y check-refs.sh pasa.)*
- [x] `bash check-refs.sh` → 0 errores (SC-007, REQ-007). *(2026-10-02: 20
  referencias, 0 errores.)*
- [x] `bash specboot.sh --ci` → 0 errores (SC-007, REQ-007). *(2026-10-02:
  Errores 0, Warnings 0, validación exitosa.)*
- [ ] Ejecutar `/verify` y `/adversarial-review` (evidencia vigente para
  `/commit`). *(No ejecutable por `build` — fail-closed; correr los comandos
  `/verify DOCS-001` y `/adversarial-review` tras `/apply`.)*
- [ ] `/commit` (mensajes convencionales) + push + PR → merge a `main`.
- [ ] `/archive` cierra el ciclo SDD.
