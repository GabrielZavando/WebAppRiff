# Design — Remediación de vulnerabilidades bloqueantes vía `overrides`

## Context

El gate de audit (`npm run audit` → `scripts/audit.mjs`) ejecuta
`npm audit --audit-level=high --json` y bloquea el pipeline cuando hay
vulnerabilidades High/Critical no suprimidas. Hoy bloquea por exactamente dos:

| Paquete | Instalada | Rango vulnerable | Origen (transitiva) | Parche |
|---|---|---|---|---|
| `body-parser` | 2.3.0 | `>=2.0.0 <2.4.0` | `@nestjs/platform-express@11.2.7` → `express@5.2.1` (declara `^2.2.1`) | **2.4.0** |
| `zod` | 4.6.5 (raíz) | `<4.6.6` | `astro@7.1.6` y `@astrojs/sitemap@3.7.4` (web), `@angular/forms@22.2.1` (admin), `@fission-ai/openspec@1.14.0` (raíz, dev) | **4.6.7** (latest) |

Ambas son transitivas: ningún workspace las declara como dependencia directa.
El resto de las 22 vulnerabilidades del árbol está suprimido
(`npm-audit-suppressions.json`, remediación diferida al upgrade "V1/Q2" con
`review_by 2027-01-01`) o es moderate/low, y **no entra en el alcance**.

La raíz ya usa `overrides` como mecanismo establecido de pins de seguridad
(`multer` bajo platform-express, `compression`, `proxy-addr`,
`source-map-js`).

## Goals / Non-Goals

**Goals:**

- Desbloquear el pipeline: `npm run audit` en verde (0 bloqueantes) sin añadir
  supresiones nuevas.
- Actualizar `body-parser` a `^2.4.0` y `zod` a `^4.6.7` en todas las copias
  del árbol mediante el bloque `overrides` del `package.json` raíz.
- Regenerar y versionar `package-lock.json` junto al `package.json`, de modo
  que `npm ci` reproduzca el árbol parcheado.
- Verificar la compatibilidad en rango con `npm ls` (copias únicas parcheadas)
  y la no regresión con lint/typecheck/test/smoke.

**Non-Goals:**

- Sin cambios en `scripts/audit.mjs`, `npm-audit-suppressions.json`, CI,
  Makefile ni código de aplicación.
- Sin remediar las vulnerabilidades suprimidas (astro crítico, firebase,
  vite, etc.): siguen diferidas al upgrade "V1/Q2".
- Sin actualizar dependencias de primer nivel (express, astro, Angular)
  ni saltos de major.

## Decisions

### D1 — Pins explícitos en `overrides` de la raíz (no `npm audit fix`)

Se añaden dos claves planas al bloque `overrides` existente:

```json
"body-parser": "^2.4.0",
"zod": "^4.6.7",
```

Alternativa considerada: `npm audit fix` sin overrides. Descartada por dos
motivos: (1) en el dry-run con npm 10.9.9 no re-resuelve `body-parser`
(queda en 2.3.0 y el re-audit sigue listándolo), y (2) es menos determinista —
los pins explícitos documentan la intención, sobreviven a regeneraciones del
lockfile y siguen la convención ya establecida en este repo para pins de
seguridad.

### D2 — Versiones objetivo: `^2.4.0` y `^4.6.7`

- `body-parser@2.4.0`: el rango vulnerable es `>=2.0.0 <2.4.0` y la versión
  `2.3.1` **no existe** en el registry (el fix salió directo en 2.4.0). Bump
  minor en 2.x: engines `node >=18` (el proyecto corre node >=24), sin
  breaking changes; `2.4.0` satisface el `^2.2.1` declarado por express.
- `zod@4.6.7`: dos patches dentro de v4 desde 4.6.5; sin breaking changes.
  Satisface todos los rangos declarados (`^4.3.6`, `^4.0.10`, `^4.4.3`) y
  unifica las copias (la raíz 4.6.5 vulnerable y la de `apps/admin` 4.6.6
  convergen en 4.6.7).

Alternativa considerada: fijar el mínimo parche (`>=4.6.6`). Descartada: usar
el latest estable con caret da margen de patches futuros dentro de la misma
versión mayor.

### D3 — Verificación de compatibilidad antes y después del cambio

Antes de cerrar: `npm ls body-parser` y `npm ls zod` deben mostrar una única
versión por paquete en todo el árbol (sin copias vulnerables remanentes en
`apps/*/node_modules`). Después: `npm run audit` debe reportar 0 bloqueantes
y `scripts/audit.mjs` no debe recibir entradas nuevas de supresión.

### D4 — Cobertura de regresión con los gates existentes

No hay comportamiento nuevo unit-testeable en `scripts/audit.mjs` (no se
modifica código), por lo que el "rojo→verde" del TDD se materializa en el
gate mismo: `npm run audit` falla hoy (rojo) y pasa tras el fix (verde). La
no regresión de runtime se cubre con los gates existentes: `make lint`,
`make typecheck`, `make test` y smoke tests (`npm run test:smoke`), que
ejercitan el backend (body-parser en express) y el build de web/admin (zod en
astro/Angular).

## Risks / Trade-offs

- [`body-parser@2.4.0` arrastra transitivas nuevas (`qs ^6.16.1`,
  `iconv-lite ^0.7.3`)] → Bump minor semver-compatible; los smoke tests y el
  test suite del backend cubren el parseo de bodies (JSON, urlencoded,
  multipart vía multer). Revisar el diff del lockfile en el PR.
- [`overrides` plano de `zod` fuerza la versión también a herramientas dev
  (openspec, @angular/cli)] → Todos sus rangos declarados ya admiten 4.6.7;
  el riesgo de conflicto es nulo hoy. Los overrides se revisan en el upgrade
  V1/Q2, donde estos pins podrían retirarse si las dependencias de primer
  nivel resuelven versiones parcheadas por sí solas.
- [Un dependiente declara un rango incompatible con el pin — DESCUBIERTO en
  apply: `@angular/cli@22.2.3` declara `zod: "4.6.6"` pin exacto] → npm NO
  falla la instalación: el override gana y `npm ls` marca las referencias como
  `invalid` (informativo). Resuelto a `4.6.7`, patch de la misma línea 4.6.x y
  `@angular/cli` es herramienta dev; los builds de admin lo validan en la
  sección 5. El marcador desaparecerá cuando `@angular/cli` relaje su pin.
- [El lockfile regenerado arrastra dedupes colaterales] → Verificar con
  `git diff --stat package-lock.json` que los cambios se concentran en
  body-parser/zod y sus transitivas; cualquier cambio no relacionado se
  documenta en el PR.

## Migration Plan

1. Capturar el rojo: ejecutar `npm run audit` y confirmar que falla con
   `body-parser` y `zod` como únicos bloqueantes.
2. Añadir `"body-parser": "^2.4.0"` y `"zod": "^4.6.7"` al bloque `overrides`
   del `package.json` raíz.
3. Regenerar `package-lock.json` con `npm install`. NOTA (descubierto en
   apply): con npm 10.9.9 un `npm install` simple NO re-resuelve los paquetes
   ya instalados (el árbol queda stale: body-parser 2.3.0 "invalid...
   overridden"). Secuencia efectiva: `npm install` → `npm update body-parser
   zod` → si quedan copias anidadas stale, eliminar su entrada del lockfile y
   su directorio físico + `npm install` (aplicado a
   `apps/admin/node_modules/zod`, que además quedó deduplizada a la copia
   raíz).
4. Verificar: `npm ls body-parser` y `npm ls zod` (copias únicas parcheadas),
   `npm run audit` (código 0, sin bloqueantes).
5. Ejecutar gates de no regresión: `make lint`, `make typecheck`, `make test`
   y `npm run test:smoke`.
6. Versionar `package.json` + `package-lock.json` en un único commit
   (`fix: pin body-parser and zod to patched versions`).

Rollback: revertir el commit; el lockfile vuelve al árbol anterior. El gate
regresará a su estado actual (bloqueante), sin efecto colateral persistente.

## Open Questions

- Ninguna bloqueante. Las versiones objetivo (`^2.4.0`, `^4.6.7`) son las
  confirmadas contra el registry en la fase de reconocimiento y pueden
  ajustarse antes del apply si publican patches más recientes.
