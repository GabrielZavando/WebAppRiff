# Design — Expiración automática de supresiones vía `review_by`

## Context

`scripts/audit.mjs` ejecuta `npm audit --audit-level=high --json` y aplica las
supresiones de `npm-audit-suppressions.json` para decidir si el gate bloquea.
Hoy una supresión solo deja de aplicarse por revocación manual (`revokedAt` en
el pasado, escenario SC-203). Existen 95 supresiones activas con `revokedAt:
null` y razón "remediate via V1/Q2 upgrade" que nunca caducan, permitiendo que
el gate quede silenciosamente permanentemente verde para esas vulns.

El cambio extiende el formato a `{ id, reason, revokedAt?, review_by? }` y hace
que una fecha de revisión (`review_by`) vencida caduque la supresión de forma
automática. Es el ítem Q6 de `AUDIT.md`.

## Goals / Non-Goals

**Goals:**

- Que una supresión con `review_by` en el pasado se considere caducada y su
  vulnerabilidad vuelva a bloquear `npm run audit`.
- Mantener `revokedAt` como revocación manual explícita (semántica actual
  intacta).
- Que todas las supresiones activas actuales tengan `review_by` futuro
  (`2027-01-01T00:00:00Z`, primer día del Q siguiente).
- Cobertura de test para los tres estados: activa, revocada y caducada.
- Que una fecha inválida en `review_by`/`revokedAt` haga fallar el script de
  forma explícita (fail-loud): mensaje con el id y el valor inválido, código
  distinto de 0. Nunca fail-open silencioso.
- Documentar el formato extendido en `AGENTS.md`.

**Non-Goals:**

- Sin cambios en el Makefile, CI, ni en el comando `npm run audit`.
- Sin validación de esquema JSON completa (solo validación mínima de fechas en
  `review_by`/`revokedAt`, ver D6); sin reescritura automática de fechas.
- Sin tocar la regla SC-204 (devDependencies soft path) ni SC-205 (critical
  always blocks).

## Decisions

### D1 — Semántica acumulativa: `revokedAt` y `review_by` son independientes

`isSuppressionActive(s)` devuelve `true` solo si **ninguna** de las dos fechas
está en el pasado:

- `revokedAt` en el pasado → revocada (comportamiento existente, SC-203).
- `review_by` en el pasado → caducada (nuevo, SC-208).
- Ambas nulas/futuras → activa.

Alternativa considerada: que `review_by` sustituyera a `revokedAt`. Descartada:
el requisito exige mantener la revocación manual explícita como mecanismo
distinto; además `revokedAt` ya está en producción y hay una entrada con esa
fecha programada.

### D2 — `review_by` ausente = nunca caduca por esta vía (backward compat)

Una supresión sin `review_by` se trata como activa respecto a esta fecha, igual
que hoy una sin `revokedAt`. Esto preserva el test existente
`isSuppressionActive({ revokedAt: null }) === true` y tolera entradas antiguas
sin romper el gate. La obligación de que las 95 entradas activas tengan fecha
queda garantizada por datos (SC-212) y documentada en `AGENTS.md`; la
validación en runtime (D6) verifica el FORMATO de las fechas presentes, no su
presencia.

Alternativa considerada: tratar `review_by` ausente como caducado inmediato.
Descartada: rompería la compatibilidad con el formato previo y con el test
existente.

### D3 — Fecha única `2027-01-01T00:00:00Z` (ISO-8601 UTC)

Se usa el primer día del trimestre siguiente al actual (oct-2026 → Q1-2027) en
formato ISO-8601 UTC, idéntico al ya usado por `revokedAt` en el JSON
(`2026-10-10T00:00:00Z`). Las comparaciones se hacen con `Date` sobre ese
formato.

Alternativa considerada: una fecha distinta por entrada según el paquete.
Descartada por complejidad innecesaria: todas comparten la misma razón de
remediación ("remediate via V1/Q2 upgrade") y el mismo plazo.

### D4 — Implementación localizada en `isSuppressionActive`

El cambio se limita a `scripts/audit.mjs`:

- `isSuppressionActive(suppression)`: añadir el chequeo de `review_by`.
- `loadSuppressions`: actualizar el JSDoc del tipo de retorno a
  `{ id, reason, revokedAt: string | null, review_by: string | null }`.

No se necesitan cambios de firma: `main()` ya filtra
`suppressions.filter(isSuppressionActive)`, así que una supresión caducada se
excluye automáticamente y su vuln vuelve a caer en `blocking`.

### D5 — Pruebas en la suite vitest existente

Se amplía `scripts/__tests__/audit.test.mjs` (vitest, patrón ya usado):

- `isSuppressionActive`: casos activa (`review_by` futuro), revocada
  (`revokedAt` pasado), caducada (`review_by` pasado) y `revokedAt` pasado +
  `review_by` futuro.
- `analyzeVulnerabilities`/escenarios SC-208/SC-209: supresión con `review_by`
  pasado NO suprime (bloquea); con `review_by` futuro sí suprime.

### D6 — Fail-loud en fechas inválidas (`review_by`/`revokedAt`)

Si `review_by` o `revokedAt` es no nulo y no representa una fecha válida,
`isSuppressionActive` lanza un `Error` con mensaje explícito que menciona el id
de la supresión, el valor inválido y el formato esperado; la excepción propaga
hasta `main()` y el script sale con código distinto de 0. Una fecha inválida
NUNCA se trata como activa ni como caducada (SC-213, SC-214).

Detalle clave: `Date.parse` en JS es permisivo y acepta cadenas como
`01/01/2027`, por lo que la validación combina una comprobación estricta del
patrón ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`) con la parseabilidad vía `Date`.
Un valor que no cumpla ambos chequeos dispara el error.

Alternativa considerada: ignorar la fecha inválida (fail-open actual).
Descartada: contradice el objetivo de endurecer el gate — un error de tipeo en
el JSON silenciaría la expiración de una supresión.

## Risks / Trade-offs

- [La fecha `review_by` vence sin que se remedie la vuln] → La supresión caduca
  y el gate de CI bloquea los PR hasta remediar o revisar y extender la fecha.
  Es el comportamiento deseado del endurecimiento; el proceso de revisión
  trimestral queda documentado en `AGENTS.md`.
- [Fecha mal formada en `review_by`/`revokedAt`] → Ya no hay fail-open
  silencioso: la validación estricta de formato (D6) lanza un error explícito
  (id de la supresión, valor inválido y formato esperado) y el script sale con
  código distinto de 0, bloqueando el gate hasta corregir el JSON (SC-213,
  SC-214). `Date.parse` es permisivo (acepta `01/01/2027`), por eso la
  validación exige además el patrón ISO-8601 UTC.
- [Entrada con `revokedAt` programado (2026-10-10) pasa a estar inactiva en esa
  fecha] → Comportamiento ya existente e independiente de este cambio; no
  recibe `review_by` (SC-212).
- [95 ediciones manuales del JSON propensas a error] → Fecha única y uniforme;
  el aplicador usa un script/sed acotado y verifica con
  `python3 -c "json.load(...)"` que el archivo sigue siendo JSON válido y que
  todas las entradas activas tienen `review_by`.

## Migration Plan

1. Actualizar `scripts/audit.mjs` (`isSuppressionActive` con `review_by` +
   validación fail-loud de fechas; JSDoc de `loadSuppressions`).
2. Ampliar `scripts/__tests__/audit.test.mjs` (incl. SC-213/SC-214 de fechas
   inválidas) y ejecutar `npx vitest run scripts/__tests__/audit.test.mjs`
   para confirmar rojo antes del cambio de datos (TDD).
3. Añadir `review_by: "2027-01-01T00:00:00Z"` a las 95 entradas activas en
   `npm-audit-suppressions.json`; verificar JSON válido y conteo (95 + 1).
4. Documentar el formato en `AGENTS.md`.
5. `npm run audit` en verde con las nuevas fechas; `make ci` completo.

Rollback: revertir el commit del cambio; `isSuppressionActive` vuelve al
comportamiento por `revokedAt` y las fechas `review_by` extra quedan inertes.

## Open Questions

- Ninguna bloqueante. La fecha concreta de `review_by` (Q1-2027) es la sugerida
  por el requerimiento y se puede ajustar antes del apply sin impacto en el
  diseño.