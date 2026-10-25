# Proposal

## Why

El panel de administración edita la descripción larga como un `<textarea>` plano y ninguno de los dos campos de descripción tiene límite de longitud. Esto impide aprovechar el HTML enriquecido que el backend y Astro ya soportan, y deja abierta la puerta a textos desmedidos o a ediciones que el modelo no acota. Además, el botón de descarga de la ficha técnica no coincide con el texto ni con la semántica de descarga que espera el negocio.

## What Changes

- **Editor WYSIWYG para la descripción larga**: se integra `ngx-quill` 31 + `quill` 2 en el formulario de producto. El campo sigue persistiendo HTML enriquecido; la sanitización con `sanitizeRichHtml` en el backend y el renderizado con `set:html` en Astro se mantienen.
- **Toolbar alineada con la allowlist del backend**: Quill solo ofrece formatos que `sanitizeRichHtml` conserva (`bold`, `italic`, `underline`, `header 2-4`, listas, `link`, `blockquote`, `clean`). Nada de imágenes, colores, fuentes ni `h1`.
- **Descripción breve**: se mantiene como `<input>` de texto plano; el backend sigue aplicando `stripHtmlToText`.
- **Límites de longitud**: descripción breve **800** caracteres y descripción larga **3000** caracteres. Ambos se miden sobre **texto visible** (sin contar markup HTML) y se validan en Angular (con contador visual) y en el backend (DTO + comprobación posterior a la normalización).
- **Validador backend para HTML**: la descripción larga usa un validador `class-validator` que cuenta texto visible, porque `@MaxLength` plano contaría el markup y rechazaría contenido válido existente. La breve usa `@MaxLength(800)`.
- **Ficha técnica**: el botón con ficha pasa a “Descargar ficha técnica” y añade el atributo `download`; sin ficha se mantiene “Solicitar ficha técnica” hacia `/contacto`.
- **Sin migración de datos**: los 71 productos existentes quedan dentro de los límites al medir texto visible (breve máx. 765; larga máx. ~2898). No se reescriben documentos.

**BREAKING**: las escrituras que superen los nuevos límites de texto visible pasan a ser rechazadas por la API. No afecta a los datos existentes.

## Capabilities

### New Capabilities

Ninguna. El comportamiento encaja en capacidades existentes.

### Modified Capabilities

- `admin-catalog-crud`: el formulario incorpora el editor Quill para la descripción larga, contadores y validación de longitud visible (800/3000).
- `backend-productos`: la API valida longitudes máximas de descripciones (800 breve, 3000 larga en texto visible) además de la sanitización vigente.
- `product-description-html`: la política compartida de descripciones fija que los límites se miden sobre texto visible y que no se requiere migración de datos.
- `product-detail-page`: el enlace de ficha técnica existente muestra “Descargar ficha técnica” y expone el atributo `download`.

## Impact

- **Admin (`apps/admin`)**: `package.json` (nuevas dependencias), `app.config.ts` (configuración global de Quill), `producto-form-page.component.ts/.html`, estilos, util de longitud visible, tests del formulario.
- **Backend (`apps/backend`)**: `producto-create.dto.ts`, `producto-update.dto.ts`, nuevo validador de texto visible, `producto-consistency.service.ts` / `producto-write.service.ts` y sus tests.
- **Web (`apps/web`)**: `TechnicalDocs.astro` y su test.
- **Docs/contrato**: `docs/api/api-spec.yml` (límites y semántica de texto visible).
- **Dependencias**: `ngx-quill@^31.0.1` y `quill@^2.0.3` en el workspace admin (peer compatible con Angular 22).
- **Datos**: sin migración; se verifica que el seed actual cumple los límites.
- **Fuera de alcance**: cambiar la sanitización de HTML, sustituir `set:html`, añadir migración de descripciones, editar la descripción breve con WYSIWYG o rediseñar la página de detalle.
