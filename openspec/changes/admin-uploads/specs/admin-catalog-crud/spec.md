# Delta spec: admin-catalog-crud

## ADDED Requirements

### Requirement: Formulario de producto en página dedicada con subida de archivos
El panel SHALL implementar el formulario de producto en páginas dedicadas (`/products/new` para crear, `/products/:id` para editar), no en modal. El formulario SHALL cubrir el DTO completo del backend: `sku` y `titulo` obligatorios; `slug`, `descripcionBreve` y `descripcionLarga` (texto); `categoriaId` y `subcategoriaId` (selects en cascada); `atributos[]` como filas editables `{nombre, valor}` con añadir/quitar; `precio {valor, visible}`; `stock {disponible, cantidad}` (cantidad nullable); galería editada por subida de archivos — cada ítem se sube con `POST /api/v1/uploads/images` y el formulario autocompleta `{url, storagePath}` con editables solo `alt` y `orden` — con añadir/quitar; ficha técnica opcional subida con `POST /api/v1/uploads/tech-sheet` que autocompleta `{url, storagePath}` con editable solo `nombreArchivo` (sin subida ⇒ `null`); y los flags `destacado` y `publicado`. La galería y la ficha técnica SHALL editarse **exclusivamente por subida de archivos** (SHALL NOT existir inputs de texto para `url`/`storagePath`). Al guardar: crear emite `POST /products` y editar emite `PATCH /products/:id` (precargado vía `GET /products/:id`); en ambos casos al éxito el usuario SHALL volver a `/products` con banner inline de éxito. La página SHALL mostrar breadcrumb y un control «Volver al listado».

#### Scenario: Crear producto válido
- **GIVEN** el formulario `/products/new` completado con datos válidos (incluyendo imágenes y/o ficha ya subidas)
- **WHEN** el usuario guarda
- **THEN** se emite `POST /products` con el payload completo tipado
- **AND** al éxito el router navega a `/products` mostrando un banner inline de éxito

#### Scenario: Editar precarga y guarda con PATCH
- **GIVEN** la página `/products/:id` para un producto existente
- **WHEN** la página carga
- **THEN** el formulario se precarga con los datos de `GET /products/:id` (galería con miniatura por `url` y ficha con `nombreArchivo`)
- **AND** al guardar se emite `PATCH /products/:id` y al éxito se vuelve a `/products` con banner de éxito

#### Scenario: Cascada categoría → subcategoría
- **WHEN** el usuario selecciona una categoría en el formulario
- **THEN** el select de subcategoría se carga con `GET /subcategories?categoriaId=<id>` (incluye inactivas)
- **AND** si había una subcategoría seleccionada de otra categoría, esta se limpia

#### Scenario: Galería y ficha técnica se editan por subida de archivos
- **WHEN** el formulario de producto se renderiza
- **THEN** cada ítem de galería ofrece un control de subida de imágenes (`.jpg/.jpeg/.png/.webp`) con preview de miniatura, campos editables `alt` y `orden`, y botón quitar
- **AND** la ficha técnica ofrece un control de subida de PDF (`.pdf`) con preview por nombre de archivo y campo editable `nombreArchivo`
- **AND** no existen inputs de texto para `url`/`storagePath`: se autocompletan con la respuesta `201` de los uploads

#### Scenario: Subida en curso bloquea el guardado del producto
- **GIVEN** una subida de imagen o PDF en progreso
- **WHEN** el usuario intenta guardar el producto
- **THEN** el botón de guardar permanece deshabilitado hasta que la subida termine

#### Scenario: Error de subida visible en el formulario
- **GIVEN** un rechazo o fallo de cualquiera de los endpoints de upload (400/413/500)
- **WHEN** la subida falla
- **THEN** se muestra un mensaje de error accionable en español junto al control de subida (o banner de error del formulario)
- **AND** el formulario no queda alterado (ningún ítem de galería/ficha parcial es registrado)

#### Scenario: Nombre de archivo de ficha técnica autocompletado
- **GIVEN** el usuario ha subido un PDF de ficha técnica y no ha editado manualmente «nombre de archivo»
- **WHEN** el formulario arma el payload de guardado
- **THEN** `fichaTecnica.nombreArchivo` es el nombre del archivo saneado por el backend (última segmento de `storagePath`), nunca la URL pública
- **AND** si el usuario edita manualmente «nombre de archivo», su valor prevalece

#### Scenario: Volver al listado
- **WHEN** el usuario activa «Volver al listado» (o el breadcrumb)
- **THEN** el router navega a `/products` sin emitir ninguna petición de guardado

## REMOVED Requirements

### Requirement: Formulario de producto en página dedicada
**Reason**: el formulario deja de editar galería y ficha técnica como data (filas de texto
`url`/`storagePath` con la restricción "no existe ningún input de archivo") porque el
backend ganó el endpoint de subida (`admin-uploads`); la edición por archivos reemplaza ese
contrato al completo.
**Migration**: el nuevo requirement «Formulario de producto en página dedicada con subida
de archivos» (mismo delta) cubre creación/edición en páginas dedicadas, cascada de
categoría y vuelta al listado; las URLs/storagePaths de productos existentes siguen siendo
válidos como data del DTO y se muestran como previews precargadas.
