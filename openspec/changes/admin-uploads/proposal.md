# Propuesta: admin-uploads

## Why

El formulario de producto del panel admin edita la galería de imágenes y la ficha técnica
**como data** (inputs de texto para `url` / `storagePath` / `nombreArchivo`) porque el backend
no expone ningún endpoint HTTP de subida de archivos. Esto obliga al usuario a subir archivos
manualmente por la consola de Firebase Storage y copiar URLs, lo cual es inoperable.

Es el último bloque grande del MVP antes de la página de marcas: los changes
`2026-10-15-admin-panel-content` y `2026-10-17-admin-panel-operations` difirieron
explícitamente el alcance hacia este dominio pendiente (`admin-uploads`).

## What Changes

- Nuevo dominio `uploads` en el backend (NestJS BFF) con dos rutas multipart explícitas:
  - `POST /api/v1/uploads/images` — imágenes `.jpg | .jpeg | .png | .webp` (se normalizan a webp con `sharp`), límite 5 MB.
  - `POST /api/v1/uploads/tech-sheet` — PDF (`application/pdf` con firma `%PDF` verificada), límite 10 MB.
- Ambas rutas responden con envelope estándar `{ data: { url, storagePath } }`; en modo edición el hash/uuid sube a `productos/<productoId>/tmp-<uuid>/`, en modo creación a `productos/tmp-<uuid>/`.
- Rol de acceso: `superadmin | admin | editor` (el **editor** puede subir archivos, en línea
  con la edición de productos).
- Brecha de infraestructura (manual, sin código): regla de ciclo de vida en el bucket de
  Google Cloud Storage que borra objetos en `productos/*/tmp-*` (y `productos/tmp-*`)
  con más de **48 horas** — mitigación de archivos huérfanos (subida sin guardar producto).
  de Google Cloud Storage que borra objetos en `productos/*/tmp-*` (y `productos/tmp-*`)
  con más de **48 horas** — mitigación de archivos huérfanos (subida sin guardar producto).
- Tarea stretch (fuera del bloqueo del change): `ProductoWriteService` elimina del bucket
  los objetos de galería/ficha reemplazados o eliminados al hacer `PATCH`.
- Frontend admin (feature `catalog`):
  - `ApiClientService` gana una variante `postFormData()` (multipart, sin `Content-Type` manual; el browser pone el boundary; `authInterceptor` ya adjunta el Bearer).
  - Nuevo componente de subida (file input estilizado / drag-and-drop nativo, Tailwind, sin librerías externas): ítems de galería (`accept=.jpg,.jpeg,.png,.webp` con preview de miniatura) y ficha técnica (`accept=.pdf`, preview por nombre de archivo).
  - **Solo upload**: los inputs manuales de `url`/`storagePath` se eliminan; se rellenan
    automáticamente tras el 201 del upload. El payload JSON de producto queda intacto.
- Contract API documentado en `docs/api/api-spec.yml`.

## Capabilities

### New Capabilities
- `admin-uploads`: endpoint HTTP de subida de archivos a Firebase Storage (imágenes de galería
  y fichas técnicas PDF) con validación de MIME real (magic bytes) y de tamaño, roles
  autorizados, manejo de errores con envelope estándar y paths de Storage con prefix `tmp-`
  para la limpieza por lifecycle.

### Modified Capabilities
- `admin-catalog-crud`: el formulario de producto deja de editar galería y ficha técnica
  como data (URL/rutas de texto) y pasa a subir archivos vía los nuevos endpoints de
  `admin-uploads`, autocompletando `url`/`storagePath`/`alt`/`nombreArchivo`. El escenario
  "no existe ningún input de archivo" se invierte.

## Impact

- **Backend**: nuevo módulo `apps/backend/src/uploads/` (controller, DTO de respuesta, puerto
  `FileStoragePort` en `apps/backend/src/infrastructure/storage/` con adapter `FirebaseFileStorageAdapter`).
  `sharp@0.35.3` ya instalado; `multer@2.4.0` ya viene con `@nestjs/platform-express` — sin
  dependencias nuevas. `FirebaseModule` ya inicializa `storageBucket`.
- **Frontend**: `apps/admin` (`producto-form-page.component.*`, `api-client.service.ts`,
  nuevo componente `upload` en `shared/components/` o feature `catalog`, actualización de
  tests — hoy hay un test que requiere la **ausencia** de `<input type="file">`).
- **Infra**: regla de ciclo de vida en el bucket de staging (y de producción cuando exista) —
  cambio manual documentado en `docs/runbooks/backend-staging-cloud-run.md`.
- **Sin impacto**: payload JSON de `POST/PUT/PATCH /products` (tipos `GaleriaItem` y
  `FichaTecnica` del dominio ya modelan `url` + `storagePath`), no hay data migration en
  Firestore, no hay nada que des-instalar (`@angular/fire` nunca existió).
