# Design

## Context

Ver `proposal.md` para la motivación. El estado actual relevante es:

- El formulario admin (`apps/admin/src/features/catalog/pages/producto-form-page.component.ts`) usa un `<textarea rows="4">` para `descripcionLarga` y un `<input type="text">` para `descripcionBreve`, sin validadores de longitud. Es un componente standalone de Angular 22 con Reactive Forms.
- El backend ya sanea `descripcionLarga` con `sanitizeRichHtml` y aplana `descripcionBreve` con `stripHtmlToText` en `ProductoConsistencyService`; la escritura pasa por `ProductoWriteService` y también por el seed.
- Astro renderiza la descripción larga con `set:html` sobre el HTML ya saneado (`apps/web/src/pages/productos/[slug].astro:97`). No se cambia ese contrato.
- `TechnicalDocs.astro` ya alterna entre descarga y CTA a `/contacto`; solo cambia el texto y la semántica del enlace de descarga.
- Restricciones: Angular 22, Tailwind v4, `class-validator` en el backend y la política compartida `@riff/html-sanitize`.

## Goals / Non-Goals

**Goals:**

- Editar `descripcionLarga` con WYSIWYG que produzca HTML compatible con la allowlist del backend.
- Validar 800/3000 caracteres de **texto visible** en Angular (con contador) y en el backend, sin romper el contenido existente.
- Ajustar el enlace de ficha técnica a “Descargar ficha técnica” con `download`.
- Mantener intacta la sanitización y el renderizado `set:html`.

**Non-Goals:**

- Cambiar la allowlist de `sanitizeRichHtml`, el renderizado de Astro o el formato de almacenamiento.
- Migrar o reescribir descripciones existentes.
- Añadir WYSIWYG a `descripcionBreve`.
- Rediseñar la página de detalle o la sección de documentación.

## Decisions

### D1. Usar `ngx-quill` 31 + `quill` 2

**Decisión:** agregar `ngx-quill@^31.0.1` y `quill@^2.0.3` al workspace admin y usar `<quill-editor formControlName="descripcionLarga" format="html">`.

**Por qué:** `ngx-quill@31` declara peer `@angular/core ^22.0.0` y `quill ^2.0.0`, por lo que encaja con el stack actual. Expone integración con Reactive Forms, `maxLength`, eventos de contenido y configuración global standalone (`provideQuillConfig`). Un editor propio con `contenteditable` o TipTap añadiría más superficie y mantenimiento sin beneficio para este alcance.

**Alternativas descartadas:** mantener el textarea (no cumple WYSIWYG); editor propio (coste y riesgo XSS); TipTap (más dependencias y configuración para el mismo resultado).

### D2. Toolbar alineada con la allowlist del sanitizador

**Decisión:** configurar Quill globalmente en `apps/admin/src/app/app.config.ts` con `provideQuillConfig`, limitando formatos a: `bold`, `italic`, `underline`, `header: [2, 3, 4]`, `list: ordered/bullet`, `link`, `blockquote` y `clean`. Importar `quill/dist/quill.snow.css` desde `apps/admin/src/styles/globals.css` (o `angular.json`).

**Por qué:** el backend descarta cualquier etiqueta fuera de `p, br, strong/b, em/i, u, ul, ol, li, a, blockquote, h2-h4`. Si Quill ofrece imágenes, colores, fuentes o `h1`, el administrador vería formato que desaparece al guardar. Limitar la toolbar evita esa pérdida silenciosa y reduce el HTML que viaja y se sanea.

**Alternativas descartadas:** toolbar completa y confiar solo en la sanitización (pérdida visible de formato); post-procesar el HTML en el cliente (duplica la política del backend).

### D3. Límites medidos sobre texto visible

**Decisión:** el límite cuenta caracteres de texto visible, no markup.

- **Angular:** `descripcionBreve` usa `Validators.maxLength(800)`. `descripcionLarga` usa un validador propio `visibleTextLength(3000)` que elimina `script`/`style`, quita etiquetas y decodifica entidades antes de contar. El contador del template usa la misma función. Se complementa con `[maxLength]="3000"` de `ngx-quill` como ayuda de edición.
- **Backend:** `descripcionBreve` usa `@MaxLength(800)` (el contrato del campo es texto plano). `descripcionLarga` usa un decorador `class-validator` propio, `@MaxVisibleTextLength(3000)`, apoyado en un helper del paquete compartido que elimina markup y contenido no textual antes de medir. Además, `ProductoConsistencyService` revalida la longitud **después** de `sanitizeRichHtml`/`stripHtmlToText`, que es la fuente de verdad.
- **Rechazo:** `400 Bad Request` con mensaje por campo, coherente con el `ValidationPipe` global.

**Por qué no `@MaxLength(3000)` plano en la larga:** contaría el HTML y rechazaría el producto existente `KIT-MWN-HRI-3G` (4935 caracteres crudos, ~2898 visibles). El usuario confirmó que el límite debe medirse sobre texto visible.

**Por qué el doble chequeo backend:** el DTO valida el payload crudo y el servicio valida el valor ya saneado. Así se garantiza el invariante almacenado aunque el HTML de entrada cambie de tamaño al sanitizarse.

**Alternativas descartadas:** validar solo en Angular (evadible por API); validar solo en el servicio (errores menos específicos y sin contrato en el DTO).

### D4. Sin migración de datos

**Decisión:** no se agrega script de migración ni se reescriben documentos.

**Por qué:** la medición sobre texto visible deja el catálogo actual dentro de los límites: `descripcionBreve` máxima 765 (límite 800) y `descripcionLarga` máxima ~2898 (límite 3000). Se agregará una prueba de regresión sobre el seed que verifica ambos invariantes. El producto de 4935 caracteres crudos sigue siendo válido porque su texto visible es ~2898.

### D5. Ficha técnica: texto y atributo `download`

**Decisión:** en `TechnicalDocs.astro`, cuando existe `fichaTecnica`, el enlace muestra “Descargar ficha técnica” (con el nombre del archivo como subtítulo), conserva el icono `lucide:download` y añade `download`. Sin ficha se mantiene “Solicitar ficha técnica” hacia `/contacto`.

**Por qué:** cumple el requisito de negocio sin tocar la condición de existencia ni el layout. No se agrega `target="_blank"` para no alterar el comportamiento actual; el atributo `download` es la señal solicitada.

### D6. Estrategia de pruebas (TDD)

- Primero tests fallidos: validador Angular de texto visible, contador y bloqueo de guardado; validador backend y servicio; tests de `TechnicalDocs`; invariante del seed.
- Luego implementación por capas: shared helper → backend → admin → web.
- Cierre: `npx openspec validate --all --strict` y `make ci`.

### D7. Contención visual de la descripción larga

**Decisión:** el contenedor de `descripcionLarga` en la página de detalle incluye `max-w-full`, `min-w-0` y `break-words`, y `.rich-text` declara `overflow-wrap: anywhere` y `word-break: break-word`. Los hijos directos del bloque enriquecido limitan su ancho al 100 %.

**Por qué:** el HTML generado por Quill puede contener URLs o palabras sin espacios que, por defecto, desbordan la columna de contenido y producen scroll horizontal. La contención debe resolverse en el render (Astro + CSS), no recortando el contenido con `overflow: hidden`, para que el texto siga siendo legible y seleccionable.

## Risks / Trade-offs

- **Quill puede generar markup no permitido por atajos de teclado** → limitar `formats` en la configuración global y mantener la sanitización del backend como red de seguridad.
- **Diferencia entre el conteo del cliente y del servidor** → misma definición de “texto visible”, casos de prueba compartidos (markup, entidades, `script`/`style`) y backend como autoridad final.
- **Peso del bundle de Quill** → la ruta del formulario ya es lazy; importar solo el tema `snow`.
- **`download` ignorado en URLs cross-origin** (Firebase Storage) → el enlace sigue funcionando como navegación; el requisito se cumple con el atributo y no se depende de él para la descarga.
- **`@MaxLength(800)` crudo en la breve** podría rechazar un payload con HTML envolvente y menos de 800 visibles → el contrato del campo es texto plano y el admin envía texto plano; el servicio valida además el valor aplanado.
- **Quill en tests jsdom** → los tests del formulario ya usan TestBed/jsdom; si Quill requiere APIs no disponibles, se mockea el componente en el test sin cambiar el comportamiento de producción.

## Migration Plan

1. Backend: constantes, validador de texto visible, decoradores DTO y chequeo post-normalización + tests.
2. Admin: dependencias, configuración Quill, validador/contador, editor + tests.
3. Web: `TechnicalDocs` + test.
4. Documentación de contrato (`docs/api/api-spec.yml`) y validación completa.

No hay migración de datos. Rollback: retirar decoradores/validador y el editor Quill; los documentos existentes no se modifican, por lo que no hay rollback de datos.

## Open Questions

Ninguna. La semántica de “texto visible” y la ausencia de migración quedaron resueltas antes de escribir los artefactos.
