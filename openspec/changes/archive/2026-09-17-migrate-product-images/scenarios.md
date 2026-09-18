# Scenarios: migrate-product-images

Entidad dominante: `productos` (Firestore). Campo afectado: `galeria: array<{url, storagePath, alt, orden}>` (máx. 10, primera = imagen principal). Sin cambios de endpoints de API.

### SC-001: Migración puebla galería en Firestore
- Given productos en Firestore con `galeria: []` y entradas en `_imagenesPendientesMigracion` del seed
- When se ejecuta `npm run migrate:productos:imagenes` contra el entorno staging
- Then cada producto migrado tiene `galeria` poblada con `{url, storagePath, alt, orden}` apuntando a objetos WebP en Firebase Storage, y sus entradas pendientes quedan resueltas

### SC-002: URLs públicamente accesibles
- Given una imagen subida a Firebase Storage por la migración
- When se accede a su `url` persistida en `galeria` sin autenticación (curl)
- Then la respuesta es HTTP 200 con `content-type: image/webp` (no 403 ni 404)

### SC-003: Idempotencia y reintento de omitidos
- Given una migración previa parcial con productos ya migrados y productos omitidos
- When se re-ejecuta el comando
- Then los productos ya migrados se omiten sin crear objetos duplicados en Storage, y los omitidos por error se reintentan y quedan clasificados en el reporte con su resultado

### SC-004: Reporte final con validación de accesibilidad
- Given la migración finaliza
- When se lee el reporte generado (`migracion-imagenes-reporte.json`)
- Then clasifica cada producto como migrado / omitido-con-motivo / fallido, y ninguna URL persistida quedó sin validación de accesibilidad exitosa

### SC-005: Sitio estático muestra imágenes tras rebuild
- Given la migración completada con cambios en Firestore
- When se dispara el rebuild (webhook automático desde el CLI o manual) y el sitio Astro se publica
- Then `ProductCard`, `ProductListItem` y `ProductGallery` muestran las imágenes reales; los productos genuinamente sin imágenes origen muestran el placeholder

### SC-006: Config incompleta falla rápido y sin escrituras
- Given `FIREBASE_STORAGE_BUCKET` (u otra variable requerida) ausente en el entorno
- When se ejecuta el comando de migración
- Then el proceso falla al inicio con mensaje explícito indicando la variable faltante, sin realizar ninguna escritura en Firestore ni Storage

### Edge Cases

| Case | Expected Behavior |
|---|---|
| Producto sin imágenes pendientes | Se omite; `galeria` permanece `[]` y el frontend muestra placeholder |
| Imagen origen 404 en hosting legacy | Se registra como fallo con causa; el producto queda sin esa imagen y el resto continúa |
| Blob faltante que dejaría URL relativa (`old/galeria/...`) | Se descarta o re-resuelve; nunca se persiste una URL relativa en `galeria` |
| Bucket con uniform bucket-level access donde `makePublic()` es no-op | La validación HEAD detecta la inaccesibilidad y la migración falla con mensaje claro antes de persistir |
| Producto con más de 10 imágenes | Se respeta el máximo de dominio (10 imágenes por producto) |
| Webhook de rebuild falla tras migración exitosa | Se loguea warning y el reporte indica que se requiere rebuild manual |
