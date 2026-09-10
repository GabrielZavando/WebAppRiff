## Context

AUDIT.md H3 (2026-09-08): el gate de CI no protege el código. Estado real del repo:

- `Makefile:192` → `ci: refs solid-lint lint test audit` — sin `typecheck`, sin `build`, sin cobertura.
- `Makefile:125-127` → `npm audit --audit-level=high || true` — el `|| true` hace que el audit **jamás** falle el pipeline.
- Scripts `lint` con `--fix`: `apps/backend/package.json:18`, `apps/web/package.json:14`, `apps/admin/package.json:14` — corrigen y continúan, enmascarando errores.
- `apps/backend/jest.config.js:18-25`: umbrales 90/90/90/90 declarados pero **nunca evaluados** porque los tests corren sin `--coverage`.
- `ci.yml:43-55`: el job `project-ci` solo ejecuta `make ci`.
- Ya existen scripts `typecheck` por workspace: backend `tsc --noEmit` (`apps/backend/package.json:24`), web `astro check && tsc --noEmit` (`apps/web/package.json:18`), admin `ng build --configuration development` (`apps/admin/package.json:15`).

**Restricción no negociable**: el `Makefile` es un archivo intocable del framework (encabezado `Makefile:1-10`, AGENTS.md). No se puede editar. El gate duro debe vivir en artefactos project-owned: el job `project-ci` de `ci.yml` y los scripts de los `package.json`.

**Decisiones confirmadas con el cliente (C1-enriched)**:
1. Cobertura bloqueante **solo en backend** (jest 90 %, ya configurado). Web/admin sin cobertura en este change.
2. Endurecer **solo el job `project-ci`**, reemplazando el paso único `make ci` por la secuencia explícita (evita doble corrida de tests backend).
3. Mantener `node: '24'` en el job (la alineación a 22 es V1/H6, aparte).
4. Corregir cualquier deuda latente que aflore al endurecer, en este mismo change, actualizando primero los artefactos OpenSpec (regla 4 de AGENTS).

## Goals / Non-Goals

**Goals:**

- `project-ci` ejecute una secuencia dura bloqueante: refs, solid-lint, lint (no mutante), typecheck, build, test (backend con cobertura 90 % + web/admin/html-sanitize), audit reportado no bloqueante.
- `npm audit --audit-level=high` se ejecute y reporte en CI de forma **no bloqueante** (remediación de high/critical diferida a V1/Q2; ver Decisions 1).
- Cobertura backend ≥ 90 % evaluada y bloqueante (los umbrales de `jest.config.js` se ejecutan ahora sí).
- `lint` no mute el código en CI (el `--fix` queda en un `lint:fix` local).

**Non-Goals:**

- No se alinea a Node 22 (V1/H6) ni se migra ESLint 9 (Q1) — fuera de alcance.
- No se añade cobertura bloqueante a web/admin (vitest) — requiere `@vitest/coverage-v8` + umbrales nuevos; es deuda diferida de otro ticket.
- No se modifica el `Makefile` (intocable) ni el job `validate` de `ci.yml` (framework self-check).
- No se cambia contrato REST, modelo de datos ni autenticación.

## Decisions

### 1. Job `project-ci` endurecido con secuencia explícita

En lugar de una llamada única a `make ci`, el job ejecuta pasos discretos. Esto da un gate duro sin tocar el Makefile y sin doble corrida de tests del backend (solo `test:cov`, no `make test` que corría jest plano + cobertura por separado):

```
bash check-refs.sh
make solid-lint
npm run lint --workspaces
npm run typecheck --workspaces --if-present
npm run build --workspaces
npm run test:cov --workspace=apps/backend
npm run test --workspace=apps/web
npm run test --workspace=apps/admin
npm run test --workspace=packages/html-sanitize
npm audit --audit-level=high
```

- **Typecheck**: nuevo script raíz `npm run typecheck --workspaces --if-present` — orquesta los tres `typecheck` existentes sin fallar si un futuro workspace no lo declara.
- **Cobertura**: `npm run test:cov --workspace=apps/backend` activa los umbrales 90/90/90/90 de `jest.config.js`. Web/admin y html-sanitize corren su `test` standalone (vitest) sin cobertura.
- **Tests del paquete compartido**: `npm run test --workspace=packages/html-sanitize` mantiene en el gate la suite de la frontera de sanitización XSS compartida (backend write-path + frontend render-path), que el gate anterior (`npm test --workspaces`) ya ejecutaba — evita regresión de cobertura de la pieza más sensible.
- **Audit**: `npm audit --audit-level=high` se ejecuta en el pipeline como **paso no bloqueante** (su fallo no rompe el job) para visibilizar el estado de seguridad en el log sin dejar `main` en rojo permanente. El repo arrastra 52 vulns high/critical preexistentes (p. ej. `astro <=7.2.7`, `vitest <=4.1.10`, `tar`) cuya remediación requiere upgrades de major (astro 7.2+, Angular, NestJS 11, vitest 4) que son scope de los tickets V1/H6/Q1/Q2. Hacer el audit bloqueante en C1 rompería CI sin plan de remediación en el mismo change (decisión confirmada con el cliente).
- **Lint no mutante**: al quitar `--fix` de los scripts `lint`, `npm run lint --workspaces` reporta errores sin modificar archivos.

### 2. Divisón `lint` / `lint:fix` en los workspaces

Cada `apps/*/package.json` y `packages/html-sanitize/package.json` pasa de `lint: eslint ... --fix` a `lint: eslint ...` (sin `--fix`) más un nuevo script `lint:fix` que sí lo incluye. Así CI reporta sin mutar y el desarrollador puede auto-corregir de forma explícita y local.

### 3. `make ci` permanece intacto

No se edita. Sigue disponible para uso local como gate ligero (`refs solid-lint lint test audit`). El gate "duro" de producción es `project-ci`. `make ci` puede quedar más laxo que `project-ci` por diseño (local), mientras el CI real es el que protege `main`.

## Risks / Trade-offs

- **[El gate duro puede romper el CI verde actual]** → deuda latente preexistente (tipos, build, cobertura < 90 % en algún workspace) que hoy pasa por ser gate blando. Mitigación: correr el gate completo localmente y corregir lo que aflore en este mismo change antes de mergear.
- **[`astro build` en CI sin API viva]** → el job de CI no despliega web; `astro build` valida compilación. Sin `REQUIRE_API` web conserva el fallback (H2 es un change aparte ya deployado). No es bloqueante aquí.
- **[Workflow `project-ci` sobrescrito por `specboot update`]** → el ritual post-update ya documenta restaurar el `ci.yml` endurecido desde el backup (`specboot-framework-sync`); no requiere scaffolding adicional.
- **[Doble corrida evitada]** → al no llamar `make ci`, `project-ci` no ejecuta `npm test` del backend por duplicado (solo `test:cov`); web/admin corren su test una vez.

## Migration Plan

1. Crear el change `harden-ci-gate` (regulation artifacts del esquema spec-driven).
2. Correr el gate completo localmente para descubrir deuda latente antes de tocar CI.
3. Quitar `--fix` y añadir `lint:fix` en los 3 workspaces; añadir script raíz `typecheck`.
4. Endurecer el job `project-ci` de `ci.yml` con la secuencia del Decision 1.
5. Corregir deuda latente descubierta (regla 4 de AGENTS: actualizar OpenSpec primero), si aparece.
6. Verificar `bash check-refs.sh` y `bash specboot.sh --ci` con 0 errores; `make ci` local sigue verde; `/verify` + `/adversarial-review`.

**Rollback** (change de CI): restaurar `ci.yml` desde git es el revert natural; el gate duro es reversible con un solo commit de reversión.

## Open Questions

- ¿Alguna vulnerabilidad high detectada por `npm audit` al activar el bloqueo requiere remediación inmediata en este change? — se resolverá al correr el gate localmente (Task 4).
- ¿Se quiere que el gate exija `build` completo de web o solo `astro check && tsc` (typecheck) para no acoplar CI al SSG del catálogo? — default: build completo, verificando que la deuda latente de astro build se resuelve local.