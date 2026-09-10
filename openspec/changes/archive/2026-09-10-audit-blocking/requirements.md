# Requirements — Audit Blocking

> Requisitos numerados con trazabilidad a escenarios SC-2xx.

## REQ-001: Suppressions declarativas

El sistema debe soportar un archivo `npm-audit-suppressions.json` con suppressions en formato `{ id, reason, revokedAt? }`.

**Trazabilidad**: SC-202, SC-203

## REQ-002: Bloqueo de vulns sin suppression

El script `audit.mjs` debe retornar código distinto de 0 cuando existan vulnerabilidades high o critical que NO estén suprimidas (o cuya suppression haya expirado).

**Trazabilidad**: SC-201, SC-203

## REQ-003: Expiración automática de suppressions

Una suppression con `revokedAt` en el pasado debe tratarse como si no existiera — la vulnerabilidad correspondiente causa fallo.

**Trazabilidad**: SC-203

## REQ-004: Camino suave para devDependencies

Las vulnerabilidades high que afectan solo a devDependencies deben emitir WARNING pero no fallar. Las vulnerabilidades critical siempre deben fallar sin importar si son devDependencies.

**Trazabilidad**: SC-204, SC-205

## REQ-005: Integración con CI

El paso de audit en `.github/workflows/ci.yml` debe ejecutar `npm run audit` sin `|| true`, de modo que el gate sea realmente bloqueante.

**Trazabilidad**: SC-207

## REQ-006: Compatibilidad con Makefile

El Makefile (intocable) debe seguir funcionando sin cambios. El target `audit` del Makefile tiene su propio `|| true` que no se modifica.

**Trazabilidad**: SC-206

## REQ-007: Legibilidad en PRs

El archivo de suppressions debe ser legible y revisable en pull requests, con justificaciones claras para cada suppressión.

**Trazabilidad**: SC-202
