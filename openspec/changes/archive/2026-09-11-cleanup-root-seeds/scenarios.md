# Scenarios — cleanup-root-seeds

## SC-301: Los seeds residen en `data/`

```gherkin
Given que los seeds estaban en la raíz del monorepo
When se ejecuta `git mv` a `data/`
Then `seed-categorias-subcategorias.json` y `seed-productos-71.json` viven en `data/`
And ambos siguen trackeados (aparecen en `git ls-files` bajo `data/`)
```

## SC-302: El loader de catálogo resuelve el seed por defecto desde `data/`

```gherkin
Given `DEFAULT_SEED_FILENAME = 'data/seed-categorias-subcategorias.json'` en `catalog-seed.loader.ts`
When se corre `loadCatalogSeed()` (sin `SEED_FILE_PATH`) desde un cwd dentro del monorepo
Then encuentra y carga el archivo en `data/` (5 categorías, 23 subcategorías)
```

## SC-303: El loader de productos resuelve el seed por defecto desde `data/`

```gherkin
Given `DEFAULT_SEED_FILENAME = 'data/seed-productos-71.json'` en `producto-seed.loader.ts`
When se corre `loadProductoSeed()` (sin `SEED_FILE_PATH`) desde un cwd dentro del monorepo
Then carga el seed real desde `data/` (70 productos, excluido `prod-054`, `prod-069` con slug de-duplicado)
```

## SC-304: El image-map loader resuelve el seed por defecto desde `data/`

```gherkin
Given `DEFAULT_SEED_FILE_NAME = 'data/seed-productos-71.json'` en `seed-image-map.loader.ts`
When se corre `new SeedImageMapLoaderImpl().load()` (sin path)
Then resuelve y lee `_imagenesPendientesMigracion` desde `data/seed-productos-71.json`
```

## SC-305: El test del loader real apunta a `data/`

```gherkin
Given `producto-seed.loader.spec.ts` hardcodea la ruta del seed real
When se actualiza a `join(process.cwd(), '..', '..', 'data', 'seed-productos-71.json')`
Then el test carga el seed real desde `data/` y pasa (70 productos)
```

## SC-306: Se eliminan los residuos de la raíz

```gherkin
Given las 3 carpetas `.specboot-backup-*` y `dist/` vacío en la raíz
When se borran
Then no existen `.specboot-backup-*` ni `dist/` en la raíz
```

## SC-307: `SEED_FILE_PATH` explícito sigue funcionando

```gherkin
Given un usuario setea `SEED_FILE_PATH=/ruta/custom.json`
When corre cualquier CLI de seed o migración de imágenes
Then se usa la ruta explícita (no el default `data/`)
```

## SC-308: Repo sano y sin referencias residuales

```gherkin
Given que se movieron los seeds y borraron residuos
When se ejecuta `bash check-refs.sh`, `bash specboot.sh --ci` y la suite backend
Then ambos scripts reportan 0 errores y la suite backend pasa
And `rg "seed-productos-71|seed-categorias-subcategorias"` fuera de `data/` y `docs/` no arroja rutas viejas en código
```
