# Audit Blocking Specification

## Purpose

Proteger la rama `main` contra vulnerabilidades de seguridad que puedan llegar via PRs, implementando un mecanismo de suppressions declarativas que permita al equipo gestionar la deuda de seguridad de forma transparente y revisable.

## ADDED Requirements

### Requirement: The system SHALL support declarative suppressions via JSON file

El sistema SHALL soportar un archivo `npm-audit-suppressions.json` con suppressions en formato `{ id, reason, revokedAt? }` que permita excluir vulnerabilidades conocidas del conteo de fallo.

#### Scenario: SC-201 — Audit bloquea con vulns sin suppression

- **GIVEN** una vulnerabilidad high o critical que NO está en `npm-audit-suppressions.json`
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script retorna código distinto de 0
- **AND** el mensaje incluye el ID de la vulnerabilidad y su severidad

#### Scenario: SC-202 — Suppressions permiten excluir vulns conocidas

- **GIVEN** una vulnerabilidad en `npm-audit-suppressions.json` con campo `reason` y sin `revokedAt`
- **WHEN** se ejecuta `npm run audit`
- **THEN** la vuln suprimida no causa fallo del pipeline
- **AND** el script imprime un mensaje informativo indicando que la vuln fue suprimida

### Requirement: Suppressions SHALL expire automatically via revokedAt

Una suppression con `revokedAt` en el pasado SHALL tratarse como si no existiera — la vulnerabilidad correspondiente causa fallo.

#### Scenario: SC-203 — Suppressions expiran con revokedAt

- **GIVEN** una suppression en `npm-audit-suppressions.json` con `revokedAt` en el pasado
- **WHEN** se ejecuta `npm run audit`
- **THEN** la suppression expirada NO se aplica
- **AND** la vulnerabilidad causa fallo del pipeline

### Requirement: devDependencies SHALL have a soft path (Warning only)

Las vulnerabilidades high que afectan solo a devDependencies SHALL emitir WARNING pero no fallar. Las vulnerabilidades critical SIEMPRE SHALL fallar sin importar si son devDependencies.

#### Scenario: SC-204 — devDependencies tienen camino suave (Warning)

- **GIVEN** una vulnerabilidad high que afecta SOLO a devDependencies (no a dependencies)
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script emite un WARNING con la información de la vuln
- **BUT** no retorna código distinto de 0 (no falla)

#### Scenario: SC-205 — critical siempre bloquea sin importar devDependencies

- **GIVEN** una vulnerabilidad critical en devDependencies
- **WHEN** se ejecuta `npm run audit`
- **THEN** el script retorna código distinto de 0 (falla)
- **AND** el mensaje indica que critical siempre bloquea

### Requirement: CI SHALL execute the blocking audit step

El paso de audit en `.github/workflows/ci.yml` SHALL ejecutar `npm run audit` sin `|| true`, de modo que el gate sea realmente bloqueante.

#### Scenario: SC-207 — CI project-ci refleja el gate duro

- **GIVEN** el job `project-ci` en `.github/workflows/ci.yml`
- **WHEN** un PR contiene una vulnerabilidad high/critical sin suppression
- **THEN** el job `project-ci` falla
- **AND** el PR queda bloqueado para merge

### Requirement: Makefile SHALL remain untouched and functional

El Makefile (intocable) SHALL seguir funcionando sin cambios. El target `audit` del Makefile tiene su propio `|| true` que no se modifica.

#### Scenario: SC-206 — Makefile sigue funcionando (intocable)

- **GIVEN** el Makefile sin modificar
- **WHEN** se ejecuta `make ci`
- **THEN** el target `audit` completa sin error (el `|| true` interno del Makefile sigue activo)
