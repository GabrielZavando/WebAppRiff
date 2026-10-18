# Delta spec: admin-uploads

## ADDED Requirements

### Requirement: Subida de imágenes de galería
El backend SHALL exponer `POST /api/v1/uploads/images` (multipart/form-data, campo `file`)
que reciba una imagen `.jpg | .jpeg | .png | .webp` y la suba a Firebase Storage. Las
imágenes `image/jpeg` y `image/png` SHALL normalizarse a formato webp mediante `sharp`
antes de subirse; una imagen `image/webp` SHALL subirse sin re-procesar. El tamaño máximo
SHALL ser de 5 MB. La ruta de Storage SHALL SIEMPRE ser `productos/tmp-<uuid>/<nombre-normalizado>.webp`
(directorio `tmp-` generado por subida, independiente del producto; decisión post-D5: GCS no
soporta wildcards en `matchesPrefix` de lifecycle, por lo que el único prefijo literal
`productos/tmp-` matchea el 100% de los huérfanos de creación y de edición). El endpoint SHALL responder `201` con el envelope estándar que contenga
`data: { url, storagePath }` donde `url` es la URL pública (`https://storage.googleapis.com/<bucket>/<storagePath>`),
y el objeto SHALL quedar público con `cacheControl: public, max-age=31536000`.

#### Scenario: Subida JPEG se normaliza a webp
- **GIVEN** un usuario con rol `admin` autenticado
- **WHEN** envía `POST /api/v1/uploads/images` con una imagen JPEG válida de 2 MB
- **THEN** el backend responde `201` con `data.url` apuntando a un objeto webp público
- **AND** `data.storagePath` coincide con el patrón `productos/tmp-*/*.webp`

#### Scenario: Subida webp no se re-procesa
- **GIVEN** un usuario con rol `admin` autenticado
- **WHEN** envía `POST /api/v1/uploads/images` con una imagen webp válida
- **THEN** el backend responde `201` y el objeto se sube con contentType `image/webp`
- **AND** la URL pública responde HTTP 200

#### Scenario: El path es siempre under productos/tmp- (create y edición)
- **WHEN** el cliente sube una imagen en el modo creación o en el modo edición de un producto
- **THEN** el objeto queda en `productos/tmp-*/` (con o sin contexto de producto en el cliente)
- **AND** la respuesta sigue la forma `{ url, storagePath }` con ese path

#### Scenario: La subida empuja al límite de tamaño
- **GIVEN** una imagen de 6 MB
- **WHEN** se envía a `POST /api/v1/uploads/images`
- **THEN** el backend responde `413` con envelope `error` y no se crea ningún objeto en Storage

### Requirement: Subida de ficha técnica PDF
El backend SHALL exponer `POST /api/v1/uploads/tech-sheet` (multipart/form-data, campo
`file`) que reciba un archivo PDF de máximo 10 MB y lo suba a Firebase Storage **sin
transformación** (contentType `application/pdf`, `cacheControl: public, max-age=31536000`,
objeto público). El patrón de Storage SHALL ser análogo al de imágenes:
`productos/tmp-<uuid>/<nombre>.pdf` (mismo patrón literal único que las imágenes).
El endpoint SHALL responder `201` con `data: { url, storagePath }` en el envelope estándar.

#### Scenario: Subida PDF válida
- **GIVEN** un usuario con rol `editor` autenticado
- **WHEN** envía `POST /api/v1/uploads/tech-sheet` con un PDF válido de 4 MB
- **THEN** el backend responde `201` con `data.url` y `data.storagePath`
- **AND** la URL pública responde HTTP 200 con contentType `application/pdf`

#### Scenario: PDF con nombre de archivo conservado
- **WHEN** se sube `ficha-tecnica-motor.pdf`
- **THEN** el nombre del archivo queda preservado dentro del `storagePath` (saneado de
  caracteres peligrosos y desambiguado con el sufijo uuid del directorio)

### Requirement: Validación real de tipo de archivo (magic bytes)
La validación de tipo SHALL basarse en los bytes reales del archivo, no solo en el MIME
declarado por el cliente: para imágenes SHALL verificarse que `sharp` puede leer la metadata
(negando el 400 si falla) y que el tipo detectado está en la lista de extensiones permitidas,
y para PDF SHALL verificarse que los primeros bytes son `%PDF-`. Un archivo cuyo MIME
declarado sea permitido pero cuyo contenido no corresponda SHALL rechazarse con `400`
y mensaje indicando que el tipo de archivo no es válido, sin crear objetos en Storage.

#### Scenario: Archivo con MIME mentiroso rechazado
- **GIVEN** un archivo `.png` cuyo contenido es un ejecutable o HTML
- **WHEN** se envía a `POST /api/v1/uploads/images` con multipart MIME `image/png`
- **THEN** el backend responde `400` con envelope `error` y mensaje de tipo no válido
- **AND** no se crea ningún objeto en Storage

#### Scenario: PDF falso rechazado
- **WHEN** se envía a `POST /api/v1/uploads/tech-sheet` un archivo con MIME
  `application/pdf` pero sin firma `%PDF-`
- **THEN** el backend responde `400` con envelope `error` y no se sube nada

#### Scenario: Extensión no permitida rechazada
- **WHEN** se envía a `POST /api/v1/uploads/images` un archivo `.gif` o `.svg`
- **THEN** el backend responde `400` con envelope `error` y mensaje sobre el tipo no permitido

### Requirement: Autorización por rol para uploads
Ambos endpoints de subida SHALL requerir un token de Firebase ID válido (`FirebaseAuthGuard`).
El acceso SHALL permitir los roles `superadmin`, `admin` y `editor` (los mismos que possono
editar productos; el rol `view-only`/no autenticado quede excluido). Los roles se evaluarán
con el `RolesGuard` existente con `@Roles('superadmin', 'admin', 'editor')`.

#### Scenario: Editor puede subir
- **GIVEN** un usuario con JWT de rol `editor`
- **WHEN** envía una imagen válida a `POST /api/v1/uploads/images`
- **THEN** la subida se procesa y responde `201`

#### Scenario: No autenticado recibe 401
- **WHEN** se envía una subida sin header `Authorization`
- **THEN** el backend responde `401` con envelope `error`

#### Scenario: Rol insuficiente recibe 403
- **GIVEN** un usuario de rol de solo lectura
- **WHEN** intenta subir un archivo
- **THEN** el backend responde `403` con envelope `error`

### Requirement: Manejo de errores de subida
Los errores de subida SHALL reportarse con el envelope estándar y el cuerpo de `error`
(extensión del `ResponseInterceptor`). Los códigos de error SHALL ser: `400` por tipo no
permitido (magic bytes inválidos o campo `file` ausente), `413` por exceso de tamaño,
`401` sin sesión y `403` con rol insuficiente. Un fallo de subida a Storage (fallo de
red/ADC, timeout de `file.save`) SHALL mapearse a `500` con envelope `error`, mensaje
genérico «Failed to upload file» y el detalle en logs de backend, sin revelar rutas
internas. Si la subida falla, el frontend SHALL recibir un mensaje accionable y el estado
del formulario queda intacto; si la subida es exitosa, la respuesta SHALL ser siempre
`{ url, storagePath }`.

#### Scenario: Fallo de subida a Storage reporta 500 y logging
- **GIVEN** Storage responde con error o timeout al hacer `file.save`
- **WHEN** el backend intenta subir el archivo
- **THEN** responde `500` con envelope `error.message` «Failed to upload file» y el detalle queda registrado en logs
- **AND** el frontend muestra el mensaje accionable sin bloquear el resto del formulario

#### Scenario: Campo file ausente
- **WHEN** se envía el multipart sin el campo `file`
- **THEN** responde `400` con envelope `error` y mensaje sobre el archivo requerido

### Requirement: Convención de paths y limpieza por lifecycle (infraestructura)
Los objetos subidos SHALL quedar bajo el patrón `productos/` siempre dentro de un
directorio `tmp-<uuid>` (en `productos/<productoId>/tmp-<uuid>/` o `productos/tmp-<uuid>/`).
La limpieza de huérfanos (subidas que nunca se adjuntan a un producto guardado) SHALL
manejarse con una regla de ciclo de vida del bucket de Google Cloud Storage que elimine
los objetos cuyo path contenga un directorio `tmp-` y cuya edad sea > 48 horas. Esta regla
es configuración de infraestructura del bucket, NO código del backend; su habilitación
queda documentada como tarea manual del runbook. En este change no se introducen paths
definitivos separados: el objeto queda en su path `tmp-` y es la propia ficha/galería del
producto la que referencia esa URL; el borrado de objetos reemplazados al guardar el
producto es un requisito stretch (fuera del bloqueo de este change).

#### Scenario: Objetos temporales se borran tras 48 h
- **GIVEN** un usuario sube una imagen y abandona el formulario sin guardar el producto
- **WHEN** transcurren más de 48 horas
- **THEN** la regla de lifecycle del bucket elimina el objeto de `productos/*/tmp-*/`
- **AND** esto ocurre puramente por configuración de GCS, sin intervención del backend

#### Scenario: Regla documentada en el runbook
- **WHEN** se revisa el runbook de backend de staging
- **THEN** documenta el comando `gcloud`/`gsutil` (o equivalente en consola) y su verificación
