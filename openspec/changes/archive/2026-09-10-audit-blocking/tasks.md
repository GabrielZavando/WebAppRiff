# Tasks — Audit Blocking

> Capa: tooling/CI. Sugerencias de ruta bajo la raíz del monorepo.
> Arquitectura: script Node.js que parsea `npm audit --json` y aplica suppressions.

## 1. Crear archivo de suppressions

- [x] 1.1 [SC-202] Crear `npm-audit-suppressions.json` en la raíz del monorepo con estructura `{ suppressions: [{ id, reason, revokedAt? }] }`. Suggested Path: `npm-audit-suppressions.json` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 1.2 [SC-202] Poblar con suppressions iniciales para las 52 vulns high/critical preexistentes (extraídas de `npm audit --json`). Cada suppression debe tener `reason` claro y `revokedAt: null` (sin expiración automática). Suggested Path: `npm-audit-suppressions.json` · Test Path: `scripts/__tests__/audit.test.mjs`.

## 2. Implementar script audit.mjs

- [x] 2.1 [SC-201] Crear `scripts/audit.mjs` que ejecute `npm audit --audit-level=high --json` y parsee la salida. El script debe retornar 0 si no hay vulns high/critical, y distinto de 0 si las hay. Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 2.2 [SC-202] Añadir lógica de suppressions: leer `npm-audit-suppressions.json`, filtrar vulns suprimidas (sin `revokedAt` o `revokedAt` en el futuro), y excluir del conteo de fallo. Imprimir mensaje informativo por cada suppression aplicada. Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 2.3 [SC-203] Añadir lógica de expiración: si una suppression tiene `revokedAt` en el pasado, no aplicar la suppression (tratarla como inexistente). Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 2.4 [SC-204] Añadir lógica de camino suave para devDependencies: vulns high en devDependencies → WARNING (no fallo). Vulns high en dependencies → fallo. Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 2.5 [SC-205] Añadir regla de critical: vulns critical SIEMPRE causan fallo, sin importar si son devDependencies o dependencies. Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 2.6 [SC-201] Añadir output formateado: resumen de vulns encontradas, suprimidas, warnings, y resultado final (PASS/FAIL). Suggested Path: `scripts/audit.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.

## 3. Tests del script audit

- [x] 3.1 [SC-201] Escribir test que verifica que el script retorna 0 cuando no hay vulns high/critical (mock de `npm audit --json` vacío). Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.2 [SC-201] Escribir test que verifica que el script retorna distinto de 0 cuando hay vuln high sin suppression. Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.3 [SC-202] Escribir test que verifica que vulns suprimidas no causan fallo. Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.4 [SC-203] Escribir test que verifica que suppressions expiradas NO se aplican (vuln causa fallo). Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.5 [SC-204] Escribir test que verifica que vuln high en devDependencies emite WARNING pero no falla. Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.6 [SC-205] Escribir test que verifica que vuln critical en devDependencies SÍ falla. Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.
- [x] 3.7 [SC-202] Escribir test que verifica manejo de archivo suppressions inexistente (audit funciona sin suppressions). Suggested Path: `scripts/__tests__/audit.test.mjs` · Test Path: `scripts/__tests__/audit.test.mjs`.

## 4. Integrar con package.json y CI

- [x] 4.1 [SC-207] Añadir script `"audit": "node scripts/audit.mjs"` al `package.json` raíz. Suggested Path: `package.json` · Test Path: no aplica.
- [x] 4.2 [SC-207] Reemplazar el paso `npm audit --audit-level=high || true` por `npm run audit` en `.github/workflows/ci.yml` (job `project-ci`). Suggested Path: `.github/workflows/ci.yml` · Test Path: no aplica.
- [x] 4.3 Verificar que `make ci` sigue funcionando (Makefile intacto, `|| true` interno del target `audit` no se modifica). Suggested Path: no aplica · Test Path: no aplica.

## 5. Verificación de integridad y cierre

- [x] 5.1 Ejecutar `bash check-refs.sh` → 0 errores. Suggested Path: no aplica · Test Path: no aplica.
- [x] 5.2 Ejecutar `bash specboot.sh --ci` → 0 errores. Suggested Path: no aplica · Test Path: no aplica.
- [x] 5.3 Ejecutar el gate completo localmente (pasos de ci.yml) y confirmar que audit falla con las vulns suprimidas correctamente. Suggested Path: no aplica · Test Path: no aplica.
- [x] 5.4 Verificar que `npm run audit` funciona localmente y muestra el output esperado. Suggested Path: no aplica · Test Path: no aplica.

## Mandatory Steps

### Pre-implementación

- [x] La rama activa sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [x] Estado git limpio: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] Test nuevo que falla antes de implementar (RED): escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [x] Ejecutar los tests unitarios del módulo tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [x] Ejecutar `verify`: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [x] Ejecutar `adversarial-review`: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
