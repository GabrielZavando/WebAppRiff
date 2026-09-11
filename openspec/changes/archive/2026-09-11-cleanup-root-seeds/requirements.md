# Requirements — cleanup-root-seeds

## R-301: Seeds en directorio dedicado

Los archivos `seed-categorias-subcategorias.json` y `seed-productos-71.json` deben residir en `data/` (no en la raíz del monorepo). Deben seguir versionados (trackeados por git).

Traceability: SC-301

## R-302: Loaders backend resuelven seeds desde `data/` por defecto

Los 3 loaders de seed (`catalog-seed.loader.ts`, `producto-seed.loader.ts`, `seed-image-map.loader.ts`) deben usar constantes `DEFAULT_SEED_FILENAME`/`DEFAULT_SEED_FILE_NAME` con prefijo `data/` para resolver la ruta por defecto. La resolución por caminata ascendente (`resolveSeedPath`) debe encontrar `<raíz>/data/<archivo>` al correr desde cualquier cwd dentro del monorepo.

Traceability: SC-302, SC-303, SC-304

## R-303: Tests actualizados

El spec `producto-seed.loader.spec.ts` que hardcodea la ruta del seed real debe apuntar a `data/seed-productos-71.json`. Los tests existentes de carga del seed real (catalog-spec y producto-spec) deben seguir pasando.

Traceability: SC-305

## R-304: Documentación sincronizada

`docs/seed-catalog.md` debe reflejar `data/seed-*.json` como default de `SEED_FILE_PATH` en todas sus referencias (líneas 23, 27, 109, 113, 190).

Traceability: SC-308

## R-305: Residuos eliminados

Las 3 carpetas `.specboot-backup-*` y `dist/` vacío deben eliminarse de la raíz. `.gitignore` no requiere cambios (ya los cubre).

Traceability: SC-306

## R-306: `SEED_FILE_PATH` override preservado

La variable de entorno `SEED_FILE_PATH` debe seguir funcionando como override explícito, ignorando el default `data/`.

Traceability: SC-307

## R-307: Repo verificable

Tras los cambios, `check-refs.sh`, `specboot.sh --ci` y la suite backend deben pasar con 0 errores. No deben quedar referencias residuales a rutas viejas en código fuente.

Traceability: SC-308
