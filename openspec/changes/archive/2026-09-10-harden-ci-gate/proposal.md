## Why

El gate de CI actual (`make ci` → `refs solid-lint lint test audit`) no protege el código: no ejecuta `typecheck` ni `build`, la cobertura backend 90 % está declarada en `apps/backend/jest.config.js` pero jamás se evalúa (los tests corren sin `--coverage`), `npm audit --audit-level=high || true` no puede bloquear por el `|| true` (`Makefile:125`), y los scripts `lint` de los tres workspaces usan `--fix`, mutando el código en CI y enmascarando errores que deberían romper el pipeline. Un PR con errores de tipos, código que no compila, cobertura insuficiente o vulnerabilidades high puede llegar a `main` con checks en verde (AUDIT.md H3).

## What Changes

- **Job `project-ci` de `.github/workflows/ci.yml`**: reemplaza el único paso `make ci` por una secuencia dura explícita: `bash check-refs.sh` → `make solid-lint` → `npm run lint --workspaces` → `npm run typecheck --workspaces --if-present` → `npm run build --workspaces` → `npm run test:cov --workspace=apps/backend` → `npm run test --workspace=apps/web` → `npm run test --workspace=apps/admin` → `npm audit --audit-level=high` (no bloqueante, reportado en el log; la remediación de las vulns preexistentes se sigue en tickets de upgrade V1/Q2).
- **`package.json` raíz**: añade el script `typecheck = "npm run typecheck --workspaces --if-present"`.
- **Scripts `lint` de `apps/{backend,web,admin}/package.json`**: se quita `--fix` del script `lint` y se añade un `lint:fix` separado (el `--fix` queda solo local).
- **`make ci` permanece intocable y funcional**: el Makefile es framework (no se edita); el gate duro vive en el job `project-ci`, que es project-owned.

No se implementa código de aplicación: es un change de tooling y CI transversal a los tres workspaces.

## Capabilities

### New Capabilities

- `harden-ci-gate`: endurecimiento del gate de CI del monorepo — typecheck y build bloqueantes, cobertura backend 90 % evaluada y bloqueante, `npm audit` sin `|| true`, y `lint` no mutante en CI, sin tocar el Makefile intocable.

### Modified Capabilities

<!-- Ningún requisito funcional de backend/web/admin cambia: los endpoints REST, el modelo Firestore y la autenticación quedan intactos. -->

## Impact

- **CI/CD**: `.github/workflows/ci.yml` (job `project-ci` endurecido; el job `validate` y el `node-version: '24'` se mantienen).
- **Tooling**: `package.json` raíz (script `typecheck`), `apps/backend/package.json`, `apps/web/package.json`, `apps/admin/package.json` (scripts `lint`/`lint:fix`).
- **Sin cambios**: contrato de env, `apps/backend/jest.config.js` (ya correcto), `Makefile` (intocable), endpoints/dominio de backend y frontend.
- **Riesgo de impacto**: endurecer el gate puede exponer deuda latente preexistente (tipos, build o cobertura < 90 % en algún workspace); esa deuda se corrige dentro de este mismo change (decisión confirmada con el cliente).