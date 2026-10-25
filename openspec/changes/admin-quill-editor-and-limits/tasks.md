# Tasks

## 1. Dependencias y configuración de Quill

- [x] 1.1 Instalar las dependencias del editor en el workspace admin con `npm install ngx-quill@^31.0.1 quill@^2.0.3 --workspace=apps/admin` y verificar con `npm ls ngx-quill quill --workspace=apps/admin` que no haya peer conflicts
- [x] 1.2 Importar `quill/dist/quill.snow.css` en `apps/admin/src/styles/globals.css` y verificar que `npm run typecheck --workspace=apps/admin` compila
- [x] 1.3 Configurar `provideQuillConfig` en `apps/admin/src/app/app.config.ts` con la toolbar y `formats` limitados a la allowlist (`bold`, `italic`, `underline`, `header 2-4`, listas, `link`, `blockquote`, `clean`) y verificar con el test de `app.config.test.ts` que el provider se registra

## 2. Backend: medición de texto visible y límites

- [x] 2.1 Escribir primero los tests fallidos del helper de longitud visible en `packages/html-sanitize` (markup, entidades, `script`/`style`, texto plano) y verificar que fallan con `npm test --workspace=packages/html-sanitize`
- [x] 2.2 Implementar el helper de longitud visible en `packages/html-sanitize/src/index.ts` y verificar que los tests de 2.1 pasan con `npm test --workspace=packages/html-sanitize`
- [x] 2.3 Escribir primero los tests fallidos del decorador `@MaxVisibleTextLength` y de los límites de DTO (breve 800 exacto/801; larga con markup y 3000/3001 visibles) en `apps/backend/src/productos/infrastructure/`, y verificar que fallan con `npm test --workspace=apps/backend -- producto`
- [x] 2.4 Implementar el decorador y aplicarlo en `producto-create.dto.ts` y `producto-update.dto.ts` (`descripcionBreve` con `@MaxLength(800)`, `descripcionLarga` con `@MaxVisibleTextLength(3000)`), y verificar que los tests de 2.3 pasan
- [x] 2.5 Agregar la revalidación posterior a la sanitización en `ProductoConsistencyService` (respuesta `400` con mensaje por campo) con tests primero en `producto-consistency.service.spec.ts` y `producto-write.service.spec.ts`, y verificar con `npm test --workspace=apps/backend -- producto`
- [x] 2.6 Agregar un test de regresión que mida el seed (71 productos) y compruebe que toda `descripcionBreve` ≤ 800 y toda `descripcionLarga` ≤ 3000 caracteres visibles, y verificar con `npm test --workspace=apps/backend -- seed`
- [x] 2.7 Actualizar `docs/api/api-spec.yml` con los límites 800/3000 y la semántica de texto visible, y verificar en el diff que `Producto`, `ProductoCreate` y `ProductoUpdate` documentan ambos límites sin romper el formato OpenAPI existente

## 3. Admin: editor WYSIWYG, contadores y validación

- [x] 3.1 Escribir primero los tests fallidos de la utilidad `visibleTextLength` y del validador Angular (texto plano, markup, entidades, `script`/`style`, límites 800/3000) y verificar que fallan con `npm test --workspace=apps/admin`
- [x] 3.2 Implementar la utilidad y el validador de longitud visible, y verificar que los tests de 3.1 pasan
- [x] 3.3 Escribir primero los tests fallidos del formulario: `descripcionLarga` se renderiza con `<quill-editor>` y no con `<textarea>`, `descripcionBreve` sigue siendo `<input>`, los contadores muestran el texto visible y el guardado se bloquea al superar los límites
- [x] 3.4 Implementar en `producto-form-page.component.ts/.html` el `<quill-editor formControlName="descripcionLarga" format="html">`, los validadores, los contadores y los mensajes de error; mantener la precarga del HTML existente y el payload actual
- [x] 3.5 Verificar el grupo completo con `npm test --workspace=apps/admin`, `npm run lint --workspace=apps/admin` y `npm run typecheck --workspace=apps/admin`

## 4. Web: enlace de ficha técnica

- [x] 4.1 Escribir primero los tests fallidos de `TechnicalDocs` que esperan el texto “Descargar ficha técnica” y el atributo `download` cuando hay PDF, manteniendo “Solicitar ficha técnica” hacia `/contacto` cuando no lo hay
- [x] 4.2 Implementar el cambio en `apps/web/src/components/TechnicalDocs.astro` y verificar con `npm test --workspace=apps/web -- TechnicalDocs`
- [x] 4.3 Verificar que la página de detalle sigue renderizando correctamente con `npm test --workspace=apps/web -- productos`

## 5. Integración y validación

- [x] 5.1 Ejecutar `npx openspec validate --all --strict` y corregir cualquier error de specs o del change
- [x] 5.2 Ejecutar `make ci` (openspec-validate + lint + typecheck + build + test-ci + audit) y corregir los fallos
- [ ] 5.3 Verificar manualmente en el panel que `/products/new` muestra Quill, el contador y el bloqueo por límite, y que `/productos/[slug]` muestra la ficha técnica como “Descargar ficha técnica” con `download`
- [x] 5.4 Confirmar que no se agregó ningún script de migración de descripciones y que el test de regresión del seed de 2.6 pasa

## 6. Corrección post-apply: contención de la descripción larga

- [x] 6.1 Escribir primero los tests fallidos que verifican el contenedor `max-w-full`/`min-w-0`/`break-words`, las reglas de wrapping de `.rich-text` y la ausencia de overflow horizontal
- [x] 6.2 Aplicar las clases y reglas CSS de contención en `apps/web/src/pages/productos/[slug].astro` y `apps/web/src/styles/globals.css`
- [x] 6.3 Ejecutar `npx openspec validate --all --strict` y `make ci` y corregir cualquier fallo
