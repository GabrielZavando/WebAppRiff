# cleanup-root-seeds Specification

## Purpose
TBD - created by archiving change cleanup-root-seeds. Update Purpose after archive.
## Requirements
### Requirement: Seed files SHALL reside in a dedicated `data/` directory

Los archivos `seed-categorias-subcategorias.json` y `seed-productos-71.json` SHALL residir en `data/` (no en la raíz del monorepo). Deben seguir versionados (trackeados por git).

#### Scenario: SC-301 — Seeds residen en `data/`

- **GIVEN** que los seeds estaban en la raíz del monorepo
- **WHEN** se ejecuta `git mv` a `data/`
- **THEN** `seed-categorias-subcategorias.json` y `seed-productos-71.json` viven en `data/`
- **AND** ambos siguen trackeados (aparecen en `git ls-files` bajo `data/`)

### Requirement: Backend seed loaders SHALL resolve default paths from `data/`

Los 3 loaders de seed (`catalog-seed.loader.ts`, `producto-seed.loader.ts`, `seed-image-map.loader.ts`) SHALL usar constantes `DEFAULT_SEED_FILENAME`/`DEFAULT_SEED_FILE_NAME` con prefijo `data/` para resolver la ruta por defecto. La resolución por caminata ascendente (`resolveSeedPath`) SHALL encontrar `<raíz>/data/<archivo>` al correr desde cualquier cwd dentro del monorepo.

#### Scenario: SC-302 — Loader de catálogo resuelve el seed por defecto desde `data/`

- **GIVEN** `DEFAULT_SEED_FILENAME = 'data/seed-categorias-subcategorias.json'` en `catalog-seed.loader.ts`
- **WHEN** se corre `loadCatalogSeed()` (sin `SEED_FILE_PATH`) desde un cwd dentro del monorepo
- **THEN** encuentra y carga el archivo en `data/` (5 categorías, 23 subcategorías)

#### Scenario: SC-303 — Loader de productos resuelve el seed por defecto desde `data/`

- **GIVEN** `DEFAULT_SEED_FILENAME = 'data/seed-productos-71.json'` en `producto-seed.loader.ts`
- **WHEN** se corre `loadProductoSeed()` (sin `SEED_FILE_PATH`) desde un cwd dentro del monorepo
- **THEN** carga el seed real desde `data/` (70 productos, excluido `prod-054`, `prod-069` con slug de-duplicado)

#### Scenario: SC-304 — Image-map loader resuelve el seed por defecto desde `data/`

- **GIVEN** `DEFAULT_SEED_FILE_NAME = 'data/seed-productos-71.json'` en `seed-image-map.loader.ts`
- **WHEN** se corre `new SeedImageMapLoaderImpl().load()` (sin path)
- **THEN** resuelve y lee `_imagenesPendientesMigracion` desde `data/seed-productos-71.json`

### Requirement: Tests SHALL reference the new `data/` location

El spec `producto-seed.loader.spec.ts` que hardcodea la ruta del seed real SHALL apuntar a `data/seed-productos-71.json`. Los tests existentes de carga del seed real (catalog-spec y producto-spec) SHALL seguir pasando.

#### Scenario: SC-305 — Test del loader real apunta a `data/`

- **GIVEN** `producto-seed.loader.spec.ts` hardcodea la ruta del seed real
- **WHEN** se actualiza a `join(process.cwd(), '..', '..', 'data', 'seed-productos-71.json')`
- **THEN** el test carga el seed real desde `data/` y pasa (70 productos)

### Requirement: Documentation SHALL reflect the new seed location

`docs/seed-catalog.md` SHALL reflejar `data/seed-*.json` como default de `SEED_FILE_PATH` en todas sus referencias.

#### Scenario: SC-308 — Repo sano y sin referencias residuales

- **GIVEN** que se movieron los seeds y borraron residuos
- **WHEN** se ejecuta `bash check-refs.sh`, `bash specboot.sh --ci` y la suite backend
- **THEN** ambos scripts reportan 0 errores y la suite backend pasa
- **AND** `rg "seed-productos-71|seed-categorias-subcategorias"` fuera de `data/` y `docs/` no arroja rutas viejas en código

### Requirement: Framework residues SHALL be removed from repo root

Las 3 carpetas `.specboot-backup-*` y `dist/` vacío SHALL eliminarse de la raíz. `.gitignore` no requiere cambios (ya los cubre).

#### Scenario: SC-306 — Residuos eliminados de la raíz

- **GIVEN** las 3 carpetas `.specboot-backup-*` y `dist/` vacío en la raíz
- **WHEN** se borran
- **THEN** no existen `.specboot-backup-*` ni `dist/` en la raíz

### Requirement: `SEED_FILE_PATH` override SHALL remain functional

La variable de entorno `SEED_FILE_PATH` SHALL seguir funcionando como override explícito, ignorando el default `data/`.

#### Scenario: SC-307 — `SEED_FILE_PATH` explícito sigue funcionando

- **GIVEN** un usuario setea `SEED_FILE_PATH=/ruta/custom.json`
- **WHEN** corre cualquier CLI de seed o migración de imágenes
- **THEN** se usa la ruta explícita (no el default `data/`)

