## MODIFIED Requirements

### Requirement: The system SHALL support declarative suppressions via JSON file

El sistema SHALL soportar un archivo `npm-audit-suppressions.json` con suppressions en formato `{ id, reason, revokedAt?, review_by? }` que permita excluir vulnerabilidades conocidas del conteo de fallo. `revokedAt` y `review_by` son fechas ISO-8601 UTC opcionales.

#### Scenario: SC-201 — Audit bloquea con vulns sin suppression

- **GIVEN** una vulnerabilidad high o critical que NO está en `npm-audit-suppressions.json`
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script retorna código distinto de 0
- **AND** el mensaje incluye el ID de la vulnerabilidad y su severidad

#### Scenario: SC-202 — Suppressions permiten excluir vulns conocidas

- **GIVEN** una vulnerabilidad en `npm-audit-suppressions.json` con campo `reason`, sin `revokedAt` y con `review_by` en el futuro
- **WHEN** se ejecuta `npm run audit`
- **THEN** la vuln suprimida no causa fallo del pipeline
- **AND** el script imprime un mensaje informativo indicando que la vuln fue suprimida

### Requirement: Suppressions SHALL expire automatically via revokedAt

Una suppression con `revokedAt` en el pasado SHALL tratarse como si no existiera — la vulnerabilidad correspondiente causa fallo. `revokedAt` sigue siendo la revocación manual explícita. Un `revokedAt` con valor no parseable como fecha válida SHALL hacer fallar el script de forma explícita (mensaje que menciona el id de la supresión y el valor inválido, código distinto de 0); nunca se trata como activa ni como caducada.

#### Scenario: SC-203 — Suppressions expiran con revokedAt

- **GIVEN** una suppression en `npm-audit-suppressions.json` con `revokedAt` en el pasado
- **WHEN** se ejecuta `npm run audit`
- **THEN** la suppression expirada NO se aplica
- **AND** la vulnerabilidad causa fallo del pipeline

#### Scenario: SC-214 — revokedAt mal formado falla el gate

- **GIVEN** una supresión en `npm-audit-suppressions.json` con `revokedAt` no parseable como fecha (ej. `01/01/2027`)
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script falla con un mensaje que menciona el id de la supresión y el valor inválido
- **AND** retorna código distinto de 0

## ADDED Requirements

### Requirement: Suppressions SHALL expire automatically via review_by

Una suppression con `review_by` en el pasado SHALL tratarse como caducada — la vulnerabilidad correspondiente causa fallo del pipeline. El campo `revokedAt` (revocación manual) y `review_by` (fecha de revisión trimestral) son mecanismos independientes y acumulativos: una supresión es activa solo si ninguna de las dos fechas está en el pasado. Un `review_by` con valor no parseable como fecha válida SHALL hacer fallar el script de forma explícita (mensaje que menciona el id de la supresión y el valor inválido, código distinto de 0); nunca se trata como activa ni como caducada. Una supresión sin `review_by` no caduca por esta vía (compatibilidad con el formato previo).

#### Scenario: SC-208 — review_by en el pasado caduca la suppression

- **GIVEN** una suppression en `npm-audit-suppressions.json` con `review_by` en el pasado y `revokedAt` nulo
- **WHEN** se ejecuta `npm run audit`
- **THEN** la suppression caducada NO se aplica
- **AND** la vulnerabilidad causa fallo del pipeline

#### Scenario: SC-209 — review_by en el futuro mantiene la suppression activa

- **GIVEN** una suppression en `npm-audit-suppressions.json` con `review_by` en el futuro y `revokedAt` nulo
- **WHEN** se ejecuta `npm run audit`
- **THEN** la vuln suprimida no causa fallo del pipeline

#### Scenario: SC-210 — Supresión sin review_by no caduca por esta vía

- **GIVEN** una suppression en `npm-audit-suppressions.json` sin campo `review_by` y con `revokedAt` nulo
- **WHEN** se ejecuta `npm run audit`
- **THEN** la vuln suprimida no causa fallo del pipeline (la suppression sigue activa)

#### Scenario: SC-211 — revokedAt prevalece sobre review_by futuro

- **GIVEN** una suppression con `revokedAt` en el pasado y `review_by` en el futuro
- **WHEN** se ejecuta `npm run audit`
- **THEN** la suppression NO se aplica
- **AND** la vulnerabilidad causa fallo del pipeline

#### Scenario: SC-213 — review_by mal formado falla el gate

- **GIVEN** una supresión en `npm-audit-suppressions.json` con `review_by` no parseable como fecha (ej. `01/01/2027`)
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script falla con un mensaje que menciona el id de la supresión y el valor inválido
- **AND** retorna código distinto de 0

### Requirement: The current suppressions SHALL carry a review_by date

El archivo `npm-audit-suppressions.json` SHALL contener `review_by` con fecha futura en las 95 entradas activas sin `revokedAt` (razón "remediate via V1/Q2 upgrade"), de modo que ninguna supresión activa quede sin fecha de revisión.

#### Scenario: SC-212 — Todas las supresiones activas tienen review_by futuro

- **GIVEN** el archivo `npm-audit-suppressions.json` tras el cambio
- **WHEN** se inspeccionan las entradas con `revokedAt` nulo
- **THEN** cada una de las 95 entradas tiene un campo `review_by` con fecha en el futuro
- **AND** la entrada con `revokedAt` programado no requiere `review_by`