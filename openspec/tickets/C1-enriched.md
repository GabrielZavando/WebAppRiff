# Enriched Ticket — C1

## User Story enriched: C1

**As a** mantenedor del repositorio / líder técnico
**I want** que el gate de CI bloquee errores de tipos, fallos de compilación, cobertura insuficiente del backend y vulnerabilidades altas
**So that** ningún PR con código roto, sin tipar, sin cobertura suficiente o con deuda de seguridad llegue a `main`.

**Capas afectadas**: `fullstack` (tooling CI transversal a los 3 workspaces: backend + web + admin)

### Context

Origen: AUDIT.md H3. El gate actual (`make ci` → `refs solid-lint lint test audit`) no protege el código:

- Sin `typecheck`, sin `build`, sin cobertura ejecutada (`Makefile:192`).
- `npm audit --audit-level=high || true` nunca bloquea (`Makefile:125-127`).
- `lint` de los 3 workspaces usa `--fix` (`apps/web/package.json:14`, `apps/backend/package.json:18`, `apps/admin/package.json:14`), enmascarando errores.
- Cobertura 90/90/90/90 declarada (`apps/backend/jest.config.js:18-25`) pero jamás evaluada (test sin `--coverage`).

**Restricciones de diseño (confirmadas con el usuario):**

- El `Makefile` es intocable (framework). El gate se implementa en el job `project-ci` de `ci.yml` (project-owned, se reconcilia tras `specboot update`).
- **Cobertura bloqueante solo en backend** (jest 90 %, ya configurado). Web/admin sin cobertura en este ticket.
- **Mantener `node: '24'`** en el job (la alineación a 22 es V1/H6, aparte).
- **Corregir toda deuda latente** que el gate duro descubra en este mismo change, actualizando primero los artefactos OpenSpec (regla 4 de AGENTS).

### Diseño de Clases/Componentes

- `ci.yml` → job `project-ci`: ejecuta el gate duro secuencial, **reemplazando** el único paso `make ci` por pasos explícitos. Depende de los scripts npm de los workspaces; NO de comandos duplicados. Capa: tooling/CI.
- `package.json` raíz: añade script `typecheck` = `npm run typecheck --workspaces --if-present`. (`build` y `test` raíz ya existen.)
- `apps/backend/package.json`: `lint` sin `--fix`; añade `lint:fix`. `test:cov` ya existe (jest `--coverage`, umbrales 90).
- `apps/web/package.json` y `apps/admin/package.json`: `lint` sin `--fix`; añaden `lint:fix`.
- **No se toca**: Makefile, jest.config.js, job `validate` de ci.yml (framework self-check).

**Secuencia propuesta de pasos en `project-ci`:**

1. `bash check-refs.sh`
2. `make solid-lint`
3. `npm run lint --workspaces`
4. `npm run typecheck --workspaces --if-present`
5. `npm run build --workspaces`
6. `npm run test:cov --workspace=apps/backend` (bloqueante 90 %)
7. `npm run test --workspace=apps/web` ; `npm run test --workspace=apps/admin`
8. `npm audit --audit-level=high` (bloqueante, sin `|| true`)

> Esto evita doble corrida de tests backend (no se llama `make ci`, que corría `npm test` plano + test:cov).

### Acceptance Criteria

### SC-101: Typecheck bloqueante en todos los workspaces
- Given que `project-ci` ejecuta `npm run typecheck --workspaces --if-present`
- When un workspace tiene error de tipos
- Then falla el pipeline y el PR queda bloqueado

### SC-102: Build bloqueante en todos los workspaces
- Given que `project-ci` ejecuta `npm run build --workspaces`
- When un workspace no compila (nest build / astro build / ng build)
- Then el pipeline falla

### SC-103: Cobertura backend ≥ 90 % bloqueante
- Given `npm run test:cov --workspace=apps/backend`
- When statements/branches/functions/lines < 90 %
- Then el pipeline falla (umbrales de jest.config.js se evalúan ahora sí)

### SC-104: npm audit bloqueante (sin `|| true`)
- Given un paso `npm audit --audit-level=high` sin supresión de errores
- When hay vulnerabilidad high/critical
- Then el pipeline falla

### SC-105: lint no muta código en CI
- Given que los `lint` de los 3 workspaces ya no incluyen `--fix`
- When `project-ci` ejecuta `npm run lint --workspaces`
- Then reporta errores sin auto-corregir (`--fix` solo en `lint:fix` local)

### SC-106: Gate duro sin editar el Makefile
- Given que el Makefile no se modifica
- When el job se endurece
- Then refs/solid-lint siguen corriendo (vía `bash check-refs.sh` / `make solid-lint`) y `make ci` local permanece funcional e intacto

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| `astro build` en CI sin API viva | Pasa: sin `REQUIRE_API` web conserva fallback (H2 aparte); el gate valida compilación, no catálogo |
| Workspace sin script `typecheck` | `--if-present` lo salta (hoy los 3 lo tienen; protege futuros workspaces) |
| Audit solo con vulns moderate/low | Pasa (umbral `--audit-level=high`) |
| Cobertura web/admin | No se evalúa en C1 (decisión confirmada: solo backend) |
| `specboot update` sobrescribe `ci.yml` | Se restaura el ci.yml endurecido desde el backup (ritual documentado en specboot-framework-sync) |
| Error en un solo workspace | Falla señalando ese workspace |
| Deuda latente en algún workspace al endurecer | Se corrige en este change (confirmado), actualizando OpenSpec primero |

### Estimación

Complejidad: **M** (1–3 días)
Justificación: toca `ci.yml` + 4 `package.json` + corrección de posible deuda latente. Sin lógica de negocio; el riesgo es el orden y evitar dobles corridas.

### Riesgo

Nivel: **Medio**
Motivo: endurecer el gate puede romper el CI verde actual si hay deuda latente (tipos/build/cobertura). Se mitiga corriendo el gate localmente y corrigiendo lo que aflore antes de mergear.

### Dependencias

Tickets relacionados: **H6/V1** (alinear `@types/node`, TS, vitest — afecta typecheck/build), **P3/Q1** (ESLint 9). Ninguna bloqueante estricta; se usa `node: '24'` y no se adelanta V1 (decisión confirmada).

### Alternativas descartadas

- Modificar `make ci`: descartado por ser el Makefile intocable (rompería check-refs/specboot --ci).
- Cobertura en web/admin (vitest): descartado — requiere `@vitest/coverage-v8` + umbrales nuevos; scope creep fuera de C1.
- Job `project-ci` llamando `make ci` + pasos extra: descartado — doble corrida de tests backend.

### Technical Considerations

- Reemplazar el único paso `make ci` por la secuencia explícita de 8 pasos (evita doble jest).
- `npm audit` bloqueante a nivel raíz (package.json es `private`, no afecta al audit).
- Scripts `typecheck`/`test:cov` ya existen en cada workspace; no se crean.
- Correr el gate completo localmente antes de mergear.
- Actualizar artefactos OpenSpec (new change `harden-ci-gate`) antes de tocar código si aflora deuda latente.
- Verificar `bash check-refs.sh` y `bash specboot.sh --ci` con 0 errores tras el cambio.

### Definition of Done

- [ ] Script raíz `typecheck` añadido (`--workspaces --if-present`)
- [ ] `lint` de backend/web/admin sin `--fix`; `lint:fix` añadido
- [ ] Job `project-ci` ejecuta la secuencia dura (refs, solid-lint, lint, typecheck, build, test:cov backend 90 %, test web+admin, audit bloqueante)
- [ ] `npm audit --audit-level=high` bloquea (sin `|| true`)
- [ ] Cobertura backend ≥ 90 % evaluada y bloqueante
- [ ] `bash check-refs.sh` y `bash specboot.sh --ci` pasan con 0 errores
- [ ] `make ci` local sigue funcionando (intocable, sin cambios)
- [ ] OpenSpec: change `harden-ci-gate`, tasks.md, verify PASS
- [ ] `docs/deploy-standards.md` / `stack.md` reflejan el gate duro si aplica

### Questions for Clarification

Resueltas con el usuario:

1. Cobertura solo backend ✔
2. Endurecer solo `project-ci` reemplazando `make ci` ✔
3. Mantener Node 24 ✔
4. Corregir deuda latente en este change ✔