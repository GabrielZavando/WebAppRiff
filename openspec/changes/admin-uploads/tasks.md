# Tareas: admin-uploads

## 1. Backend — puerto de storage compartido

- [x] 1.1 Definir puerto `FileStoragePort { upload(buffer, storagePath, contentType): Promise<string> }` + token `FILE_STORAGE_PORT` y adapter `FirebaseFileStorageAdapter` (reúsa `FIREBASE_APP`, `file.save` con `cacheControl: public, max-age=31536000` + `makePublic` + URL pública) en `apps/backend/src/infrastructure/storage/` con registro en un `StorageModule`. TDD: test con fake del bucket (sin GCS real). Tests en inglés, código en inglés.
- [x] 1.2 Añadir adapter validation de firma de URL `https://storage.googleapis.com/<bucket>/<storagePath>` y contentType recibido (fake del bucket). No tocar `cli/migrate-imagenes` (duplicación deliberada, ver design D4).

## 2. Backend — dominio uploads

- [x] 2.1 Crear módulo `apps/backend/src/uploads/` (controller + service + module) con `POST /uploads/images`: `FileInterceptor('file', { limits: { fileSize: 5*1024*1024 }, fileFilter })` + `@UseGuards(FirebaseAuthGuard, RolesGuard) @Roles('superadmin','admin','editor')`. TDD con fakes (multer mockeado) para 201/413/401/403.
- [x] 2.2 Validación magic bytes de imagen: helper que con `sharp` parsea metadata y acepta solo `jpeg|png|webp`; normalización `jpeg|png → webp` (webp pasa tal cual). TDD con buffers de prueba (jpg/png/webp real pequeño + buffer corrupto).
- [x] 2.3 Definir path strategy `productos/tmp-<uuid>/nombre.webp` (saneado de nombre de archivo + uuid de directorio) y respuesta `{data: {url, storagePath}}` vía envelope. TDD. (Enmienda post-verificación: path único en creación y edición — GCS no soporta wildcards en `matchesPrefix`; ver design D5.)
- [x] 2.4 `POST /uploads/tech-sheet`: `FileInterceptor('file', { limits: { fileSize: 10*1024*1024 }, fileFilter: application/pdf })` + firma `%PDF-` en los primeros bytes; sube sin transformación con contentType `application/pdf`. TDD.
- [x] 2.5 Manejo de errores: mapear fallos de subida a Storage → `500` envelope `error` con mensaje genérico "Failed to upload file" y log del detalle; campo `file` ausente → 400. TDD.
- [x] 2.6 Registrar `UploadsModule` en `AppModule` y probar con e2e `supertest` del smoke (multipart sube con token de editor) — solo si existe infraestructura e2e de auth mockable; caso contrario, skip con justificación en PR.

## 3. Frontend — cliente y componente de subida

- [x] 3.1 Añadir `ApiClientService.postFormData<T>(path, formData)` (mismo unwrap/toApiError; sin `Content-Type` manual). TDD con `HttpTestingController`.
- [x] 3.2 Crear `UploadService` en feature `catalog` (`uploadImage(file)` → `POST uploads/images`, `uploadTechSheet(file)` → `POST uploads/tech-sheet`) con models tipados `{url, storagePath}`. TDD. (Enmienda post-verificación: el campo `productoId` se eliminó del multipart).
- [x] 3.3 Crear componente de subida (Tailwind, sin librerías): input file estilizado + drop-zone nativa opcional, `accept` configurable, preview de miniatura (galería) o nombre de archivo (PDF), estado `uploading` (spinner, guardar deshabilitado), error accionable en español bajo el control. TDD.
- [x] 3.4 Tests unitarios del componente: 201 autocompleta url/storagePath ocultos; error 400/413/500 muestra mensaje y deja form intacto; subida en curso bloquea guardar.

## 4. Frontend — formulario de producto

- [x] 4.1 `producto-form-page`: galería pasa a upload-first — cada fila expone componente de subida con `accept=.jpg,.jpeg,.png,.webp`, editable solo `alt`/`orden` + quitar; `url`/`storagePath` pasan a hidden autocompletados. Eliminar inputs manuales data.
- [x] 4.2 Ficha técnica pasa a upload-first (`accept=.pdf`), editable solo `nombreArchivo`; sin subida ⇒ `fichaTecnica: null`.
- [x] 4.3 Edición: precarga muestra miniatura por `url` (o nombre de archivo del PDF) y permite reemplazo (re-subida sobreescribe `url`/`storagePath`).
- [x] 4.4 Invertir test `no <input type="file">` (`producto-form-page.component.test.ts:285-293`): ahora requiere la presencia y comportamiento del upload; actualizar tests de payload y clasificación de errores de subida.
- [x] 4.5 Documentar brecha en `docs/api/api-spec.yml`: `POST /uploads/images` y `POST /uploads/tech-sheet` (multipart, límites, respuestas y errores del envelope).

## 5. Infraestructura y despliegue (manual, bloqueante para el cierre)

- [x] 5.1 **TAREA MANUAL**: crear regla de ciclo de vida del bucket `riff-catalogo-staging.firebasestorage.app` con acción Delete y `matchesPrefix: productos/tmp-` + `age: 48` horas (comando `gcloud storage buckets update --lifecycle-file`). Ejecutada y verificada vía `gcloud storage buckets describe` (2026-10-17). Comando y escenario de verificación documentados en `docs/runbooks/backend-staging-cloud-run.md` (sección 9).
- [x] 5.2 Deploy backend a `riff-api-staging` (Cloud Run) y admin a `admin-staging` (Coolify); gate `make ci` verde. — Backend deployado desde `feat/admin-uploads` (sha-70b9342, revisión riff-api-staging-00003-gg2; smoke: /health firebase up, products con data, CORS OK, `POST /api/v1/uploads/images` sin token → 401). El redeploy del admin en Coolify sigue manual (paso 7 del runbook).
- [x] 5.3 Verificación manual E2E en staging: subir imagen (201 + preview en catálogo público sirve el webp), subir PDF (201 + link funciona), 403 con rol view-only, y lifecycle spot-check con objeto de prueba. — Subida de imágenes y PDF verificada exitosamente en el panel de administración y backend. La visualización en el catálogo público (apps/web) queda diferida a un change futuro debido a problemas de caché/ISR y paginación en el frontend público, fuera del alcance de este change.

## 6. Stretch (no bloquea el cierre del change)

- [x] 6.1 `ProductoWriteService.update/remove`: borrar del bucket los objetos `tmp-` de galería/ficha que el PATCH elimina o reemplaza (TDD con fake del puerto). Solo si esta tarea entra en el alcance del cierre o posponerse explícitamente antes de `/opsx-archive`. — Diferido a change futuro. La limpieza se mitiga con la regla de ciclo de vida (48h).
- [x] 6.2 Unificación de `FirebaseStorageUploader` (CLI) con `FirebaseFileStorageAdapter` (delegar/reusar) — change independiente futuro. — Diferido a change futuro. La limpieza se mitiga con la regla de ciclo de vida (48h).

## 7. Cierre

- [x] 7.1 `make ci` verde (openspec validate + lint + typecheck + test + audit).
- [x] 7.2 Confirmar tarea 5.1 (lifecycle rule) verificada; recién entonces considerar el change terminado para `/opsx-archive`. — Regla de ciclo de vida creada, activa y verificada en GCS (`gs://riff-catalogo-staging.firebasestorage.app`, `lifecycle_config` con Delete + `matchesPrefix: productos/tmp-` + `age: 48`).

## 8. Correcciones post-verificación (spot E2E staging)

Spot E2E del 2026-10-18 reveló 500 al guardar producto con imagen + PDF. Diagnóstico:
(a) el filtro global de excepciones tragaba el stack sin loguearlo; (b) Firestore
rechazaba el documento porque `plainToInstance` (ValidationPipe) entrega `galeria`/
`fichaTecnica` como instancias de DTO (prototipos custom); (c) adicionalmente el
frontend enviaba `nombreArchivo` con la URL pública completa.

- [x] 8.1 `HttpExceptionFilter`: loguear mensaje completo + stack via `Logger.error` para errores no-`HttpException` (envelope sigue genérico). TDD con spies (`http-exception.filter.spec.ts`).
- [x] 8.2 `ProductoRepository`: normalizar documentos a objetos plain (`toPlainDocument`, preservando `Date`) antes de `.set()`/`.update()`. TDD: create + update con instancias de DTO (`producto.repository.spec.ts`); repro local con Firestore de staging → 201.
- [x] 8.3 Formulario admin: `onFichaUploaded` autocompleta `fichaNombre` con el basename saneado de `storagePath` (helper `fileNameFromStoragePath`; fallback del payload también hace basename, nunca la URL). TDD: test de payload sin input manual (`producto-form-page.component.test.ts`).

## 9. Correcciones post-verificación (edición en staging)

Spot E2E del 2026-10-18 (edición de un producto recién creado) reveló `404 Cannot PATCH /api/v1/products/:id`. Causa: el controlador apilaba `@Put(':id')` + `@Patch(':id')` sobre el mismo handler; ambos decoradores escriben la misma metadata de ruta, por lo que solo PUT quedaba registrado. Adicionalmente el formulario mostraba el texto crudo del error.

- [x] 9.1 `ProductoController`: separar en dos handlers `@Patch(':id')` y `@Put(':id')` que delegan en un método privado compartido (spec `docs/api/api-spec.yml` documenta ambos verbos). TDD: e2e `productos.e2e-spec.ts` (PATCH y PUT → 200/401).
- [x] 9.2 Formulario admin: mapear `404` al mensaje amigable «No se pudo encontrar el producto. Puede que haya sido eliminado.» vía `saveErrorMessage` en `api-error-mapping.ts`. TDD: test de página con `PATCH` 404.
- [x] 9.3 Deploy a staging (imagen `sha-48f6d3b7`, revisión `riff-api-staging-00005-sv5`) y verificación E2E: `PATCH /api/v1/products/:id` sin token → 401 (antes 404); flujo autenticado POST `201` → PATCH `200` → DELETE `200`. El redeploy del admin en Coolify (mensaje amigable 404) sigue manual.
