## Context

El sitio público Astro (apps/web/) ya tiene componentes presentacionales (dumb) establecidos: `HeroBanner.astro`, `SearchForm.astro`, `Footer.astro`, etc. Cada uno recibe datos vía props desde un config hardcoded en `lib/config/`, y los tipos viven en `lib/types/`. `Layout.astro` renderiza chrome global (TopHeader, Header, SearchForm, Footer) y un `<slot />` para el contenido de página.

La imagen `docs/design/components/ContactPage.png` muestra la página de contacto deseada:
- **Hero**: "Conecte con la **Ingeniería de Precisión**" (resaltado en teal) + subtítulo.
- **Formulario**: "Solicitud de Contacto Técnico" con Nombre Completo, Empresa, Correo Electrónico, Teléfono, un grupo de 5 checkboxes "Área de Interés", un textarea "Mensaje", y un botón "ENVIAR MENSAJE →" (naranja/accent).
- **Barra inferior**: teléfono, email e iconos sociales.

Decisiones confirmadas con el usuario:
- Reutilizar `banner_home.webp` como fondo del hero (mismo patrón de `Layout.astro` `hero`).
- El frontend se deja listo para consumir `POST /api/v1/contacts`; el endpoint aún no existe (change backend futuro). Por ahora el form usa submit nativo HTML `method="post"` con `action` configurable.
- La barra inferior de contacto es SOLO para `/contacto` (no chrome global).

## Goals / Non-Goals

**Goals:**
- Página `/contacto` completa siguiendo el patrón dumb-component + config hardcoded del sitio.
- `ContactHero.astro`, `ContactForm.astro`, `ContactBar.astro` presentacionales puros (sin fetching, sin estado de dominio).
- Formulario con submit nativo HTML (`method="post"`, `action` configurable vía env) listo para apuntar a `/api/v1/contacts`.
- Accesibilidad: labels asociados vía `for`/`id`, checkboxes agrupados en `<fieldset>` + `<legend>`, navegación por teclado nativa.
- Cumplir design tokens (flat design, radio 0, sin `shadow*` estático, `bg-accent` para el botón, `text-primary` para el resaltado).
- Tests Vitest (AstroContainer + snapshot) para `ContactForm` y `ContactHero`.

**Non-Goals:**
- NO se implementa el endpoint `POST /api/v1/contacts` en el backend (change futuro).
- NO se hace validación asíncrona ni envío fetch desde el front; submit nativo HTML.
- NO se modifica `Layout.astro` (los componentes se componen dentro de `contacto.astro`).
- NO se añade la página de contacto al menú de navegación global (decisión fuera de alcance; el CTA "ESCRÍBENOS" del HeroBanner ya apunta a `/contacto`, y `cotizacion.astro` sigue existiendo).
- NO se añaden estilos nuevos a `globals.css` (todos los tokens ya existen).

## Decisions

1. **Componentes dumb + config hardcoded**: `ContactHero`, `ContactForm`, `ContactBar` reciben todo por props desde `CONTACT_PAGE_CONTENT` en `lib/config/contact-page.ts`. Cumple SRP Astro (frontmatter sin lógica de negocio no trivial) y el patrón del sitio (`HERO_BANNER_CONTENT`, `SITE_FOOTER_CONTENT`). Alternativa considerada: leer `import.meta.env` dentro del componente → descartada por romper el principio dumb y dificultar testing aislado.

2. **Reutilizar `splitHeadline()` de `lib/config/hero-banner.ts`**: `ContactHero` delega el split del headline resaltado a la misma función pura ya testeada que usa `HeroBanner`. Evita duplicar lógica de split. Alternativa: copiar la función → descartada (duplicación innecesaria).

3. **Submit nativo HTML `method="post"`**: el `<form>` usa `method="post"` y `action={config.action}` (default `/api/v1/contacts`). Sin JS de submit. El backend aún no existe; cuando se implemente, solo se confirma el `action`. Esto maximiza accesibilidad y SSG. Alternativas consideradas: fetch asíncrono con `event.preventDefault()` → descartada (requiere endpoint y complica el MVP); GET → descartada (enviar datos personales por query string es inseguro).

4. **Checkboxes en `<fieldset>` + `<legend>`**: las 5 áreas de interés se agrupan semánticamente con `<fieldset>` y `<legend>` "Área de Interés". Cada checkbox tiene `<label>` asociado. Cumple WAI-ARIA y accesibilidad (igual patrón que grupos de radio en formularios estándar).

5. **Barra inferior solo en `/contacto`**: `ContactBar` se renderiza dentro de `contacto.astro`, no en `Layout.astro`. Reutiliza `getContactInfo()` de `lib/config/contact.ts` (la misma fuente de TopHeader/Footer) para teléfono e iconos sociales, manteniendo single source of truth. El email usa `contacto@riff.cl` hardcodeado en config (consistente con `cotizacion.astro`).

6. **Tokens y flat design**: el botón usa `bg-accent` (naranja `#F26A21`) con icono `lucide:arrow-right`; el resaltado del hero usa `text-primary`. Sin `rounded*` (radio 0) ni `shadow*` estáticos. Responsive: formulario en grid de 1 columna en mobile, 2 columnas en desktop (nombre/empresa y email/teléfono en pares); checkboxes en grid de 1-2 columnas; textarea full-width.

7. **Página `contacto.astro` NO usa imagen de hero**: corrección del cliente posterior a `/apply`. La página se renderiza con `hero={false}` (sin `banner_home.webp` ni overlay) y `showSearch={false}` (oculta el buscador global, ver Decisión 11). El `<slot />` se envuelve en un `<div class="bg-primary-deep">` (teal profundo `#006874`) que actúa como fondo de toda la zona de contenido; dentro van `ContactHero` + `ContactForm` + `ContactBar`.

8. **Fondo azul sólido `#006874`, sin imagen (corrección)**: el fondo detrás de la caja del formulario es azul sólido. El cliente confirmó el valor exacto **`#006874`**, que corresponde al token `--color-primary-deep` (`bg-primary-deep`) del style-guide ("Teal profundo · fondo de secciones destacadas"). El formulario vive dentro de una **caja blanca** (`bg-white` + borde 1px, sin `rounded*` ni `shadow*`) centrada con `max-w-3xl`, de modo que el azul quede visible a su alrededor ("todo el fondo detrás de esa caja"). El texto blanco del hero tiene contraste accesible sobre `#006874`.

9. **Formulario dentro de una caja (card)**: `ContactForm.astro` deja de ser full-width y pasa a ser una tarjeta blanca centrada. La estructura cambia a `<div class="container ...">` → `<form class="bg-white mx-auto max-w-3xl border border-border">` → `<div class="px-6 py-10 ...">` con el contenido. Flat design: borde 1px (no sombra, no esquinas redondeadas).

10. **Botón submit a todo ancho, centrado, con flecha separada**: el `<button type="submit">` usa `w-full flex items-center justify-center gap-3` (o `gap-2`); el bloque texto+icono va **centrado** en el botón y el icono `lucide:arrow-right` (decorativo, `aria-hidden="true"`) lleva una separación elegante del texto (gap) para no quedar pegado. Mantiene `bg-accent`.

11. **Ocultar el buscador global en `/contacto`**: `Layout.astro` recibe una nueva prop `showSearch?: boolean = true` y omite renderizar `<SearchForm />` cuando es `false`. `contacto.astro` la pasa como `false`. Esto es la única modificación a `Layout.astro` en este change (el change original declaraba "no modificar Layout"; la corrección lo requiere explícitamente). Alternativa considerada: ocultar vía CSS en la página → descartada por ser menos explícita y dejar el componente montado en el DOM.

12. **Barra de contacto debajo del formulario, mismo fondo, alineada a su ancho (corrección)**: `ContactBar` se renderiza **debajo** de `ContactForm` (ya está en ese orden en `contacto.astro`) y usa el **mismo fondo** que la página (`bg-primary-deep` / transparente sobre el wrapper azul) para NO parecer un footer independiente. Teléfono, email e iconos sociales se muestran en una sola fila centrada. Esto evita el efecto "parece parte del footer".

13. **Ajustes de ritmo vertical y ancho (corrección del cliente en navegador)**:
    - **a. Separación título/subtítulo ↔ formulario reducida a ~16px móvil / ~32px desktop**: el padding inferior de `ContactHero` se pone a `pb-0` y el padding superior del contenedor de `ContactForm` se pone a `pt-0`; el hueco exacto se aporta con un espaciador en `contacto.astro` (`h-4 sm:h-8`, 16/32px) ubicado entre el hero y el formulario. Antes, el hueco era ~112px (pb-16 del hero + pt-12 del form).
    - **b. El formulario ocupa el ancho completo del contenido de página, igual que el header**: se elimina `mx-auto max-w-3xl` de la caja blanca del formulario; la caja pasa a llenar el `container` (mismo ancho y mismos márgenes laterales `px-4 sm:px-6 lg:px-8` que usa el header del sitio). En consecuencia, `ContactBar` también deja `max-w-3xl` y pasa a usar `container mx-auto px-4 sm:px-6 lg:px-8`, de modo que teléfono/email/redes quedan alineados al mismo ancho que el formulario.
    - **c. Línea divisoria de 1px `#41B3C4` sobre teléfono/email/redes**: `ContactBar` incluye, como primer elemento de su contenedor, una línea `<div class="border-t border-primary ...">` (1px, color `--color-primary` = `#41B3C4`) que recorre **todo el ancho del formulario** (mismo contenedor). La línea lleva padding equivalente arriba y abajo (`my-4 sm:my-8`, 16/32px) para separar el bloque superior (hero + formulario) del bloque inferior (datos de contacto), cumpliendo "separando ambos contenidos con un padding equivalente". Con este cambio, el padding inferior del contenedor del formulario se pone a `pb-0` para que la separación la gobierne la línea.

14. **Alineación de la barra: teléfono/correo a la izquierda, redes sociales a la derecha (corrección final)**: el contenido de `ContactBar` se distribuye en fila en `sm+` con `sm:justify-between`. Un **grupo izquierdo** contiene el teléfono y el correo (pegados al borde izquierdo del contenedor) y el `<nav>` de redes sociales queda **pegado al borde derecho**. Esto reemplaza el centrado previo (`sm:justify-center`) de las Decisiones 12/13. En móvil (`flex-col items-start`) los ítems se apilan alineados a la izquierda. Se logra envolviendo teléfono+correo en un `<div class="flex items-center gap-2 sm:gap-8">` y dejando el `<nav>` como hermano del grupo, con el contenedor padre en `sm:flex-row sm:items-center sm:justify-between`.

## Risks / Trade-offs

- **Risk**: El token de azul elegido (`bg-primary-deep` #006874) no es el que el cliente imaginaba. → **Mitigation**: valor confirmado explícitamente por el cliente en la corrección; es el token canónico `--color-primary-deep` del style-guide.
- **Risk**: Al centrar el formulario en una caja `max-w-3xl`, en viewport muy angosto el azul apenas se ve a los lados. → **Mitigation**: el wrapper azul lleva padding vertical generoso (`py-16 md:py-24`) y el form conserva `mx-auto` dentro del `container`, así el azul rodea la caja en todo tamaño.

## Open Questions

- ¿El endpoint `POST /api/v1/contacts` usará el mismo esquema de respuesta `Envelope`? Se confirma en el change backend futuro.
- ¿Se debe agregar `/contacto` al menú de navegación global del Header? Fuera de alcance; el CTA del HeroBanner ya enlaza a `/contacto`.
- **Resuelto (corrección)**: ¿Color de fondo? Confirmado por el cliente: `#006874` = token `bg-primary-deep` (teal profundo del style-guide).

- **Risk**: El endpoint `POST /api/v1/contacts` no existe → el submit dará 404/405 temporalmente. → **Mitigation**: `action` configurable vía env (`CONTACT_FORM_ACTION` default `/api/v1/contacts`); el change backend futuro lo implementa. El form es funcional y accesible hoy; solo falta el destino.
- **Risk**: Divergencia de copy entre `cotizacion.astro` y la nueva página → **Mitigation**: ambas viven en el sitio; `cotizacion.astro` sigue siendo el destino del flujo de cotización, `contacto.astro` es la página de contacto general. No se elimina `cotizacion.astro` en este change.
- **Trade-off**: Submit nativo `post` sin feedback de éxito/error en el cliente → aceptado para el MVP; el change backend futuro puede añadir redirect o mensaje. El form nativo es prog. enhancement mínimo.
- **Trade-off**: Config hardcoded vs CMS → consiste con el resto del sitio SSG; el change `contentful-from-cms` futuro reemplazará los configs sin tocar componentes.

## Migration Plan

- No requiere migración de datos ni cambios de API (`docs/api-spec.yml` invariante en este change).
- Deploy: build SSG estándar; la nueva página `/contacto` se genera en el build.
- Rollback: revertir el commit del change `contact-page` — `contacto.astro` y los tres componentes se eliminan; el sitio vuelve a su estado previo.

## Open Questions

- ¿El endpoint `POST /api/v1/contacts` usará el mismo esquema de respuesta `Envelope` (`{ data, error, meta }`) que el resto del API? Se confirma en el change backend futuro.
- ¿Se debe agregar `/contacto` al menú de navegación global del Header? Fuera de alcance de este change; el CTA del HeroBanner ya enlaza a `/contacto`.
