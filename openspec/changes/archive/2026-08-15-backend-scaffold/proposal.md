## Why

El contrato del backend NestJS (BFF) está completamente definido en `docs/api-spec.yml` (1176 líneas, 5 dominios) y `docs/data-model.md` (5 colecciones Firestore con reglas de integridad), pero `apps/backend` es un scaffold vacío: solo existe `package.json` declarando dependencias y un `node_modules` parcial (únicamente `@types/node`). No compila, no corre, no tiene configs TS, ni Dockerfile, ni un solo archivo en `src/`. El sitio Astro y el panel Angular son 100% hardcoded porque no hay nada que los alimente. Este change entrega el **esqueleto NestJS runnable** que habilita los cinco changes siguientes (`backend-firebase-config`, `backend-commons`, `backend-categorias`, `backend-subcategorias`, `backend-productos`); sin este primer cambio, ningún módulo de dominio puede arrancar.

## What Changes

- `apps/backend`: instalar dependencias declaradas en el `package.json` existente (NestJS 10, jest, ts-jest, eslint, typescript, `@nestjs/cli`, `firebase-admin`, class-validator/transformer, throttler) vía `npm install` desde el workspace root (`npm ci --workspaces` o `npm install` en `apps/backend`).
- Crear `apps/backend/src/main.ts` (bootstrap NestJS + listener en `PORT` desde env con default `3000`).
- Crear `apps/backend/src/app.module.ts` (root module vacío, listo para añadir módulos de dominio en changes siguientes).
- Crear `apps/backend/src/app.controller.ts` + `apps/backend/src/app.service.ts` mínimos con un endpoint `GET /health` → `{ "status": "ok" }` (público, sin auth).
- Crear `apps/backend/tsconfig.json` (strict mode, target ES2022, `outDir: dist`, paths `@/*` → `src/*`, experimentalDecorators, emitDecoratorMetadata).
- Crear `apps/backend/tsconfig.build.json` (extiende `tsconfig.json`, excluye `*.spec.ts`).
- Crear `apps/backend/nest-cli.json` (sourceRoot `src`, `nest build` con `tsconfig.build.json`).
- Crear `apps/backend/jest.config.js` (ts-jest preset, coverageDirectory `coverage`, thresholds globales 90% para `statements`/`branches`/`functions`/`lines`).
- Crear `apps/backend/jest-e2e.json` (config de test e2e raíz, separado de unitarios).
- Copiar y adaptar `apps/backend/.eslintrc.cjs` desde `templates/ci/eslintrc.backend.js` (reglas: `max-lines: ["error", 300]`, `complexity: ["error", 10]`, sonarjs cognitive-complexity, `@typescript-eslint` recommended, plumage Prettier opcional).
- Copiar `apps/backend/.dependency-cruiser.js` desde `templates/ci/.dependency-cruiser.js` (regla `no-infra-from-domain` para DIP mecánico, aunque no habrá `domain/` todavía, queda como guard para los cambios siguientes).
- Crear `apps/backend/.env.example` (placeholder mínimo: `PORT=3000`; las variables Firebase/JWT/CORS entran en changes de Firebase y commons).
- Crear `apps/backend/.gitignore` (ignora `dist/`, `coverage/`, `.env`, `*.local`).
- Crear `apps/backend/Dockerfile` multi-stage (stage `build`: Node 22 + `npm ci` + `npm run build`; stage `runtime`: slim, copia `dist/` + `node_modules/`, `CMD ["node", "dist/main.js"]`).
- Crear `apps/backend/README.md` con la estructura 1-liner + setup 3 pasos + variables env + comandos clave (dev, test, lint, build).
- **Activar la rama backend del `solid-lint` del Makefile** (hoy inactiva porque `apps/backend/src` no existe): al crear `src/`, el target `make solid-lint` comenzará a ejecutar `eslint -c templates/ci/eslintrc.backend.js` y `.dependency-cruiser.js` sobre el backend.
- **No se implementan módulos de dominio** (categorias, productos, etc.) — entran en changes posteriores.
- **No se incluye Firebase/Auth/CORS/Throttler** — entran en `backend-firebase-config` y `backend-commons`.

## Capabilities

### New Capabilities
- `backend-runtime`: bootstrap del backend NestJS runnable — arranque de la app, exposure de `/health`, configuración TS/Jest/ESLint/dependency-cruiser, Docker build base. Es la fundación técnica sobre la que se montan todos los módulos de dominio y la infraestructura (Firebase, Auth, CORS, Throttler).

### Modified Capabilities
<!-- Ninguna capability existente cambia. Las 18 specs actuales son todas del frontend Astro (design-tokens, header, hero-banner, etc.); ninguna cubre el backend, por lo tanto ninguna requiere delta spec. -->

## Impact

- **Código afectado**: exclusivamente `apps/backend/` (hoy vacío salvo `package.json`). No se toca `apps/web`, `apps/admin`, ni `docs/`.
- **API / contratos**: sin cambios a `docs/api-spec.yml` ni `docs/data-model.md`. El único endpoint implementado (`/health`) ya está declarado en `docs/api-spec.yml` (líneas 502-516) y coincide 1:1 con el contrato: `{ "status": "ok" }`. La ruta `/api/v1` prefix se decide en `backend-commons` o se deja sin versionar para `/health` (decision pendiente de design.md — `/health` en el spec aparece bajo `/health`, sin `/api/v1`).
- **Dependencias**: las ya declaradas en `apps/backend/package.json` (NestJS 10, firebase-admin 12, class-validator/transformer, throttler 6, jest/ts-jest/eslint/typescript). Cero dependencias nuevas en este change; el trabajo materializa lo declarado, no añade más.
- **CI**: el job `solid-lint` de `.github/workflows/ci.yml` comenzará a ejecutar su rama backend (hoy inactiva por ausencia de `src/`). El target `make lint` del Makefile empezará a lintear el backend en paralelo con web/admin. La rama backend del `solid-lint` usa configs copiadas, por lo que su comportamiento coincide con los templates de referencia.
- **Node**: `package.json` raíz exige `>=22.12.0` (confirmado en auditoría); `docs/backend-standards.md` menciona Node 20. **Decisión**: este change se adhiere a `engines.node` ya declarado (Node 22). El Dockerfile usa Node 22-slim. Si se desea alinear documentación a Node 20, queda fuera de alcance (sería un change `docs-only` aparte).
- **Cobertura**: `jest.config.js` fija thresholds 90% (`docs/backend-standards.md` § Testing backend). El primer endpoint (`/health`) debe cubrirse con test unitario + e2e para mantener el umbral.
- **Riesgo**: `npm audit` reporta ~90 vulns en cadena webpack de `@nestjs/cli` (documentado en `design-system-revision/tasks.md` 8.10, pre-existente, no regresión de este change). Fix requiere upgrade a Angular 21/Nest CLI nuevo → change futuro, no bloqueante. El `npm install` puede requerir `--legacy-peer-deps` si hay conflictos de peer deps en monorepo con Angular/Nest coexistiendo; se valida en ejecución.
- **Riesgo**: El `node_modules` actual de `apps/backend` está incompleto (solo `@types/node`); `npm install` debe ejecutarse desde el workspace root para que el hoisting del monorepo resuelva correctamente.
