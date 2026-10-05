# Tasks: harden-audit-gate

## 1. Tests unitarios (TDD — RED primero)

- [x] 1.1 Añadir en `scripts/__tests__/audit.test.mjs` los casos de `isSuppressionActive` para `review_by`: activa (`review_by` futuro), caducada (`review_by` pasado) y `revokedAt` pasado con `review_by` futuro (SC-208, SC-209, SC-211)
- [x] 1.2 Añadir el caso de supresión sin `review_by` (sigue activa, compatibilidad con formato previo) (SC-210)
- [x] 1.3 Añadir en `analyzeVulnerabilities` el escenario SC-208: supresión con `review_by` pasado NO suprime y la vuln pasa a `blocking`
- [x] 1.4 Añadir el caso SC-213: `isSuppressionActive` lanza `Error` cuando `review_by` no es parseable como fecha (ej. `01/01/2027`)
- [x] 1.5 Añadir el caso SC-214: `isSuppressionActive` lanza `Error` cuando `revokedAt` no es parseable como fecha (ej. `01/01/2027`)
- [x] 1.6 Verificar RED: ejecutar `npx vitest run scripts/__tests__/audit.test.mjs` y confirmar que los nuevos casos fallan (SC-208..SC-214)

## 2. Implementación en `scripts/audit.mjs`

- [x] 2.1 Extender `isSuppressionActive` para devolver `false` cuando `review_by` está en el pasado (la supresión caduca y la vuln vuelve a bloquear); las fechas `revokedAt` y `review_by` son independientes y acumulativas (SC-208, SC-211)
- [x] 2.2 Implementar la validación fail-loud en `isSuppressionActive`: si `review_by` o `revokedAt` es no nulo y no cumple el patrón ISO-8601 UTC estricto (`YYYY-MM-DDTHH:mm:ssZ`) ni parsea vía `Date`, lanzar `Error` con mensaje que mencione el id de la supresión, el valor inválido y el formato esperado (SC-213, SC-214)
- [x] 2.3 Actualizar el JSDoc de `loadSuppressions` al tipo `{ id, reason, revokedAt: string | null, review_by: string | null }`
- [x] 2.4 Verificar GREEN: `npx vitest run scripts/__tests__/audit.test.mjs` pasa con los nuevos casos (SC-208..SC-214)

## 3. Datos: `npm-audit-suppressions.json`

- [x] 3.1 Añadir `"review_by": "2027-01-01T00:00:00Z"` a las 95 entradas activas (con `revokedAt: null` y razón "remediate via V1/Q2 upgrade"); la entrada con `revokedAt` programado (2026-10-10) no recibe `review_by` (SC-212)
- [x] 3.2 Verificar que el JSON sigue siendo válido y el conteo: 95 entradas con `review_by` futuro y 1 con `revokedAt` sin `review_by` (SC-212)

## 4. Documentación en `AGENTS.md`

- [x] 4.1 Documentar el formato extendido de supresiones `{ id, reason, revokedAt?, review_by? }` (fechas ISO-8601 UTC) y la semántica de caducidad por `review_by` + revocación manual por `revokedAt` (SC-208, SC-212)

## 5. Verificación del gate

- [x] 5.1 Ejecutar `npm run audit` y confirmar que pasa con las nuevas fechas `review_by` (SC-209) y que ninguna entrada actual dispara el fail-loud de fechas (SC-213, SC-214)
- [x] 5.2 Ejecutar `make ci` (o el gate del CI) y confirmar el gate completo en verde con las supresiones activas