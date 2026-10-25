# admin-catalog-crud Specification

## Purpose
Pantallas del panel admin para operar el catálogo: listado paginado de productos (búsqueda y filtro server-side, contador total desde `meta.total`), CRUD de categorías, subcategorías anidadas en el detalle de categoría y productos con el DTO completo del backend. La galería y la ficha técnica se editan como data (sin subida de archivos: no existe endpoint de uploads); los conflictos 409 se mapean por campo y el éxito se notifica con banners inline (sin toasts). Las acciones de crear/eliminar se ocultan para el rol editor.
## Requirements
### Requirement: Listado de productos con paginación y total server-side
La página `/products` SHALL renderizar una tabla de productos con, al menos, las columnas: título (acompañado del SKU), categoría, precio, stock, publicado, destacado y acciones por fila. El listado SHALL consumir `GET /api/v1/products` con paginación server-side (`?page` y `?limit`, límite por defecto 24) y SHALL mostrar sobre la tabla un contador con el total real de productos leído de `meta.total` de la respuesta (formato «N productos en total»), aunque la página visible muestre menos filas. El contador SHALL mostrarse únicamente cuando `meta.total` es numérico; en cualquier otro caso (sin `meta`, sin `total`, o `total` no numérico) SHALL omitirse el contador — sin valor de respaldo — mientras la tabla sigue renderizando con normalidad. La petición SHALL llevar el token Bearer (interceptor existente) para que el backend devuelva también los productos no publicados con proyección completa. La tabla SHALL mostrar un estado vacío cuando no hay resultados y un mensaje de error visible (banner) cuando la petición falla.

#### Scenario: La tabla muestra las filas de la página y el total real
- **WHEN** el backend responde a `GET /products?page=1&limit=24` con 24 ítems y `meta.total = 100`
- **THEN** la tabla renderiza 24 filas
- **AND** sobre la tabla se lee «100 productos en total»

#### Scenario: La paginación navega server-side
- **WHEN** el usuario activa el control de página siguiente
- **THEN** se emite `GET /products?page=2&limit=24`
- **AND** la tabla se actualiza con las filas de la página 2 y el contador se recalcula desde `meta.total`

#### Scenario: Sin meta.total numérico no se muestra contador
- **WHEN** la respuesta de `GET /products` no incluye `meta`, o `meta.total` no es numérico
- **THEN** el contador «N productos en total» no se renderiza
- **AND** la tabla renderiza las filas recibidas con normalidad (sin valor de respaldo ni error)

#### Scenario: Fallo del backend muestra error visible
- **WHEN** `GET /products` responde con error de red o 5xx
- **THEN** la página muestra un banner de error visible en lugar de una tabla vacía silenciosa

### Requirement: Búsqueda y filtro de productos server-side
El listado de productos SHALL ofrecer un buscador de texto que consulta server-side vía `?search=<término>` y un filtro por categoría (select) que consulta server-side vía `?categoriaId=<id>`, alimentado desde la lista real de categorías (`GET /api/v1/categories` sin filtro, incluye inactivas). Ambos controles SHALL ser combinables entre sí y con la paginación, y al modificar cualquiera de los dos la consulta SHALL reiniciar a la página 1. La opción por defecto del filtro SHALL ser «Todas las categorías» (sin `categoriaId`).

#### Scenario: Buscar consulta server-side
- **WHEN** el usuario escribe «taladro» en el buscador y la entrada se estabiliza
- **THEN** se emite `GET /products?search=taladro&page=1&limit=24`
- **AND** la tabla muestra los resultados devueltos y el contador refleja el total filtrado

#### Scenario: Filtrar por categoría combina con la búsqueda
- **WHEN** hay una búsqueda activa y el usuario selecciona la categoría «Herramientas»
- **THEN** se emite `GET /products?search=<término>&categoriaId=<id>&page=1&limit=24`

#### Scenario: Cambiar el filtro reinicia a la página 1
- **GIVEN** el usuario está en la página 3 del listado
- **WHEN** cambia el filtro de categoría o el término de búsqueda
- **THEN** la consulta se reinicia con `page=1`

### Requirement: Acciones del listado de productos
La página `/products` SHALL renderizar fuera de la tabla un botón «Añadir producto» que navega a `/products/new`, y en cada fila acciones «Editar» (navega a `/products/:id`) y «Eliminar» (abre un modal de confirmación). Al confirmar el modal SHALL emitirse `DELETE /api/v1/products/:id`, la lista SHALL recargarse, el usuario SHALL permanecer en `/products` y SHALL verse un banner inline de éxito. Al cancelar el modal no SHALL emitirse ninguna petición DELETE.

#### Scenario: Añadir producto navega al formulario
- **WHEN** el usuario activa «Añadir producto»
- **THEN** el router navega a `/products/new`

#### Scenario: Editar navega al formulario del producto
- **WHEN** el usuario activa «Editar» en la fila de un producto con id `p1`
- **THEN** el router navega a `/products/p1`

#### Scenario: Eliminar con confirmación elimina y notifica inline
- **GIVEN** el modal de confirmación abierto para un producto
- **WHEN** el usuario confirma
- **THEN** se emite `DELETE /products/:id`
- **AND** el usuario permanece en `/products` con el listado actualizado y un banner inline de éxito

#### Scenario: Cancelar el modal no elimina
- **WHEN** el usuario cancela el modal de confirmación
- **THEN** no se emite `DELETE` y la tabla queda sin cambios

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

#### Scenario: Guardar un producto inexistente (404) muestra mensaje amigable
- **GIVEN** el usuario guarda una edición (`PATCH /products/:id`) de un producto que ya no existe
- **WHEN** el backend responde `404`
- **THEN** el formulario muestra un mensaje en español («No se pudo encontrar el producto. Puede que haya sido eliminado.») en lugar del texto crudo del backend
- **AND** la edición `PUT`/`PATCH` de productos existentes sigue funcionando: el controlador expone ambos verbos sobre `/api/v1/products/{id}`

#### Scenario: Volver al listado
- **WHEN** el usuario activa «Volver al listado» (o el breadcrumb)
- **THEN** el router navega a `/products` sin emitir ninguna petición de guardado

### Requirement: CRUD de categorías
El panel SHALL implementar el CRUD de categorías: la página `/categories` con tabla (columnas: nombre, slug, orden, activa), buscador de texto, botón «Añadir categoría» (→ `/categories/new`) y acciones por fila «Editar» (→ `/categories/:id`) y «Eliminar» (modal de confirmación). El formulario (`/categories/new` y `/categories/:id`) SHALL cubrir `nombre` obligatorio, `slug`, `orden` y `activa`; crear emite `POST /categories` y editar emite `PATCH /categories/:id` (precargado vía `GET /categories/:id`); al éxito el usuario SHALL volver a `/categories` con banner inline. El buscador de la lista SHALL filtrar en cliente sobre los datos cargados (el backend no expone `?search` para categorías). La eliminación SHALL emitir `DELETE /categories/:id` y mapear los 409 del backend: «Slug already in use» al campo slug del formulario; «Cannot delete the default category» y «Cannot delete a category with associated products» a un banner de error en la lista, sin eliminar el ítem.

#### Scenario: Crear categoría válida
- **GIVEN** el formulario `/categories/new` con nombre válido
- **WHEN** el usuario guarda
- **THEN** se emite `POST /categories` con el payload
- **AND** al éxito se vuelve a `/categories` con banner inline de éxito

#### Scenario: Editar categoría navega al detalle
- **WHEN** el usuario activa «Editar» en la fila de una categoría con id `c1`
- **THEN** el router navega a `/categories/c1`

#### Scenario: Eliminar categoría con productos muestra error y no elimina
- **GIVEN** una categoría con productos asociados
- **WHEN** el usuario confirma su eliminación y el backend responde 409 «Cannot delete a category with associated products»
- **THEN** se muestra un banner de error con el motivo en español y la categoría permanece en la tabla

#### Scenario: Buscador de categorías filtra en cliente
- **GIVEN** el listado de categorías cargado
- **WHEN** el usuario escribe en el buscador
- **THEN** la tabla se filtra en cliente sin emitir nuevas peticiones al backend

### Requirement: Subcategorías anidadas en el detalle de categoría
La página `/categories/:id` SHALL mostrar el formulario de la categoría y, debajo, la lista de subcategorías de esa categoría (obtenida con `GET /subcategories?categoriaId=:id`) con acciones «Editar» y «Eliminar», un botón «Añadir subcategoría» que navega a `/categories/:id/subcategories/new`, y edición que navega a `/categories/:id/subcategories/:subId`. El formulario de subcategoría SHALL cubrir `nombre` obligatorio, `slug`, `orden` y `activa`; el `categoriaId` SHALL provenir del contexto de la ruta (no editable en el formulario); crear emite `POST /subcategories` y editar emite `PATCH /subcategories/:id` (precargado vía `GET /subcategories` del detalle o por id); al éxito SHALL volver a `/categories/:id` con banner inline y la lista SHALL refrescarse. La eliminación SHALL emitir `DELETE /subcategories/:id` y mapear los 409: «Slug already in use within this category» al campo slug; «Cannot delete a subcategoria with associated products» a banner de error.

#### Scenario: La lista muestra las subcategorías de la categoría
- **GIVEN** la página `/categories/c1` con dos subcategorías asociadas
- **WHEN** la página carga
- **THEN** se emite `GET /subcategories?categoriaId=c1`
- **AND** se listan ambas subcategorías con sus acciones

#### Scenario: Añadir subcategoría navega con contexto de ruta
- **WHEN** el usuario activa «Añadir subcategoría» en `/categories/c1`
- **THEN** el router navega a `/categories/c1/subcategories/new`
- **AND** el formulario no ofrece selector de categoría (viene de la ruta)

#### Scenario: Crear subcategoría válida vuelve al detalle con banner
- **GIVEN** el formulario `/categories/c1/subcategories/new` con nombre válido
- **WHEN** el usuario guarda
- **THEN** se emite `POST /subcategories` con `categoriaId: "c1"`
- **AND** al éxito se vuelve a `/categories/c1` con banner inline y la lista refrescada

#### Scenario: Eliminar subcategoría con productos muestra error
- **GIVEN** una subcategoría con productos asociados
- **WHEN** el usuario confirma su eliminación y el backend responde 409
- **THEN** se muestra un banner de error con el motivo en español y la subcategoría permanece en la lista

### Requirement: Manejo de errores 409 y de validación por campo
Los conflictos 409 del backend SHALL mapearse a mensajes en español junto al campo correspondiente del formulario: «SKU already in use» al campo `sku` (productos); «Slug already in use» al campo `slug` (categorías y productos); «Slug already in use within this category» al campo `slug` (subcategorías). Los errores de validación del formulario SHALL mostrarse por campo cuando el control está tocado e inválido (patrón de `login-page.component.ts`: `border-error` + mensaje `text-error`), y el botón de guardar SHALL permanecer deshabilitado mientras el formulario sea inválido. Los 409 no mapeables a un campo SHALL mostrarse como banner de error.

#### Scenario: SKU duplicado marca el campo sku
- **GIVEN** el formulario de producto con un SKU ya existente
- **WHEN** el usuario guarda y el backend responde 409 «SKU already in use»
- **THEN** el campo `sku` muestra un mensaje de error visible en español y el producto no se crea

#### Scenario: Slug de categoría duplicado marca el campo slug
- **WHEN** el backend responde 409 «Slug already in use» al guardar una categoría
- **THEN** el campo `slug` muestra el mensaje de error y la categoría no se crea

#### Scenario: Validación obligatoria se muestra por campo
- **WHEN** el usuario toca y vacía el campo `titulo` de un producto nuevo
- **THEN** el campo muestra estado de error (`border-error`) con mensaje visible (`text-error`)
- **AND** el botón de guardar permanece deshabilitado

### Requirement: Notificación de éxito inline
Los resultados exitosos de las operaciones de catálogo SHALL notificarse con banners inline dentro de la página (componente de alerta del design system), SHALL NOT usar toasts. Tras crear o editar (cualquier dominio) el usuario SHALL volver al listado correspondiente (`/products`, `/categories` o `/categories/:id`) con un banner de éxito visible; tras eliminar SHALL permanecer en el listado actual con banner de éxito. El banner SHALL ser transitorio de sesión de navegación: SHALL NOT reaparecer al recargar la página.

#### Scenario: Crear producto muestra banner en el listado
- **WHEN** la creación de un producto tiene éxito
- **THEN** el usuario está en `/products` y ve un banner inline de éxito
- **AND** no se renderiza ningún toast

#### Scenario: Eliminar categoría muestra banner sin cambiar de página
- **WHEN** la eliminación de una categoría tiene éxito
- **THEN** el usuario permanece en `/categories` con un banner inline de éxito

#### Scenario: El banner no reaparece al recargar
- **GIVEN** un banner de éxito visible tras una operación
- **WHEN** el usuario recarga la página (F5)
- **THEN** el banner ya no se muestra

### Requirement: Editor WYSIWYG y límites de descripción

El formulario de producto SHALL editar `descripcionLarga` con un editor WYSIWYG Quill que produzca HTML enriquecido, y `descripcionBreve` con un `<input>` de texto plano. Ambos campos SHALL mostrar un contador de texto visible y SHALL impedir el guardado cuando superen 3000 y 800 caracteres respectivamente.

#### Scenario: Editor WYSIWYG en la descripción larga

- **WHEN** se renderiza `/products/new` o `/products/:id`
- **THEN** `descripcionLarga` se edita con un editor Quill que ofrece negrita, cursiva, subrayado, encabezados 2 a 4, listas, enlace, cita y limpiar formato
- **AND** la toolbar no ofrece imágenes, colores, fuentes, alineación ni encabezado `h1`

#### Scenario: Toolbar alineada con la allowlist del backend

- **WHEN** el administrador aplica formato desde la toolbar
- **THEN** solo se generan etiquetas que el backend conserva (`p`, `br`, `strong`/`b`, `em`/`i`, `u`, `ul`, `ol`, `li`, `a`, `blockquote`, `h2`-`h4`)

#### Scenario: Precarga de HTML existente

- **GIVEN** un producto existente con `descripcionLarga` en HTML saneado
- **WHEN** se abre `/products/:id`
- **THEN** el editor muestra el contenido formateado
- **AND** al guardar se emite `PATCH /products/:id` con el HTML enriquecido resultante

#### Scenario: Contador de texto visible

- **WHEN** el administrador escribe o pega contenido en `descripcionLarga`
- **THEN** el formulario muestra el conteo de caracteres de texto visible sobre 3000 y marca error al superarlo
- **AND** para `descripcionBreve` muestra el conteo sobre 800 y marca error al superarlo

#### Scenario: Guardado bloqueado por límite

- **GIVEN** `descripcionLarga` con 3001 caracteres visibles o `descripcionBreve` con 801 caracteres
- **WHEN** el usuario intenta guardar
- **THEN** el botón de guardar permanece deshabilitado y se muestra el mensaje de límite del campo
- **AND** no se emite `POST /products` ni `PATCH /products/:id`
