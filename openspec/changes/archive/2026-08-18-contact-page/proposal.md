## Why

El sitio público Astro (apps/web/) carece de una página de contacto. La imagen de referencia `docs/design/components/ContactPage.png` entregada por el cliente muestra una página dedicada con hero, formulario de contacto técnico y barra de información de contacto. Hoy el único punto de contacto es un placeholder en `cotizacion.astro` (texto + mailto/tel). Este change entrega la página `/contacto` completa siguiendo el mismo patrón de componentes presentacionales (dumb) y config hardcoded ya establecido en el sitio.

El formulario queda listo para consumir `POST /api/v1/contacts` cuando el backend implemente ese endpoint (change futuro); por ahora el submit es nativo HTML `method="post"` con `action` configurable, sin dependencia del backend para el render.

## What Changes

- Nueva página `apps/web/src/pages/contacto.astro` que usa `Layout.astro` en modo `hero` (reutiliza `banner_home.webp` como fondo del hero)
- Nuevo componente presentacional `ContactHero.astro` (headline con palabra resaltada en `text-primary` + subtítulo)
- Nuevo componente presentacional `ContactForm.astro` (4 inputs + 5 checkboxes agrupados en `<fieldset>` + textarea + botón submit con `bg-accent`)
- Nuevo componente presentacional `ContactBar.astro` (teléfono clickeable + email clickeable + iconos sociales), solo en `/contacto`
- Tipos TypeScript `ContactFormProps`, `ContactAreaInteres`, `ContactHeroProps`, `ContactBarProps` en `apps/web/src/lib/types/contact-form.ts`
- Config hardcoded `CONTACT_PAGE_CONTENT` en `apps/web/src/lib/config/contact-page.ts`
- Tests Vitest (unit + AstroContainer + snapshot) para `ContactForm` y `ContactHero`
- No se modifica `Layout.astro` (los tres componentes se componen dentro de `contacto.astro`, no son chrome global)

## Capabilities

### New Capabilities
- `contact-page`: Página de contacto del sitio público con hero, formulario de contacto técnico (nombre, empresa, email, teléfono, áreas de interés, mensaje) y barra inferior de información de contacto; todos los componentes son presentacionales (dumb) alimentados por config hardcoded; el formulario usa submit nativo HTML `method="post"` hacia un endpoint configurable (preparado para `POST /api/v1/contacts`).

### Modified Capabilities
<!-- (ninguna — no se modifican specs existentes; el change es aditivo y aislado en la página /contacto) -->

## Impact

- `apps/web/src/pages/contacto.astro` — nueva página
- `apps/web/src/components/ContactHero.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/components/ContactForm.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/components/ContactBar.astro` — nuevo componente presentacional (dumb)
- `apps/web/src/lib/types/contact-form.ts` — interfaces TypeScript nuevas
- `apps/web/src/lib/config/contact-page.ts` — contenido hardcoded de la página
- `apps/web/src/components/__tests__/ContactForm.test.ts` — tests AstroContainer + snapshot
- `apps/web/src/components/__tests__/ContactHero.test.ts` — tests AstroContainer + snapshot
- No requiere cambios en `docs/api-spec.yml` (el endpoint `POST /api/v1/contacts` es un change backend futuro; este change solo deja el frontend listo para consumirlo)
- No requiere cambios en `docs/data-model.md`
- No modifica `Layout.astro` (los componentes se componen dentro de `contacto.astro`)
