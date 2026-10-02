# User Story enriched: feat/web-home-contact-tweaks

**As a** visitante del sitio Riff (cliente potencial)
**I want** ver el correo correcto en todos los lugares donde se muestra, navegar desde las tarjetas de servicios del home hasta el servicio respectivo con scroll suave, y enlazar los productos destacados claramente a su ficha de detalle
**So that** puedo contactar a Riff por el canal correcto y explorar la oferta sin puntos muertos ni fricción

Capas afectadas: frontend

## Context

Ajustes menores de contenido y navegación en el frontend Astro (`apps/web`), tres tweaks independientes sobre el patrón site-wide de componentes dumb + configs hardcodeadas en `lib/config/`:

1. **Contacto**: el correo Riff mostrado en el sitio vive en dos lugares de producción:
   - `CONTACT_EMAIL` / `CONTACT_EMAIL_HREF` en `apps/web/src/lib/config/contact-page.ts` (líneas 69-70), renderizado por `ContactBar.astro` en `/contacto` (texto + `mailto:`).
   - `mailto:contacto@riff.cl` hardcodeado en `apps/web/src/pages/productos/[slug].astro` (línea 82), fallback del bloque cotizar de la ficha de producto.
   La página `/cotizacion` **no muestra email** (solo teléfono vía `CotizacionSupport.astro`); el comentario de `contact-page.ts` que afirma que la hardcodea está desactualizado y debe corregirse en este cambio.
2. **Servicios (home)**: `ServicesSection.astro` enlaza cada tarjeta a `service.href` = `/servicios` genérico (sin ancla). La página `/servicios` renderiza 4 `ServiceCard` **sin atributos `id`** — no existen targets de scroll. `SERVICES_DATA` (home) ya tiene `slug` por servicio (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`), pero `ServicePageService` (`lib/config/services-page.ts`) no tiene campo slug.
3. **Destacados (home)**: `DestacadosSection.astro` renderiza el CTA de tarjeta con texto hardcodeado `"Cotizar"` (línea 89) y `href={/productos/${product.slug}}` — el href **ya** apunta a la ficha de detalle; el cambio real es el texto.

## Respuestas de clarificación (confirmadas por el usuario, 2026-09-30)

1. **¿Alcance del cambio de correo?** → Aplica a **todos los lugares donde se muestre el correo** (no solo /contacto): `contact-page.ts` + fallback `mailto` de `/productos/[slug].astro`. `/cotizacion` verificado sin email — nada que cambiar ahí.
2. **¿Texto exacto del botón en Destacados?** → Sí, exactamente `"Ver detalles"` (igual que las tarjetas de servicios).
3. **¿View Transitions globales?** → Confirmado: activar `<ClientRouter />` en todo el sitio, entendiendo la superficie de regresión.

## Diseño de Clases/Componentes

- `lib/config/contact-page.ts` (config): responsabilidad única = "coordenadas de contacto canónicas de /contacto" → `CONTACT_EMAIL`/`CONTACT_EMAIL_HREF` pasan a `contacto@somosriff.cl` / `mailto:contacto@somosriff.cl`; corregir el comentario desactualizado sobre `cotizacion.astro`.
  - Depende de: tipos `contact-form`; NO de componentes concretos. Capa: infrastructure (config SSG).
- `pages/productos/[slug].astro` (página): el fallback `mailto` del bloque cotizar pasa de `contacto@riff.cl` a `contacto@somosriff.cl` (valor hardcodeado, mismo patrón actual).
  - Capa: infrastructure (página SSG).
- `ServicesSection.astro` (dumb): responsabilidad única = "renderizar la sección de servicios del home" → CTA por tarjeta apunta a `/servicios#${service.slug}` (reutiliza el `slug` ya existente en `Service`).
  - Depende de: `ServicesSectionProps`; NO de la página /servicios. Capa: dumb.
- `ServicePageService` + `lib/config/services-page.ts` (contrato + config): añadir campo `slug` (kebab-case, 1:1 con los slugs del home) para anclas estables.
  - Capa: infrastructure.
- `ServiceCard.astro` (dumb): renderizar `id={slug}` en el `<article>` raíz (target de ancla) + `scroll-margin-top` para compensar el header sticky.
  - Depende de: `ServiceCardProps`; NO del home. Capa: dumb.
- `Layout.astro` (layout compartido): añadir `<ClientRouter />` (Astro 7 — View Transitions) en `<head>`; adaptar `initHeaderScrollState` para re-inicializar en `astro:page-load`.
  - Capa: infrastructure (layout compartido).
- `DestacadosSection.astro` (dumb): texto del CTA de tarjeta `"Cotizar"` → `"Ver detalles"` (un solo uso, texto ya inline en el componente).
  - Capa: dumb.

## Acceptance Criteria

### SC-001: Correo correcto en /contacto
- Given un visitante en la página `/contacto`
- When visualiza la barra de contacto (`ContactBar`) debajo del formulario
- Then el correo mostrado es `contacto@somosriff.cl` y el enlace es `mailto:contacto@somosriff.cl`

### SC-002: Scroll suave home → servicio respectivo (View Transitions)
- Given un visitante en el home, sección "Servicios especializados" (`ServicesSection`)
- When hace clic en "Ver detalles" de una tarjeta de servicio (ej. "Medición Industrial")
- Then navega a `/servicios` mediante View Transitions (transición de vista elegante) y la página hace scroll suave hasta la tarjeta correspondiente (ancla `id="medicion-industrial"`), dejándola visible bajo el header sticky

### SC-003: Botones de Destacados → "Ver detalles" a la ficha
- Given un visitante en el home, sección "Soluciones Destacadas" (`DestacadosSection`)
- When hace clic en el botón de cualquier tarjeta de producto
- Then el texto visible del botón es exactamente "Ver detalles" y navega a la ficha de detalle `/productos/{slug}` del producto correspondiente

### SC-004: Correo correcto en el fallback mailto de la ficha de producto (alcance ampliado)
- Given un visitante en una ficha de producto `/productos/{slug}` publicada
- When visualiza el bloque cotizar (fallback de contacto por email)
- Then el enlace es `mailto:contacto@somosriff.cl` (ya no `contacto@riff.cl`)

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Deep link directo a `/servicios#medicion-industrial` (sin pasar por el home) | ClientRouter/navegador hace scroll al ancla; `scroll-margin-top` deja la tarjeta visible bajo el header sticky |
| Slug del home sin tarjeta `id` correspondiente en /servicios | Test de contrato garantiza mapeo 1:1 (`SERVICES_DATA` slugs ≡ ids de /servicios); si no coincide, aterriza al tope de /servicios (degradación grácil, sin error) |
| `prefers-reduced-motion: reduce` | View Transitions y smooth scroll degradan a salto instantáneo (Astro lo respeta por defecto; el CSS `scroll-behavior: smooth` se gatea con `@media (prefers-reduced-motion: no-preference)`) |
| Navegador sin soporte de View Transitions | Astro hace fallback a navegación MPA normal; el scroll al ancla funciona nativo |
| Navegación client-side post-ClientRouter | `initHeaderScrollState` debe re-inicializar en `astro:page-load` o el comportamiento de scroll del header se rompe (regresión) |
| Correos de formulario (`correo@empresa.com`, `juan.perez@empresa.com`) | Son placeholders del visitante, NO el correo de Riff — fuera de alcance, no se modifican |
| Comentario desactualizado en `contact-page.ts` sobre `cotizacion.astro` | Se corrige en este cambio: /cotizacion no muestra email (solo teléfono) |

## Estimación
Complejidad: M
Justificación: cada tweak aislado es XS, pero habilitar `<ClientRouter />` es un cambio transversal (afecta la navegación de todas las páginas y todos los listeners JS existentes) y exige adaptar el script de scroll-state + revisar la suite de tests.

## Riesgo
Nivel: Medio
Motivo: la activación global de View Transitions es cross-cutting — superficie de regresión en header scroll state, menú móvil y SearchForm; los tests de render completo (string matching) pueden romperse con el router client-side. Los cambios de correo y de texto son riesgo Bajo (cambios de config/texto aislados).

## Dependencias
Tickets relacionados: `contentful-from-cms` (futuro — migrará estas configs a CMS; este cambio las edita de forma consistente). Sin dependencias bloqueantes activas.

## Alternativas descartadas
- Alternativa: scroll suave solo-CSS (`scroll-behavior: smooth` + anclas, sin ClientRouter)
  Motivo del descarte: el ticket pide explícitamente View Transitions (confirmado por el usuario); queda como fallback automático para navegadores sin soporte.
- Alternativa: cambiar el correo solo en /contacto
  Motivo del descarte: el usuario amplió el alcance post-enrichment a todos los lugares donde se muestra el correo (SC-004).
- Alternativa: añadir `ctaLabel` a `FeaturedProduct` (contrato de config) para el texto del botón
  Motivo del descarte: minimalismo (un solo uso, texto ya inline); viable si se prefiere simetría con `Service.ctaLabel`.

## Technical Considerations

- Astro **7.1.6**: View Transitions se activa con `<ClientRouter />` importado de `astro:transitions`, añadido al `<head>` de `Layout.astro` — afecta **todas** las páginas (routing client-side global).
- Regresión conocida: `initHeaderScrollState` (`lib/scroll/createHeaderScrollState`) se inicializa una vez vía script import; debe escuchar `astro:page-load` para sobrevivir a navegaciones client-side. Los listeners inline del menú móvil (Header) deben re-vincularse.
- Estrategia de anclas: añadir `slug` a `ServicePageService` + `SERVICIOS_PAGE_SERVICES`; renderizar `id={slug}` en el `<article>` de cada `ServiceCard`. Los slugs del home ya existen y coinciden 1:1.
- Scroll suave: ClientRouter maneja `#hash` en navegación; añadir `scroll-margin-top` a los targets (header sticky `h-20 lg:h-24` + barra de búsqueda opcional).
- TDD: los tests que aserten el comportamiento actual deben actualizarse **primero**:
  - `DestacadosSection.test.ts` (aserta "Cotizar", líneas 226-239)
  - `ServicesSection.test.ts` (aserta `href="/servicios"`)
  - `pages/__tests__/contacto.test.ts` (aserta `contacto@riff.cl`, línea 33)
  - `lib/config/__tests__/contact-page.test.ts` (aserta `contacto@riff.cl`, líneas 50/52)
  - `components/__tests__/ContactBar.test.ts` (aserta `contacto@riff.cl`, líneas 35-36/119)
  - `pages/productos/__tests__/[slug].test.ts` (aserta `mailto:contacto@riff.cl`, línea 127)
  - Snapshot `ContactBar.test.ts.snap` (se regenera al actualizar los tests)
- Sin cambios de DB ni de API contract; requiere rebuild SSG (site estático).
- El texto del header CTA de Destacados ("EXPLORAR CATÁLOGO COMPLETO") no se ve afectado; los botones "Cotizar" de `ProductCard`/`ProductListItem` (catálogo) están fuera de alcance (solo `DestacadosSection`).

## Definition of Done

- [ ] Tests written and passing (actualizados primero bajo TDD)
- [ ] Documentation updated (specs OpenSpec reflejan los 3 requisitos + alcance ampliado SC-004)
- [ ] Code review approved
- [ ] OpenSpec artifacts updated
- [ ] Verificación manual de View Transitions + scroll a anclas en navegador real (desktop y mobile)
- [ ] No aplica: API spec / data model (cambio solo-frontend)
