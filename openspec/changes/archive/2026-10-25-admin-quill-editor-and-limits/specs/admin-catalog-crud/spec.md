# Spec Delta

## ADDED Requirements

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
