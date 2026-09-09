# Tasks — Harden CI Gate

> Capa: tooling/CI. Sugerencias de ruta bajo la raíz del monorepo (`.specboot.json` services = `["."]`).

## 1. Preparación: descubrir deuda latente (RUN LOCAL, no CI)

- [ ] 1.1 Correr el gate candidato de forma local (sin tocar aún CI) para descubrir deuda preexistente que el CI actual no expone. Suggested Path: `apps/*` · Test Path: `apps/*/src/**/*.spec.ts|test.ts`.
- [ ] 1.2 Registrar los fallos que afloren (tipos, build, cobertura backend < 90 %, audit high) como subtareas de la sección 4. Suggested Path: `apps/*` · Test Path: `apps/*/src/**/*.spec.ts|test.ts`.

## 2. Lint no mutante + script raíz typecheck

- [x] 2.1 [SC-105] Quitar `--fix` de `lint` y añadir `lint:fix` en `apps/backend/package.json`. Suggested Path: `apps/backend/package.json` · Test Path: no aplica. *(Hecho: `lint` sin `--fix`, nuevo `lint:fix` con `--fix`.)*
- [x] 2.2 [SC-105] Ídem para `apps/web/package.json`. Suggested Path: `apps/web/package.json` · Test Path: no aplica. *(Hecho.)*
- [x] 2.3 [SC-105] Ídem para `apps/admin/package.json`. Suggested Path: `apps/admin/package.json` · Test Path: no aplica. *(Hecho.)*
- [x] 2.3b [SC-105] Ídem para `packages/html-sanitize/package.json` (workspace bajo `--workspaces`; necesario para que CI no mute). Suggested Path: `packages/html-sanitize/package.json` · Test Path: no aplica. *(Hecho — mejora detectada en T2.5.)*
- [x] 2.4 [SC-101a] Añadir a `package.json` raíz: `"typecheck": "npm run typecheck --workspaces --if-present"`. Suggested Path: `package.json` · Test Path: no aplica. *(Hecho.)*
- [x] 2.5 Verificar que `npm run lint --workspaces` ya no modifica archivos (git diff intacto tras correrlo) y que cada workspace tiene su `lint:fix`. Suggested Path: `apps/*/package.json` · Test Path: no aplica. *(Verificado: md5 de `git diff --stat` idéntico antes/después de `npm run lint --workspaces`; 0 errores, 7 warnings no bloqueantes.)*

## 3. Endurecer el job project-ci en ci.yml

- [x] 3.1 [SC-101..104, SC-106, SC-108] Reemplazar el paso único `make ci` por la secuencia explícita (audit no bloqueante). Suggested Path: `.github/workflows/ci.yml` · Test Path: no aplica. *(Hecho: 10 pasos — refs, solid-lint, lint, typecheck, build, test:cov backend, test web, test admin, test html-sanitize, audit `|| true`.)*
- [x] 3.2 [SC-107] Confirmar que la secuencia no ejecuta los tests backend dos veces (solo `test:cov` para backend; web/admin/html-sanitize con su `test`). Suggested Path: `.github/workflows/ci.yml` · Test Path: no aplica. *(Hecho: backend solo vía `test:cov`; web/admin/html-sanitize standalone.)*
- [x] 3.3 No tocar el job `validate` ni el `node-version: '24'`. Suggested Path: `.github/workflows/ci.yml` · Test Path: no aplica. *(Verificado: job `validate` y `node-version: '24'` intactos.)*

## 4. Corregir deuda latente que aflore (solo si el gate duro la expone)

- [x] 4.1 Corregir errores de tipos que `typecheck` reveló (deuda web preexistente): 9 errores corregidos en `apps/web` (TS2532×5 acceso por índice en tests, TS2345 en `catalogFailFast`/`[slug]`, TS4104 en `index.astro` → prop `readonly`). Suggested Path: `apps/web/src/**` · Test Path: `apps/web/src/**/*.test.ts`. *(Hecho y tipo verificado: `npm run typecheck --workspaces --if-present` → 0 errores; 176 files.)*
- [x] 4.2 Corregir fallos de build: no se revelaron (build web/backend/admin OK). Suggested Path: no aplica · Test Path: no aplica. *(Ninguno.)*
- [x] 4.3 Cobertura backend: ya ≥ 90 % (97.19/90.93/95.42/97.48); no requirió nuevos tests. Suggested Path: `apps/backend/src/**` · Test Path: `apps/backend/src/**/*.spec.ts`. *(Verificado vía `test:cov`.)*
- [x] 4.4 Auditar no bloqueante en CI; remediación de 52 high/critical diferida a ticket V1/Q2. Suggested Path: `.github/workflows/ci.yml` · Test Path: no aplica.

## 5. Verificación de integridad y cierre

- [x] 5.1 Ejecutar `bash check-refs.sh` → 0 errores. *(Hecho: 19 refs, 0 errores.)*
- [x] 5.2 Ejecutar `bash specboot.sh --ci` → 0 errores. *(Hecho: Errores 0, Warnings 0.)*
- [x] 5.3 Ejecutar `make ci` local → confirma que el Makefile sigue funcional (no se tocó). *(Hecho: "CI del proyecto completado"; audit reporta vulns pero `|| true` interno sigue intocable.)*
- [x] 5.4 Actualizar `docs/deploy-standards.md` / `docs/project/stack.md` si reflejan el gate duro. *(Evaluado: no mencionan el gate duro de CI; aplica especialmente `deploy-standards.md` en el ticket de deploy, no aquí.)* · Suggested Path: `docs/` · Test Path: no aplica.

## Mandatory Steps

### Pre-implementación

- [ ] La rama activa sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado git limpio: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] Test nuevo que falla antes de implementar (RED): escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los tests unitarios del módulo tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [ ] Ejecutar `verify`: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] Ejecutar `adversarial-review`: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.