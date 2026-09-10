## Ticket ID

C2

## Why

AUDIT.md H3 / C1 restante (2026-09-08): el gate de CI endurecido (`harden-ci-gate`, 2026-09-10) ejecuta `npm audit --audit-level=high || true` en `ci.yml:73`, haciendo que las vulnerabilidades de seguridad **nunca bloqueen** el pipeline. Actualmente hay 101 vulnerabilidades (3 critical, 49 high), incluyendo XSS en Angular, injection en NestJS, y RCE en Astro. Sin un gate bloqueante, un PR con vulnerabilidades críticas puede llegar a `main` con checks en verde.

El Makefile (`audit` target, línea 125) también tiene `|| true` pero es **intocable** (framework-owned). El gate duro vive en el job `project-ci` de `ci.yml`.

## What Changes

- **`npm-audit-suppressions.json`** (nuevo en raíz): archivo declarativo con suppressions para vulnerabilidades conocidas que no se remedian en este change. Formato: `{ id, reason, revokedAt? }` — legible en PRs y revisable por el equipo.
- **`scripts/audit.mjs`** (nuevo): script que ejecuta `npm audit --json`, aplica suppressions del archivo, y retorna código distinto de 0 si hay vulns high/critical no suprimidas. Implementa la lógica de camino suave para devDependencies (WARNING en vez de ERROR, excepto critical).
- **`package.json` raíz**: añade script `"audit": "node scripts/audit.mjs"`.
- **`.github/workflows/ci.yml`**: reemplaza el paso `npm audit --audit-level=high || true` por `npm run audit` (sin `|| true`, sin `--audit-level` — el script maneja la lógica).

**No se toca**: Makefile (intocable), código de aplicación, configuración de workspaces.

## Capabilities

### New Capabilities

- `audit-blocking`: gate de CI que bloquea vulnerabilidades high/critical con suppressions declarativas, camino suave para devDependencies, y expiración automática de suppressions.

### Modified Capabilities

<!-- Ningún requisito funcional existente cambia: endpoints, modelo de datos, autenticación quedan intactos. -->

## Impact

- **CI/CD**: `.github/workflows/ci.yml` (paso de audit actualizado)
- **Tooling**: `npm-audit-suppressions.json` (nuevo), `scripts/audit.mjs` (nuevo), `package.json` raíz (nuevo script)
- **Sin cambios**: Makefile, código de aplicación, workspaces individuales
- **Riesgo**: bajo — el cambio es aditivo; el peor caso es que vulns preexistentes bloqueen el CI inmediatamente (comportamiento deseado)
