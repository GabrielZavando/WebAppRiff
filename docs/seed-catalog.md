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
