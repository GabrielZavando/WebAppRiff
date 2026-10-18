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
- [ ] 5.2 Deploy backend a `riff-api-staging` (Cloud Run) y admin a `admin-staging` (Coolify); gate `make ci` verde.
- [ ] 5.3 Verificación manual E2E en staging: subir imagen (201 + preview en catálogo público sirve el webp), subir PDF (201 + link funciona), 403 con rol view-only, y lifecycle spot-check con objeto de prueba.

## 6. Stretch (no bloquea el cierre del change)

- [x] 6.1 `ProductoWriteService.update/remove`: borrar del bucket los objetos `tmp-` de galería/ficha que el PATCH elimina o reemplaza (TDD con fake del puerto). Solo si esta tarea entra en el alcance del cierre o posponerse explícitamente antes de `/opsx-archive`. — Diferido a change futuro. La limpieza se mitiga con la regla de ciclo de vida (48h).
- [x] 6.2 Unificación de `FirebaseStorageUploader` (CLI) con `FirebaseFileStorageAdapter` (delegar/reusar) — change independiente futuro. — Diferido a change futuro. La limpieza se mitiga con la regla de ciclo de vida (48h).

## 7. Cierre

- [x] 7.1 `make ci` verde (openspec validate + lint + typecheck + test + audit).
- [ ] 7.2 Confirmar tarea 5.1 (lifecycle rule) verificada; recién entonces considerar el change terminado para `/opsx-archive`. — Regla creada y activa (5.1 ✅); queda pendiente la verificación E2E en staging (5.3).
