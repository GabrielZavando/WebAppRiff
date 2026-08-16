## 1. Scaffold CLI and module

- [x] 1.1 Create `apps/backend/src/cli/migrate-imagenes.ts` entry using `NestFactory.createApplicationContext` (mirror `seed-productos.ts`).
- [x] 1.2 Create `apps/backend/src/cli/migrate-imagenes/migrate-imagenes.module.ts` importing `FirebaseModule`, `FirestoreModule`, `ProductosModule` (reusa `I_PRODUCT_REPOSITORY`) y proveyendo los puertos/adapters + use-case.
- [x] 1.3 Add `"migrate:productos:imagenes": "nest build && node dist/cli/migrate-imagenes.js"` to `apps/backend/package.json`.
- [x] 1.4 Add `sharp` dependency (`^0.35.3`) to `apps/backend/package.json`.

## 2. Ports and adapters (TDD)

- [x] 2.1 Define `ImageSourcePort`, `ImageStoragePort`, `SeedImageMapLoader` interfaces + tokens (`IMAGE_SOURCE_PORT`, `IMAGE_STORAGE_PORT`, `SEED_IMAGE_MAP_LOADER`) en `ports.ts` (ISP: ≤ 5 métodos cada uno).
- [x] 2.2 Implement `WordPressImageSource` adapter (download con UA + content-type `image/*` + 2 reintentos/backoff; `sharp` resize ≤ 800px `withoutEnlargement`, WebP q82) + `wordpress-image-source.adapter.spec.ts` (RED→GREEN: content-type no imagen, agotar reintentos, retry→éxito).
- [x] 2.3 Implement `FirebaseStorageUploader` adapter (`getStorage` + `file.save` con `contentType: image/webp`, `cacheControl` 1 año, `makePublic`, URL pública) + `firebase-storage-uploader.adapter.spec.ts` (RED→GREEN con Storage fake).
- [x] 2.4 Implement `SeedImageMapLoaderImpl` leyendo `_imagenesPendientesMigracion` (`SEED_FILE_PATH` override, default raíz monorepo; JSON inválido / falta mapa / valores no-string → error claro) + `seed-image-map.loader.spec.ts` (RED→GREEN).

## 3. Use-case (TDD)

- [x] 3.1 Implement `MigrateProductosImagenesUseCase` (orquesta: load map → por cada producto existente, omitir si no existe o ya completo por idempotencia; descargar/optimizar/subir vía puertos; `repository.update(id, { galeria })`; guard ≤10; tolerancia a fallos; reporte) + `migrate-imagenes.use-case.spec.ts` (RED→GREEN con fakes: prod-054 omit, parcial→completa, skip idempotente, >10 trunca + advertencia, fallo→fallidos, dry-run sin escrituras).
- [x] 3.2 `alt = titulo` y `storagePath`/`orden` deterministas (`productos/{id}/{orden}.webp`).

## 4. CLI wiring and reporting

- [x] 4.1 En `migrate-imagenes.ts`: resolver use-case, ejecutar, `Logger.log` resumen, escribir `migracion-imagenes-reporte.json` (ruta configurable vía `MIGRACION_REPORTE_PATH`), `app.close()`; en `catch` loguear solo el mensaje (sin secrets) y `process.exit(1)`.
- [x] 4.2 Flag `--dry-run` que omite descarga/subida/escritura y reporta lo que migraría.
- [x] 4.3 El `FirebaseStorageUploader` apunta a un bucket explícito leyendo `FIREBASE_STORAGE_BUCKET` desde config (fail-fast si falta); se agregó la variable a `apps/backend/.env` y `apps/backend/.env.example`. (Corrige el fallo "Bucket name not specified" detectado en la primera ejecución real.)

## 5. Validation & SDD

- [x] 5.1 `npm run lint` sobre los archivos de este change: limpio. NOTA: el comando `npm run lint` de todo el workspace actualmente falla por un error de complejidad (cyclomatic 13 > 10) en `src/cli/migrate/migrate-firestore.use-case.ts`, archivo **no rastreado que pertenece a otro change en curso** (`migrate-firestore-new-account`) y ajeno a esta migración. No se modifica para no invadir ese alcance.
- [x] 5.2 `npm run typecheck --workspace=@riff/backend` → exit 0.
- [x] 5.3 `npm test --workspace=@riff/backend` → 358 tests pass (18 nuevos en `src/cli/migrate-imagenes`). El CLI está excluido del umbral de cobertura global (`collectCoverageFrom` excluye `src/cli/**`), pero sus specs cubren los escenarios del spec.
- [x] 5.4 `npm run build --workspace=@riff/backend` → exit 0 (emitido `dist/cli/migrate-imagenes.js`).
- [x] 5.5 `openspec validate migrate-productos-imagenes` → valid.
- [x] 5.6 `openspec status --change migrate-productos-imagenes` → 4/4 artifacts complete.
- [x] 5.7 Added unit test for the `FIREBASE_STORAGE_BUCKET` fail-fast (`resolveImageStorageUploader`): missing var → throws the clear message; present → builds the uploader with the configured bucket. Closes the `/verify` observation (escenario "Missing required environment variable fails fast").

## 6. Execution and verification (requires staging environment)

> Pendiente de ejecutar en el entorno de staging con credenciales de Firebase y
> el hosting WordPress origen alcanzable. No se ejecuta en este entorno de
> desarrollo (sin credenciales ni red al host legacy).

- [x] 6.1 Run `npm run migrate:productos:imagenes -- --dry-run` y revisar conteos del reporte. → dry-run: 70 exitosos, 0 fallidos, 1 omitido (prod-054).
- [x] 6.2 Ejecutar contra el proyecto Firebase (`webappriff`); verificar que una `galeria[0].url` de muestra sea públicamente alcanzable. → URL `https://storage.googleapis.com/webappriff.firebasestorage.app/productos/prod-001/1.webp` responde 200 `image/webp`.
- [x] 6.3 Smoke test `GET /api/v1/products` retorna productos con `galeria` no vacía. → `GET /api/v1/products?pageSize=1` → 200, `galeria[0].url` poblada.
- [x] 6.4 Re-ejecutar para confirmar idempotencia (0 escrituras la segunda vez). → 2ª corrida: 28 exitosos (los 28 que antes dieron 502 transitorio), 0 fallidos, 43 omitidos (42 ya migrados + prod-054). Conteo final Firestore: 70/70 productos con `galeria` no vacía, 0 vacíos. Las 28 fallas iniciales fueron 502 transitorios del host legacy que se resolvieron en la re-ejecución.

## 7. Documentation

- [x] 7.1 Agregar sección "Migración de Imágenes de Producto" en `docs/seed-catalog.md` (comando, `SEED_FILE_PATH`/`MIGRACION_REPORTE_PATH`, idempotencia, reporte, dry-run) y ajustar la nota de `galeria` en el seed de productos.
- [x] 7.2 `docs/api-spec.yml` sin cambios (no hay cambio de contrato HTTP); `docs/data-model.md` ya documenta `galeria` (máx 10), respetado por la migración.
