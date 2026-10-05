# Hardening del gate de audit: expiración automática vía `review_by`

## Why

Hoy `scripts/audit.mjs` solo soporta revocación manual vía `revokedAt`. Hay 95
supresiones activas en `npm-audit-suppressions.json` (razón "remediate via
V1/Q2 upgrade") que **nunca caducan solas**, de modo que el gate de audit puede
quedar bloqueado indefinidamente sin forzar una revisión periódica. El
endurecimiento está planificado como Q6 en `AUDIT.md`: las supresiones deben
tener una fecha de revisión (`review_by`) y caducar automáticamente al
vencerla.

## What Changes

- Añadir el campo `review_by` (ISO-8601 UTC) a las supresiones de
  `npm-audit-suppressions.json`.
- Extender `scripts/audit.mjs` (`loadSuppressions` + `isSuppressionActive`)
  para que una supresión con `review_by` en el pasado se considere **caducada**
  y deje de aplicarse (la vulnerabilidad vuelve a bloquear el gate).
- Mantener `revokedAt` como revocación manual explícita (semántica actual sin
  cambios).
- Asignar `review_by` con fecha futura a las 95 entradas activas sin caducidad
  (sugerido: primer día del Q siguiente → `2027-01-01T00:00:00Z`). La entrada
  que ya tiene `revokedAt` programado no recibe `review_by`.
- Ampliar el test unitario de `scripts/__tests__/audit.test.mjs` para cubrir
  supresión activa, revocada y caducada por `review_by`.
- Documentar el formato extendido de las supresiones en `AGENTS.md`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `audit-blocking`: las supresiones pasan a caducar automáticamente vía
  `review_by` (además de la revocación manual existente por `revokedAt`). Cambia
  el comportamiento de `isSuppressionActive`/`loadSuppressions` y el formato de
  las entradas del JSON.

## Impact

- `scripts/audit.mjs` — lógica de activación de supresiones (firma y semántica
  de `isSuppressionActive`, JSDoc de `loadSuppressions`).
- `npm-audit-suppressions.json` — 95 entradas reciben `review_by`; el formato
  pasa de `{ id, reason, revokedAt? }` a `{ id, reason, revokedAt?, review_by? }`.
- `scripts/__tests__/audit.test.mjs` — nuevos casos de prueba (vitest).
- `AGENTS.md` — documentación del formato extendido de supresiones.
- Sin cambios en CI, Makefile ni en el comando `npm run audit`.