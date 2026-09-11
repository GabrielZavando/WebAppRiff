# Tasks — cleanup-root-seeds

## Task 1: Mover seeds a `data/`

**Priority**: high
**Layer**: infrastructure
**Estimate**: XS

### Subtasks

- [x] 1.1 Crear directorio `data/`
- [x] 1.2 `git mv seed-categorias-subcategorias.json data/seed-categorias-subcategorias.json`
- [x] 1.3 `git mv seed-productos-71.json data/seed-productos-71.json`
- [x] 1.4 Verificar que ambos archivos aparecen en `git ls-files` bajo `data/`

**Suggested Path**: `data/`
**Test Path**: no aplica (validación con `git ls-files`)

## Task 2: Actualizar constantes `DEFAULT_SEED_FILENAME` en loaders

**Priority**: high
**Layer**: application
**Estimate**: XS

### Subtasks

- [x] 2.1 [SC-302] Actualizar `apps/backend/src/cli/seed/catalog-seed.loader.ts:28` → `'data/seed-categorias-subcategorias.json'`
- [x] 2.2 [SC-303] Actualizar `apps/backend/src/cli/seed/producto-seed.loader.ts:14` → `'data/seed-productos-71.json'`
- [x] 2.3 [SC-304] Actualizar `apps/backend/src/cli/migrate-imagenes/seed-image-map.loader.ts:5` → `'data/seed-productos-71.json'`

**Suggested Path**: `apps/backend/src/cli/seed/catalog-seed.loader.ts`, `apps/backend/src/cli/seed/producto-seed.loader.ts`, `apps/backend/src/cli/migrate-imagenes/seed-image-map.loader.ts`
**Test Path**: `apps/backend/src/cli/seed/catalog-seed.loader.spec.ts`, `apps/backend/src/cli/seed/producto-seed.loader.spec.ts`, `apps/backend/src/cli/migrate-imagenes/seed-image-map.loader.spec.ts`

## Task 3: Actualizar ruta hardcodeada en test del loader de productos

**Priority**: high
**Layer**: application (test)
**Estimate**: XS

### Subtasks

- [x] 3.1 [SC-305] Actualizar `apps/backend/src/cli/seed/producto-seed.loader.spec.ts:121` → `join(process.cwd(), '..', '..', 'data', 'seed-productos-71.json')`

**Suggested Path**: `apps/backend/src/cli/seed/producto-seed.loader.spec.ts`
**Test Path**: no aplica (el test ES la validación)

## Task 4: Actualizar `docs/seed-catalog.md`

**Priority**: medium
**Layer**: infrastructure (docs)
**Estimate**: XS

### Subtasks

- [x] 4.1 Actualizar línea 23: default `SEED_FILE_PATH` → `data/seed-categorias-subcategorias.json`
- [x] 4.2 Actualizar líneas 27, 109, 113, 190: referencias a `seed-*.json` en raíz → `data/seed-*.json`

**Suggested Path**: `docs/seed-catalog.md`
**Test Path**: no aplica (validación con `grep` residual)

## Task 5: Eliminar residuos de la raíz

**Priority**: medium
**Layer**: infrastructure
**Estimate**: XS

### Subtasks

- [x] 5.1 [SC-306] `rm -rf .specboot-backup-20260902113743 .specboot-backup-20260907130417 .specboot-backup-20260907131022`
- [x] 5.2 [SC-306] `rmdir dist` (vacío, gitignored)
- [x] 5.3 Verificar que `.gitignore` no requiere cambios (ya cubre `dist/` y `.specboot-backup-*`)

**Suggested Path**: no aplica (carpetas eliminadas)
**Test Path**: no aplica (validación con `ls` de la raíz)

## Task 6: Verificar repo sano

**Priority**: high
**Layer**: infrastructure
**Estimate**: XS

### Subtasks

- [x] 6.1 [SC-308] Ejecutar `npm run test --workspace=apps/backend` → verde
- [x] 6.2 [SC-308] Ejecutar `bash check-refs.sh` → 0 errores
- [x] 6.3 [SC-308] Ejecutar `bash specboot.sh --ci` → 0 errores
- [x] 6.4 [SC-308] Ejecutar `rg "seed-productos-71|seed-categorias-subcategorias" --glob '!data/**' --glob '!docs/**'` → sin rutas viejas en código
- [x] 6.5 [SC-307] Verificar que `SEED_FILE_PATH` override sigue funcionando (test existente del loader)

**Suggested Path**: no aplica
**Test Path**: no aplica (validación transversal)

---

## Mandatory Steps

> **Rol de este documento**: es la **fuente única de verdad** del checklist
> obligatorio de implementación del ciclo SDD. El skill `plan-change` **inyecta
> su contenido** como sección `## Mandatory Steps` en todo `tasks.md` generado,
> leyéndolo en el momento de generación, de modo que la checklist viaja dentro
> del artefacto que el agente `build` ejecuta. Editar aquí actualiza todo
> `tasks.md` generado después; no duplicar esta lista dentro de skills ni
> agentes.

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de
implementación ejecutada vía `/apply`, tanto en el propio framework Specboot
(dogfooding) como en cualquier proyecto consumidor.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
