## Why

La colección `productos` en Firestore está vacía. El cliente entregó `seed-productos-71.json` con 71 productos clasificados con confianza ALTA (de 89 totales; los 18 restantes quedan pendientes de confirmación y fuera de este archivo). Se necesita poblar el catálogo para staging/producción de forma reproducible y sin duplicar ni pisar ediciones manuales. El proyecto ya tiene un mecanismo idempotente equivalente para categorías/subcategorías (`seed:catalog`, archivado), pero no para productos.

## What Changes

- Se añade el comando operativo `npm run seed:productos` que lee `seed-productos-71.json` (override vía `SEED_FILE_PATH`, default raíz del monorepo) y crea 70 documentos de `productos` (excluye `prod-054`, duplicado no publicado de `prod-050` que colisiona en slug).
- Los documentos se crean con **IDs deterministas** iguales a la clave del dict del seed (`prod-001`…`prod-071`), según exige el `_readme` del archivo.
- El seed es **idempotente**: si un documento con el ID ya existe, se omite (no se sobrescribe ni duplica).
- Se reutilizan las reglas de dominio existentes (unicidad SKU/slug y consistencia categoría/subcategoría) antes de escribir, vía los puertos de integridad/consistencia ya implementados.
- Como paso previo idempotente, el seed crea la subcategoría `medicion-de-fluidos--medidores-de-nivel` (activa), que hoy no existe y es requerida para publicar `prod-014`.
- Se descarta el campo `precio.moneda` (no está en el data model ni en los DTO); `galeria` se siembra vacía (la migración de imágenes queda en un ticket aparte).
- Se siembra fiel al archivo: 68 `publicado=true` / 2 `publicado=false` (`prod-014`, `prod-069`); se excluye `prod-054` (duplicado exacto no publicado de `prod-050`, misma slug). `prod-069` conserva slug único `medidor-cuenta-litros-flowtech-hil` (producto distinto, SKU `FLO-CLT-HIL`). Los 40 SKU temporales `SKU-PEND-xxx` se siembran tal cual.

## Capabilities

### New Capabilities
- `backend-seed-productos`: comando CLI idempotente que puebla la colección `productos` desde `seed-productos-71.json` con IDs deterministas, reutilizando las reglas de integridad de dominio y creando la subcategoría `Medidores de Nivel` como prerrequisito.

### Modified Capabilities
- `backend-productos`: el contrato del repository gana un `id` explícito opcional en `create` (para soportar IDs deterministas desde el seed), sin cambiar los DTOs HTTP ni el contrato público.

## Impact

- **Código**: nuevo CLI `apps/backend/src/cli/seed-productos.ts` + módulo + `SeedProductosUseCase` + `ProductoSeedLoader` + provider `EnsureSeedSubcategorias`; extensión de `ProductoInput` (`id?`) y `ProductoRepository.create` en `apps/backend/src/productos/`.
- **API**: sin cambios en `docs/api-spec.yml` (el seed usa repositories/puertos de dominio, no la API HTTP).
- **Dependencias**: ninguna nueva. Firebase Admin SDK ya presente.
- **Datos**: requiere que `seed:catalog` se haya ejecutado primero (categorías/subcategorías presentes) para que las referencias de producto resuelvan.
- **Fuera de alcance**: migración de imágenes a Firebase Storage, los 18 productos pendientes, y cualquier cambio a endpoints existentes.
