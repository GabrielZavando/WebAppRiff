# Design: admin-uploads

## Context

El backend (NestJS BFF) no expone ningún endpoint HTTP de subida de archivos. El formulario
de producto del panel admin (`/products/new`, `/products/:id`) edita galería y ficha técnica
como data (`url`/`storagePath` de texto). El CLI de migración de imágenes
(`apps/backend/src/cli/migrate-imagenes/`) ya resolvió la subida a Firebase Storage con el
patrón puerto/adapter (`ImageStoragePort` + `FirebaseStorageUploader`), pero vive dentro del
dominio del CLI, hardcodea `contentType: 'image/webp'` y es específico de la migración.

Estado relevante verificado:

- `@nestjs/platform-express@11.2.7` ya trae `multer@2.4.0` — no se agregan dependencias.
- `sharp@0.35.3` ya está en el backend (usado por la migración para normalizar a webp).
- `FirebaseModule` (global) inicializa la app con `storageBucket` desde
  `FIREBASE_STORAGE_BUCKET` (`firebase.module.ts:25`).
- La SA de runtime de Cloud Run ya tiene `roles/storage.objectAdmin`
  (`docs/deploy-standards.md:13`, runbook `backend-staging-cloud-run.md:48-63`) →
  escritura confirmada operativamente (la migración subió y publicó objetos con esa identidad).
- El dominio de producto ya modela `GaleriaItem{url, storagePath, alt, orden}` y
  `FichaTecnica{url, storagePath, nombreArchivo}` (`producto.entity.ts`) — el payload JSON
  de producto no cambia.
- El admin habla con el backend vía `ApiClientService` (envelope `{data, error, meta}`) con
  `authInterceptor` que adjunta Bearer. No existe `@angular/fire` (SDK `firebase` solo para Auth).

Stakeholders: admins/editores de catálogo (usuarios del formulario), cliente Riff, agencia
(implantación), infra GCP/Firestore.

## Goals / Non-Goals

**Goals:**

- Endpoint HTTP de subida de imágenes (galería) y PDF (ficha técnica) en el BFF, con
  validación real de tipo y tamaño, roles correctos y envelope estándar.
- Formulario de producto **solo upload**: cero inputs de texto para `url`/`storagePath`.
- Estrategia de huérfanos sin código de backend: carpeta `tmp-<uuid>` + lifecycle rule >48h.
- Sin `@angular/fire`, sin bucket CORS, sin signed URLs: subida siempre a través del BFF.

**Non-Goals:**

- Signed URLs directas a Storage o subida del browser al bucket (counter8: exige CORS,
  keys o federación del bucket, y otra UX).
- Imágenes de categorías, subcategorías o futuras marcas (el endpoint queda genérico para reuso).
- Optimización agresiva (redimensionado, generación de thumbnails responsive).
- Borrado server-side de objetos reemplazados al `PATCH` del producto (task **stretch**,
  no bloquea el cierre del change).
- Job programado de limpieza (Cloud Scheduler) — lo cubre la lifecycle rule.
- Data migration de URLs de productos ya migrados por el CLI.

## Decisions

### D1 — Dos rutas multipart explícitas: `POST /uploads/images` y `POST /uploads/tech-sheet`

Decisión aprobada por el usuario (aclarando una ambigüedad de la propuesta inicial).
Alternativas: **(a)** un único `POST /uploads` con campo `kind=image|techSheet` — un solo
endpoint pero validación bifurcada en runtime y un DTO/multipart polimórfico; **(b)** rutas
anidadas `POST /products/:id/images` — solo cubre edición (en modo create el producto aún no
existe) y acopla uploads al dominio de productos; **(c)** signed URLs — descartada (ver Non-Goals).

Las rutas disjuntas dan: límites independientes de tamaño con una sola configuración
declarativa cada una (`FileInterceptor('file', { limits, fileFilter })`), validación
por ruta sin condicionales, contract OpenAPI limpio y reuso futuro (marcas las usaría tal cual).

### D2 — Subida primero, JSON después (uploads + producto desacoplados)

Flujo: el formulario sube cada archivo en cuanto el usuario lo elige (`POST /uploads/...`
→ `201 {url, storagePath}` autocompleta campos ocultos) y el guardado del producto sigue
siendo el JSON `POST/PATCH /products` de hoy.
Alternativa: multipart adjunto al `POST/PATCH` de productos — rompe los DTOs JSON de
producto, mezcla validación de negocio con la de archivos, impediría reusar el endpoint y
resendería el payload completo en cada guardado. Rechazada.
Coste conocido aprobado: si el usuario sube y no guarda, hay huérfanos — resuelto por D5.

### D3 — Normalización de imágenes a webp en el backend (consistente con la migración)

`image/jpeg` y `image/png` se convierten a webp con `sharp` antes de subir (el catálogo
público ya sirve webp; una imagen webp sube tal cual), y el PDF sube sin transformación
alguna. La normalización mantiene coherencia con `migrate:productos:imagenes`, reduce peso
en Storage/CDN y unifica el contentType. Coste: CPU en Cloud Run (fotos de catálogo
pequeñas, aceptable; el límite de 5 MB acota el coste).
Alternativa: subir tal cual el MIME declarado — menos CPU, pero impone jpg/png pesados al
CDN y duplica formatos en el bucket.

### D4 — Puerto `FileStoragePort` compartido en `infrastructure/storage/`, sin tocar el CLI

Nuevo puerto `FileStoragePort { upload(buffer, storagePath, contentType): Promise<string> }`
+ `FirebaseFileStorageAdapter` en `apps/backend/src/infrastructure/storage/` que reusa
`FIREBASE_APP` (token del `FirebaseModule` global) y replica `file.save` + `makePublic` + URL
pública. SRP/ISP: ≤5 métodos, token `FILE_STORAGE_PORT` inyectado en el controller/service
de uploads. El adapter del CLI (`FirebaseStorageUploader`) queda intacto: no se refactoriza
en este change para no introducir regresión sobre un flujo ya en producción (migración);
la duplicación de ~10 líneas es deliberada y se documenta como candidata a unificación
posterior.
Alternativas: extender la firma de `ImageStoragePort` y moverla a `infrastructure/` —
acopla el change al dominio del CLI de migración (más riesgo de regresión); exportar el
puerto del CLI — el módulo de migración no es un sitio compartido semánticamente.

### D5 — Huérfanos: path único `productos/tmp-<uuid>/...` + lifecycle rule del bucket >48h

Mecanismo aprobado por el usuario (enmendado tras el veto del 2026-10-17):
1. Todo objeto subido por HTTP vive bajo un directorio `tmp-<uuid>` con el path único
   `productos/tmp-<uuid>/nombre.webp` (o `.pdf`), en creación y en edición: el `productoId`
   **no** participa en el path. Razón de la enmienda: GCS `matchesPrefix` no soporta
   wildcards, así que el diseño original `productos/<id>/tmp-<uuid>/` era imposible de
   matchear con una regla genérica (solo un prefijo por producto); además, un prefijo
   `productos/` enterero con `age > 48h` habría borra de imágenes finales migradas. Con el
   path único, el prefijo literal `productos/tmp-` matchea el 100% de los huérfanos y ningún
   objeto final.
2. **Regla de ciclo de vida de GCS** sobre el bucket `riff-catalogo-staging.firebasestorage.app`:
   acción `Delete` con `age: 48` y `matchesPrefix: ["productos/tmp-"]` — el huérfano caduca
   solo, sin código ni Scheduler. El match por edad aplica sobre el creation time del objeto;
   los objetos del catálogo migrado (sin `tmp-` en su path) no matchean.
3. Stretch (no bloquea el cierre): `ProductoWriteService.update/remove` borra del bucket los
   objetos de galería/ficha que el PATCH elimina o reemplaza (del mismo patrón `tmp-` para
   no tocar la data del CLI).

Alternativas rechazadas: job de limpieza programado (pieza infra extra por el mismo
resultado), borrado en save con transacciones (races; si el usuario nunca guarda, el objeto
quedaría huérfano igualmente — el lifecycle ya lo cubre).

### D6 — Validación en dos capas: multer (MIME declarado + tamaño) + magic bytes

- Capa interceptor: `FileInterceptor('file', { limits: { fileSize }, fileFilter })` —
  413 por tamaño (multer), allowlist rápido por extensión/MIME declarado.
- Capa de servicio: verificación de bytes reales — `sharp` parsea metadata (rechaza si no
  puede o el formato detectado no coincide con lo permitido); `%PDF-` en los primeros bytes
  del buffer. Razón: el MIME de multipart lo declara el cliente; solo los bytes sirven como
  fuente de verdad (400 con mensaje de tipo no válido).
- DTO class-validator inaplicable al multipart: las metadatas opcionales (`alt`,
  `nombreArchivo`) viajan como campos de texto del multipart y se validan con helpers
  tipados en controller/service (el pipeline multer no pasa por el `ValidationPipe` normal
  del body). `productoId` fue eliminado del multipart en la enmienda de D5 (el path ya no
  lo necesita).

### D7 — Form admin: `postFormData()` en ApiClientService + componente de subida dedicado

- `ApiClientService.postFormData<T>(path, formData): Observable<T>` — mismo unwrap y
  `toApiError` que el resto. Sin `Content-Type` manual: el browser setea
  `multipart/form-data; boundary=...`; `authInterceptor` ya cubre el request (URL bajo
  `environment.apiBaseUrl`).
- Componente de subida (Tailwind, sin librerías externas): input file estilizado con
  drop-zone nativa opcional, preview de miniatura (`<img [src]=url>`) para galería, preview
  por nombre para el PDF, estado `uploading` con spinner y botón guardar deshabilitado, y
  error mostrado bajo el control con estilo consistente con `AlertComponent`.
- Producto-form: los controles `url`/`storagePath` pasan a ocultos autocompletados; `alt`,
  `orden`, `nombreArchivo` siguen editables; edit precarga miniaturas desde el `url` del
  producto. El test existente que requiere la **ausencia** de `<input type="file">`
  (`producto-form-page.component.test.ts:285`) se invierte: el reemplazo requerirá presencia
  y comportamiento.

### D8 — Contract y roles

Respuesta 201 siempre `{data: {url, storagePath}}` (envelope estándar; `meta: null`).
Errores responden vía el `ResponseInterceptor` existente. Roles: `@UseGuards(FirebaseAuthGuard,
RolesGuard) @Roles('superadmin','admin','editor')` — espejo de `PATCH /products/:id`.
Documentación en `docs/api/api-spec.yml` como parte de las tasks (contract doc, no OpenSpec).

## Risks / Trade-offs

- **[Huérfanos inevitables ventana 0–48h]** → aceptado; no PII, límite de tamaño reduce
  daño; stretch reduce huérfanos futuros al borrar reemplazados.
- **[CPU de sharp en Cloud Run]** → fotos de catálogo pequeñas; timeouts de request
  (Cloud Run default) holgados; si creciera el coste, mover la normalización no bloquea el
  contract (una imagen webp ya sube tal cual).
- **[Duplicación FileStoragePort/ImageStoragePort]** → ~10 líneas y documentada; unificación
  posterior (movida + delegación) es change independiente sin riesgo funcional.
- **[Test invierte expectativa negativa (no-file → file presente)]** → refactor explícito en
  tasks del `producto-form-page.component.test.ts` (285–293) y del form.
- **[MIME spoofeado por cliente solo en capa 1]** → mitigado por D6 (magic bytes) — la capa
  1 solo acelera el rechazo por tamaño/extensiones obvias.
- **[PDF firmado `%PDF-` pero mal formado]** → la firma es barrera mínima; para MVP
  aceptable y documentado como limitación.
- **[makePublic requiere objectAdmin]** → ya otorgado en la SA de runtime (verificado en
  docs y en la migración); en dev local aplica el ADC del desarrollador con el rol
  equivalente sobre el bucket.

## Migration Plan

1. Merge backend (nuevo módulo `uploads` + puerto storage) — release seguro: es un endpoint
   nuevo y aditivo, no toca rutas existentes; deploy Cloud Run normal.
2. **Tarea manual pre-cierre (bloqueo del change):** habilitar lifecycle rule en
   `riff-catalogo-staging` (y producción al existir) — comando documentado y verificado en
   el runbook. Sin esta regla el change NO se considera terminado (riesgo de huérfanos sin
   límite temporal).
3. Merge frontend admin (upload-first form) — despliegue Coolify `admin-staging`.
4. Rollback: el backend es reversible en cualquier momento (endpoint aditivo sin
   consumidores obligatorios); el reverso del frontend vuelve el form al modo data, y como
   el form es solo-upload, backend y frontend se revierten juntos si se revierte el change.

## Open Questions

- Texto exacto de la regla de lifecycle (match prefix vs age + condition tooling) — se
  concreta en la task manual con el comando verificado contra el bucket real.
- ¿Auto-sumar el `productoId` al multipart desde el admin en modo edición en el mismo
  request del upload? — CERRADO (enmienda D5): el campo se eliminó del multipart del todo
  (path único `productos/tmp-<uuid>/`); el agrupamiento por producto queda a cargo de un
  futuro borrado dirigido (stretch diferido 6.1) sobre la respuesta `storagePath`.
