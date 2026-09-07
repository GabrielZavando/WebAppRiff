# Design: fix-preexisting-lint-test-failures

## Context

El framework Specboot, tras su adopción (`update-specboot-framework`), usa un `Makefile` parametrizado por `services` (root `services: ["."]`) que itera **todos los workspaces** para `lint` y `test`. Esto expone fallos preexistentes del monorepo Riff que el Makefile anterior (que solo corría el root) ocultaba:

- **Lint**: backend (1 error de complejidad), web (2 errores de vars sin usar + 7 warnings), admin (`ng lint --fix` roto), html-sanitize (sin script `lint`).
- **Test**: admin (`ng test` apunta a Karma no configurado); y, una vez corregido el runner, `sync.test.ts` revela un desync de design tokens (`--shadow-scroll-shell` falta en admin).

Stack: monorepo npm workspaces — `apps/backend` (NestJS, `eslint "src/**/*.ts"`), `apps/web` (Astro, `eslint ... src/**/*.{ts,astro}`), `apps/admin` (Angular 18 standalone, actualmente con scripts `ng lint`/`ng test` muertos), `packages/html-sanitize` (compartido, sin lint).

## Goals / Non-Goals

**Goals**
- `make lint` y `make test` quedan **verdes** para los 4 workspaces.
- Admin pasa a usar ESLint y Vitest crudos, consistentes con backend/web.
- Restaurar la paridad de design tokens web↔admin (regla del test de sincronización).
- No tocar el umbral `complexity: 10` (es parte de los estándares SOLID del proyecto).

**Non-Goals**
- No refactorizar la lógica de negocio de `runMigration` en profundidad (solo reducir complejidad ciclomática al umbral).
- No migrar a `@angular-eslint` / ESLint flat config.
- No implementar cobertura de tests nueva; solo hacer que el runner correcto los ejecute.
- No tocar el Makefile ni el framework.

## Decisions

### D1 — Lint de admin con ESLint crudo (no `ng lint`)
- **Decisión**: sustituir `ng lint --fix` por `eslint "src/**/*.ts" --fix`, con un `.eslintrc.cjs` en `apps/admin` basado en `@typescript-eslint` (mismo estilo que backend/web), `complexity: warn` (como web) y `max-lines`.
- **Why**: `ng lint` requiere `@angular-eslint` + architect target `lint`, que no existen (admin solo tiene `build`/`serve`). La convención del repo es ESLint crudo por workspace; es el cambio mínimo y consistente.
- **Alternativa (rechazada)**: añadir `@angular-eslint` y configurar `ng lint` — añade dependencia nueva y un architect target sin tests que lo respalden; más superficie.

### D2 — Test de admin con Vitest (eliminar Karma muerto)
- **Decisión**: cambiar `test` a `vitest run` y `test:watch` a `vitest`. Eliminar la dependencia de la vía Karma (no hay `karma.conf.js` ni architect `test`).
- **Why**: los tests reales de admin (`apps/admin/src/config/__tests__/*.test.ts`, `apps/admin/src/styles/__tests__/sync.test.ts`) son **Vitest** (`import ... from 'vitest'`). El runner declarado (`ng test`) nunca configuró Karma; es código muerto que rompe `make test`.
- **Nota**: se usará la config por defecto de Vitest (incluye `src/**/*.test.ts`); no se exige `vitest.config.ts` salvo que haga falta (e.g. alias `@`). Si hace falta alias, se añade un `vitest.config.ts` mínimo.
- **Alternativa (rechazada)**: configurar Karma (`karma.conf.js` + architect `test` + `@angular-devkit/build-angular: karma`) — reintroduce infraestructura que el proyecto no usa y duplica el runner.

### D3 — Paleta única para corregir la complejidad de `runMigration`
- **Decisión**: reducir la complejidad ciclomática de `runMigration` (13) a ≤10 extrayendo ramas/helpers en `migrate-firestore.ts` sin cambiar comportamiento, y **sin** bajar el umbral `complexity: 10` del `.eslintrc.cjs` de backend (es un estándar SOLID del proyecto).
- **Why**: preservar el umbral del proyecto; el método tiene múltiples rutas de error/progreso (gestión de progreso + salto + múltiples fases) que se pueden componer en helpers con una responsabilidad cada una.
- **Alternativa (rechazada)**: subir el umbral a 13 — debilita el estándar SOLID sin resolver la razón de cambio.

### D4 — Restaurar paridad `--shadow-scroll-shell`
- **Decisión**: añadir la declaración `--shadow-scroll-shell: 0 10px 30px rgba(22, 32, 46, 0.3);` al bloque `@theme {}` de `apps/admin/src/styles/globals.css`, con el mismo valor que `apps/web/src/styles/globals.css`.
- **Why**: el test `sync.test.ts` exige paridad exacta de tokens entre ambos `globals.css`. Es el único diff detectado (admin 39 vs web 40 tokens).
- **Alternativa (rechazada)**: eliminar el token de web — rompería el sitio que lo consume (scroll shell) y la fuente canónica `docs/design/style-guide`.

### D5 — Script `lint` para `packages/html-sanitize`
- **Decisión**: añadir `"lint": "eslint \"src/**/*.ts\" --fix"` a `packages/html-sanitize/package.json` con un `.eslintrc.cjs` mínimo (o reusar la config base del repo si está hoisted).
- **Why**: el Makefile parametrizado itera `lint` sobre todos los workspaces; la ausencia del script aborta `make lint`. HTML-sanitize ya tiene `test` (vitest) y `build`; el lint le falta.
- **Riesgo**: si el paquete no tiene parser TS configurado, el primer run puede fallar — se valida con `make lint`.

## Risks / Trade-offs

- [Al cambiar el runner de admin a Vitest, se ejecutan por primera vez los `sync.test.ts` y otros tests que la vía Karma nunca corría] → D4 corrige la paridad de tokens; el resto de tests admin ya pasan con Vitest (verificado: 5 archivos, 15 tests, 1 fallo = sync).
- [El `.eslintrc.cjs` nuevo de admin puede señalar otros errores preexistentes no detectados antes (sin config) ] → iterar en tareas de lint hasta dejarlo verde; es el objetivo.
- [Extraer helpers de `runMigration` puede alterar el CLI si se rompe un contrato interno] → cubierto por tests existentes (`migrate-firestore.use-case.spec.ts`); se ejecuta `make test` para backend.

## Migration Plan

1. Fix por workspace (backend → web → admin → html-sanitize) en tareas TDD.
2. `make lint` y `make test` verdes al final.
3. Sin deploy específico: es configuración de CI/dev. Rollback = revertir commits (comportamiento de negocio intacto).

## Open Questions

Ninguna — todas las decisiones confirmadas con el stakeholder (alcance completo "make lint+test verdes").
