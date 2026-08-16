# Seed de Catálogo (Categorías y Subcategorías)

Comando CLI idempotente que puebla las colecciones Firestore `categorias` y
`subcategorias` desde un archivo de seed.

## Comando

```bash
# Desde la raíz del workspace backend
npm run seed:catalog
```

Equivalente a:

```bash
nest build && node dist/cli/seed-catalog.js
```

## Variables de entorno

| Variable         | Descripción                                                                 | Default                          |
|------------------|-----------------------------------------------------------------------------|----------------------------------|
| `SEED_FILE_PATH` | Ruta absoluta o relativa (desde `cwd`) al archivo JSON de seed.            | `seed-categorias-subcategorias.json` en la raíz del monorepo (se busca ascendiendo desde `cwd`). |

## Fuente de datos

El archivo de seed (por defecto `seed-categorias-subcategorias.json` en la raíz
del monorepo) define las categorías y subcategorías como objetos keyed por slug:

```json
{
  "categorias": {
    "medicion-de-fluidos": {
      "nombre": "Medición de Fluidos",
      "esDefault": false
    }
  },
  "subcategorias": {
    "medicion-de-fluidos--medidores-electromagneticos": {
      "categoriaId": "medicion-de-fluidos",
      "nombre": "Medidores Electromagnéticos"
    }
  }
}
```

- `slug` es opcional: si se omite se auto-genera desde `nombre` vía `slugify`.
- El `id` del documento en Firestore es **determinista**:
  - Categoría → su `slug`.
  - Subcategoría → `${categoriaId}--${slug}`.
- `categoriaId` de cada subcategoría debe coincidir con la `slug`/`id` de una
  categoría presente en el mismo seed; de lo contrario el loader falla con error
  claro.
- `sin-categoria` se marca con `esDefault: true` y no debe eliminarse.

## Comportamiento idempotente

El seed nunca sobrescribe ni duplica. Por cada entrada:

1. Se consulta `findById(id)`.
2. Si ya existe → se omite (`omitidas++`).
3. Si no existe → se crea con el `id` determinista (`creadas++`).

Re-ejecutar el comando sobre una base ya poblada no genera cambios (no pisa
ediciones manuales posteriores).

## Resultado

El CLI imprime un resumen de conteos:

```
Catalog seeded: 5 categories created, 0 omitted; 23 subcategories created, 0 omitted.
```

## Credenciales

El comando requiere las variables de entorno de Firebase (mismo que el backend):
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Nunca se
loguean secrets.

# Seed de Productos

Comando CLI idempotente que puebla la colección Firestore `productos` desde un
archivo de seed.

## Prerrequisito

Ejecutar primero `npm run seed:catalog` para que las categorías y subcategorías
referenciadas por los productos existan en Firestore. Si falta alguna categoría,
el seed falla con un error claro (vía `ProductoConsistencyService`).

## Comando

```bash
# Desde la raíz del workspace backend
npm run seed:productos
```

Equivalente a:

```bash
nest build && node dist/cli/seed-productos.js
```

## Variables de entorno

| Variable         | Descripción                                                                 | Default                          |
|------------------|-----------------------------------------------------------------------------|----------------------------------|
| `SEED_FILE_PATH` | Ruta absoluta o relativa (desde `cwd`) al archivo JSON de seed de productos. | `seed-productos-71.json` en la raíz del monorepo (se busca ascendiendo desde `cwd`). |

## Fuente de datos

El archivo de seed (por defecto `seed-productos-71.json` en la raíz del monorepo)
define los productos como un objeto `productos` keyed por id determinista:

```json
{
  "productos": {
    "prod-001": {
      "sku": "SKU-1",
      "titulo": "Válvula de Control",
      "slug": "valvula-de-control",
      "precio": { "valor": 100, "visible": true },
      "categoriaId": "medicion-de-fluidos"
    }
  }
}
```

- El `id` del documento en Firestore es **determinista** y coincide con la clave
  del dict (`prod-001`…). Es lo que exige el `_readme` del archivo de seed.
- `slug` es opcional: si se omite se auto-genera desde `titulo` vía `slugify`.
- `categoriaId` es opcional y por defecto es `sin-categoria`.
- `precio.moneda` se **ignora** (el data model fija CLP; no es parte de la entidad).
- `galeria` se siembra como arreglo vacío; se puebla posteriormente con
   `npm run migrate:productos:imagenes` (ver sección siguiente).
- El seed reutiliza las reglas de dominio: unicidad de `sku`/`slug` y
  consistencia categoría/subcategoría.

## Paso previo: subcategoría "Medidores de Nivel"

Como paso previo idempotente, el seed asegura la existencia de la subcategoría
`medicion-de-fluidos--medidores-de-nivel` (activa). La necesita `prod-014` para
publicarse en el futuro; el producto se siembra `publicado=false` hasta confirmación
del cliente.

## Comportamiento idempotente

Igual que el seed de catálogo: por cada producto se consulta `findById(id)`; si
existe se omite, si no se crea con el `id` determinista. Re-ejecutar no pisa
ediciones manuales.

## Resultado

```
Products seeded: 70 created, 0 omitted. Ensured subcategory "medicion-de-fluidos--medidores-de-nivel".
```

Nota: el seed excluye `prod-054` (duplicado no publicado de `prod-050` que
colisiona en slug). El producto `prod-069` se siembra con slug
`medidor-cuenta-litros-flowtech-hil` (producto distinto, SKU `FLO-CLT-HIL`).
Total sembrado: 70 documentos (68 publicados + 2 no publicados: `prod-014`,
`prod-069`). En re-ejecuciones idempotentes el conteo cambia a
`X created, Y omitted`.

# Migración de Imágenes de Producto

Comando CLI que migra las imágenes de producto desde el hosting WordPress anterior
hacia Firebase Storage y puebla `galeria` de cada producto, vinculándolas por su
`id` determinista. Las URLs origen viven en `_imagenesPendientesMigracion` dentro
de `seed-productos-71.json`.

## Comando

```bash
# Desde la raíz del workspace backend
npm run migrate:productos:imagenes
```

Equivalente a:

```bash
nest build && node dist/cli/migrate-imagenes.js
```

## Variables de entorno

| Variable                 | Descripción                                                              | Default                                |
|--------------------------|--------------------------------------------------------------------------|----------------------------------------|
| `SEED_FILE_PATH`         | Ruta al JSON de seed de productos (de donde se lee `_imagenesPendientesMigracion`). | `seed-productos-71.json` en la raíz del monorepo. |
| `MIGRACION_REPORTE_PATH` | Ruta del reporte JSON de salida.                                         | `migracion-imagenes-reporte.json` en `cwd`. |

Requiere las credenciales de Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`), igual que el backend.

## Qué hace

- Por cada `productoId` en `_imagenesPendientesMigracion`:
  - Si el documento no existe en Firestore → se omite (p. ej. `prod-054`, excluido del seed).
  - Si ya tiene `galeria` completa → se omite (idempotencia por completitud).
  - Si no, descarga cada imagen (con reintentos y backoff), la optimiza con `sharp`
    a WebP (ancho máx. 800px, calidad 82), la sube a `productos/{id}/{orden}.webp`
    (pública, cache 1 año) y persiste el arreglo `GaleriaItem[]` vía el repositorio
    de dominio (`IProductRepository.update`).
- Es tolerante a fallos: un error de imagen/producto se registra y continúa; los
  productos con fallos aparecen en `fallidos` del reporte para seguimiento manual.
- Respeta la invariante del data model de máximo 10 imágenes (trunca y advierte).

## Idempotencia y re-ejecución

Seguro de correr varias veces: omite lo ya migrado completamente y completa los
productos parciales en corridas siguientes. El reporte `migracion-imagenes-reporte.json`
detalla `exitosos` / `fallidos` / `omitidos` / `advertencias`.

## Dry-run

```bash
npm run migrate:productos:imagenes -- --dry-run
```

No descarga ni escribe: reporta lo que migraría. Útil para validar el mapa antes
de tocar Storage/Firestore.

> Nota: el comando no altera `docs/api-spec.yml` (no hay cambio de contrato HTTP).


