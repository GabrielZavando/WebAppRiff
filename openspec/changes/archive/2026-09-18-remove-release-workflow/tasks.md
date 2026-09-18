# Tasks: remove-release-workflow

### T1 — Eliminar release.yml y verificar gates
- **Priority**: low
- **Layer**: infrastructure (CI/CD)
- **Estimate**: XS
- **Requirement**: R1, R2, R3
- **Scenarios**: SC-001, SC-002, SC-003
- **Suggested Path**: .github/workflows/release.yml (eliminación)
- **Test Path**: no aplica (verificación con bash check-refs.sh + bash specboot.sh --ci + inspección de Actions tras merge)
- Subtasks:
  - [x] 1. `git rm .github/workflows/release.yml`
  - [x] 2. Correr `bash check-refs.sh` y `bash specboot.sh --ci` (0 errores) confirmando que no había referencias vivas
  - [x] 3. Confirmar que `ci.yml` y `deploy.yml` no cambian (git diff vacío para esos archivos)

Dependencias: ninguna.

## Mandatory Steps

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de implementación ejecutada vía `/apply`.

### Pre-implementación

- [ ] La **rama activa** sigue la convención vigente del proyecto (`feature/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit`: sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
