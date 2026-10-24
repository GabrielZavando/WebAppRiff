# Fix de vulnerabilidades bloqueantes en el gate de audit: `body-parser` y `zod`

## Why

El pipeline de CI está fallando en el paso `make audit`: `npm run audit`
bloquea por dos vulnerabilidades **High** sin supresión en el árbol de
dependencias:

- `body-parser@2.3.0` — DoS vía trailing bytes tras un body comprimido
  (GHSA-27r3-jxmh-p828 / CVE-2026-111181). Llega de forma transitiva:
  `@riff/backend` → `@nestjs/platform-express@11.2.7` → `express@5.2.1` →
  `body-parser@2.3.0`. Es código de runtime del BFF: superficie real de ataque.
- `zod@4.6.5` — agotamiento de memoria validando colecciones grandes
  (GHSA-mrhx-c7xc-m3w5 / CVE-2026-6991). Copia vulnerable en la raíz,
  consumida por `astro@7.1.6` y `@astrojs/sitemap@3.7.4` (web),
  `@angular/forms@22.2.1` (admin) y `@fission-ai/openspec@1.14.0` (raíz, dev).

De las 22 vulnerabilidades que reporta `npm audit`, estas son las únicas dos
que bloquean: el resto está suprimido en `npm-audit-suppressions.json`
(remediación diferida al upgrade "V1/Q2", `review_by 2027-01-01`) o es de
severidad moderate/low.

## What Changes

- Añadir al bloque `overrides` existente del `package.json` raíz:
  - `"body-parser": "^2.4.0"` (la 2.3.1 no existe en el registry; el fix salió
    directo en 2.4.0, rango vulnerable `>=2.0.0 <2.4.0`).
  - `"zod": "^4.6.7"` (rango vulnerable `<4.6.6`; latest 4.6.7).
- Regenerar `package-lock.json` con `npm install` y versionar ambos archivos
  juntos.
- Verificar que `npm run audit` pasa en verde (0 vulnerabilidades bloqueantes)
  y que `npm ls` muestra copias únicas parcheadas de ambos paquetes.
- **Sin** añadir entradas nuevas a `npm-audit-suppressions.json`: la
  remediación cubre solo las 2 vulnerabilidades bloqueantes; las demás
  vulnerabilidades siguen suprimidas por el script actual hasta el upgrade
  V1/Q2.
- Sin cambios en `scripts/audit.mjs`, `npm-audit-suppressions.json`, CI,
  Makefile ni código de aplicación.

## Capabilities

### New Capabilities

- `dependency-vulnerability-remediation`: política de remediación de
  vulnerabilidades bloqueantes (High/Critical) de dependencias — actualización
  a versión parcheada en rango declarada como pin de seguridad en `overrides`,
  regeneración del lockfile y verificación del gate sin nuevas supresiones.

### Modified Capabilities

Ninguna. `audit-blocking` no cambia: sus requisitos ya exigen bloquear con
vulnerabilidades High/Critical sin supresión (SC-201) y este fix restaura su
cumplimiento remediando las dos vulnerabilidades, no alterando el gate.

## Impact

- `package.json` (raíz) — bloque `overrides` gana 2 entradas.
- `package-lock.json` — regenerado: `body-parser 2.3.0 → 2.4.0` y
  `zod 4.6.5 → 4.6.7` (más dedupes derivadas).
- Runtime afectado: `apps/backend` (body-parser vía express 5.2.1 — bump minor
  compatible con el rango declarado `^2.2.1`), `apps/web` (zod vía astro) y
  `apps/admin` (zod vía @angular/forms; su copia 4.6.6 también sube a 4.6.7).
- Herramientas dev afectadas: `@fission-ai/openspec` y `@angular/cli`
  (cadenas dev-only de zod).
- Bumps semver-minor/patch dentro de 2.x y 4.x: sin breaking changes; todos
  los rangos declarados por los dependientes admiten las versiones parcheadas.
- Verificación posterior: `npm ls`, `npm run audit`, `make lint`,
  `make typecheck`, `make test` y smoke tests.
