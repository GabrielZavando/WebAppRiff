## Context

El sitio público Astro (apps/web/) se encuentra en Fase A (bootstrap completado). Existen ya cuatro componentes UI integrados en `Layout.astro` (en este orden DOM): `TopHeader.astro` (utility bar archivada en `2026-08-02-top-header`), `Header.astro` (header principal con navegación + CTA archivado en `2026-08-02-site-header`), `SearchForm.astro` (barra de búsqueda archivada en `2026-08-04-search-form`) y el `<slot />` donde va el contenido de cada página. La home actual (`apps/web/src/pages/index.astro`) es solo un placeholder con `<h1>Riff Catálogo Digital</h1>` y un `<p>` indicando "Proyecto en desarrollo".

La imagen de referencia `docs/design/components/BannerHome.png` muestra el home objetivo:
- TopHeader + Header (ya implementados, no cambian)
- SearchForm (ya implementado; en la imagen aparece sobre fondo oscuro del hero, pero en el código actual tiene fondo blanco — esta diferencia se trata más abajo)
- Sección hero con: headline "Innovación que **Fluye**" (palabra destacada en color distinto), subtítulo "Experiencia, tecnología y control en medición de fluidos y tratamientos de agua.", párrafo descriptivo, y dos CTAs (`VER SERVICIOS` primario teal + `ESCRÍBENOS` secundario outline blanco), todo sobre fondo industrial oscuro con overlay navy
- Franja inferior con estadísticas "DESDE 1979 / 40+ / 30.000+" (fuera de scope — se agenda como change futuro `stats-strip`)

Decisiones confirmadas con el cliente (preguntas previas respondidas):
- **Alcance**: Solo `HeroBanner` (hero). La franja de stats queda fuera.
- **Color del CTA primario**: Nuevo token `--color-brand-teal` (#14B8A6 estimación visual, ajustable en un solo lugar).
- **Imagen de fondo**: Placeholder con CSS (gradiente navy + overlay semitransparente), sin imagen externa. Marcado como TODO para cuando el cliente entregue el asset industrial real.
- **SearchForm sobre hero oscuro**: Fuera de scope. El SearchForm se mantiene con fondo blanco renderizado por `Layout.astro`. La apariencia superpuesta de la imagen se agenda como change futuro `search-form-variants`.

## Goals / Non-Goals

**Goals:**
- Componente `HeroBanner.astro` presentacional puro (dumb): recibe `eyebrow?`, `headline`, `highlightedWord`, `subtitle`, `description`, `ctas`, y opcionalmente `stats` (reservado, no se renderiza en este change) por props; sin fetching ni estado de dominio, sin leer `import.meta.env` directamente
- Tipos TypeScript estrictos (`HeroBannerProps`, `HeroCta`, `HeroStat`) en `lib/types/hero-banner.ts`
- Config hardcoded `HERO_BANNER_CONTENT` con el copy del hero y los dos CTAs (`VER SERVICIOS` → `/servicios`, `ESCRÍBENOS` → `/contacto`) en `lib/config/hero-banner.ts` (mismo patrón que `NAVIGATION_ITEMS` y `CATEGORY_OPTIONS`)
- Helper `splitHeadline(headline, highlightedWord)` extraído a `lib/config/hero-banner.ts` para separar la palabra destacada del resto del headline; testeable aislado sin montar el componente (SRP Astro: frontmatter sin lógica de negocio no trivial)
- Token CSS nuevo `--color-brand-teal` (#14B8A6) en `globals.css` con semántica `brand-*` consistente con `brand-navy` y `brand-orange`
- Layout responsivo: mobile (< 768px) — headline `text-4xl`, CTAs stacked vertical; desktop (>= 768px) — headline `text-6xl`, CTAs inline horizontal
- Accesibilidad: el `<h1>` del hero es el único `<h1>` de la home (reemplaza el placeholder actual del `<h1>` existente en `index.astro`); subtítulo como `<h2>` subordinado; CTAs focusables en orden DOM
- Tests Vitest (unit de `splitHeadline` + AstroContainer + snapshot) y E2E Playwright (desktop/mobile/contraste CTAs/accesibilidad)

**Non-Goals:**
- NO se crea `StatsStrip.astro` ni se renderiza la franja "DESDE 1979 / 40+ / 30.000+" — se agenda como change futuro `stats-strip`. El tipo `HeroStat` se define para que el change futuro no rompa la API de props, pero `HeroBanner.astro` no consume `stats` en este change
- NO se modifica `SearchForm.astro` ni su spec archivada — el SearchForm se mantiene con fondo blanco renderizado por `Layout.astro`. La apariencia "sobre hero oscuro" de la imagen de referencia queda explícitamente fuera de scope para preservar el contrato de la spec `search-form` y se agenda como change futuro `search-form-variants`
- NO se carga imagen real desde Storage ni desde una CDN externa — el fondo se construye 100% con Tailwind CSS (gradiente navy + overlay semitransparente con `radial-gradient`). TODO documentado para reemplazar cuando el cliente entregue el asset industrial
- NO se modifica `Layout.astro` — el `HeroBanner` se renderiza vía el `<slot />` de `index.astro`; el `Layout` seguirá produciendo el orden DOM `TopHeader → Header → SearchForm → slot`
- NO se modifican `Header.astro`, `TopHeader.astro` ni sus specs archivadas
- NO se añaden animaciones, parallax, ni shrink-on-scroll al hero — comportamiento estático
- NO se añade un tercer CTA (ej. "Descargar catálogo") — solo los dos mostrados en la imagen de referencia
- NO se implementa vídeo de fondo — solo gradiente CSS placeholder

## Decisions

1. **Dumb presentational component**: `HeroBanner.astro` no hace fetching, no lee `import.meta.env`, no contiene lógica de negocio no trivial. `apps/web/src/pages/index.astro` importa `HERO_BANNER_CONTENT` de `lib/config/hero-banner.ts` y se lo pasa spread al componente: `<HeroBanner {...HERO_BANNER_CONTENT} />`. Cumple SRP de `frontend-standards.md` § "Principios de Diseño — Astro".

2. **Lógica de split del headline en `lib/`**: la separación de la palabra destacada (`splitHeadline(headline, highlightedWord)`) se extrae a `lib/config/hero-banner.ts`. Reglas: devuelve una tupla readonly `[before, optional after]`; si `highlightedWord` no aparece en `headline`, devuelve `[headline, '']` (no renderiza el span destacado pero no rompe); si aparece al final, `after` es `''`; si aparece al inicio, `before` es `''`. Testeable aislado con Vitest sin montar el componente. Alternativa considerada: inline `headline.split(highlightedWord)` en el frontmatter del `.astro` — descartada porque embeddear lógica de strings con multiplicidad de casos edge en frontmatter imposibilita testearla con Vitest (frontend-standards § "Frontmatter sin lógica de negocio no trivial").

3. **Token `--color-brand-teal` en `@theme`**: se añade `--color-brand-teal: #14B8A6` al bloque `@theme` existente en `globals.css` (mismo lugar que `--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`). Esto genera la utilidad `bg-brand-teal` automáticamente con Tailwind v4. El CTA primario usa `bg-brand-teal hover:bg-teal-600 text-white`; el secundario usa `border-2 border-white text-white hover:bg-white hover:text-brand-navy`. Alternativa considerada: usar directamente `bg-teal-500` de la paleta Tailwind hardcodeada — descartada porque rompe la consistencia semántica `brand-*` que ya usa el proyecto y dificulta retheming futuro.

4. **Fondo navy con gradiente CSS (placeholder)**: el `<section>` del hero usa Tailwind `bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy opacity-95` más una capa decorativa con `bg-[radial-gradient(...)] opacity-30` para sugerir textura. Todo se construye con clases Tailwind — no se referencia ningún asset externo. Se documenta como TODO en el componente: "reemplazar con `<img>` o `<picture>` cuando el cliente entregue la fotografía industrial real". Alternativa considerada: usar una imagen de Unsplash como placeholder — descartada por introducir dependencia externa y por inconsistencia entre builds.

5. **Composición con SearchForm vía `Layout`, no dentro del `HeroBanner`**: el `SearchForm` se mantiene renderizado en `Layout.astro` con su fondo blanco actual. `HeroBanner` se renderiza vía `<slot />` de `index.astro`, **después** del SearchForm en el DOM. Esto produce una diferencia visual con la imagen de referencia (donde el SearchForm aparece superpuesto encima del hero). Abrir un change futuro `search-form-variants` para añadir prop `variant: 'light' | 'dark'` al SearchForm y moverlo opcionalmente dentro del `HeroBanner`. No se hace aquí para no romper la spec `search-form` archivada (frontend-standards § "SDD:specs before code"). Alternativa considerada: envolver el SearchForm + HeroBanner en un contenedor relativo y CSS-position el SearchForm encima del hero — descartada por精致 hack CSS, no SRP, y por requerir tocar el Layout.

6. **`HeroStat` tipo reservado, no consumido**: se define `HeroStat { label: string; value: string }` en `lib/types/hero-banner.ts` y `HeroBannerProps.stats?: readonly HeroStat[]`. `HeroBanner.astro` acepta la prop pero no la renderiza en este change. Permite al change futuro `stats-strip` renderizar la franja "DESDE 1979 / 40+ / 30.000+" sin tener que cambiar la API de props del componente. Alternativa considerada: omitir `stats` por completo hasta el change futuro — descartada porque ahora cuesta 4 líneas y evita un breaking change en el contrato del componente.

7. **Headline como `<h1>` único de la home, subtítulo como `<h2>`**: el `<h1>` del hero reemplaza el placeholder actual que tenía `index.astro`. La home tendrá exactamente un `<h1>` (regla de SEO on-page). El `<h2>` del subtítulo queda subordinado al `<h1>`. La página placeholder anterior (que tenía su propio `<h1>Riff Catálogo Digital</h1>`) se elimina. Alternativa considerada: mantener el placeholder y poner el hero dentro de un `<section aria-label="Hero">` sin `<h1>` — descartada por SEO (el hero tiene el copy más relevante de la home).

8. **CTAs como `<a>`, no `<button>`**: los dos CTAs son navegación (links a `/servicios` y `/contacto`), no disparan acción JS. Se renderizan como `<a href>` con estilos de botón (rol visual botón, rol semántico link). El foco keyboard funciona nativamente. Alternativa considerada: usar `<button>` y `onclick` con `window.location` — descartada por accesibilidad y SEO (los `<a>` son crawlables, los `<button>` no).

9. **Config hardcoded en `lib/config/hero-banner.ts`**: `HERO_BANNER_CONTENT` se exporta como `Readonly<HeroBannerProps>`. Permite al cliente ajustar el copy del hero, los hrefs de los CTAs y el color del destacado en un solo archivo sin tocar el componente. Mismo patrón que `NAVIGATION_ITEMS` (header), `CATEGORY_OPTIONS` + `SEARCH_FORM_CONFIG` (search-form) y `CONTACT_INFO` (top-header). Alternativa considerada: leer copy desde env vars — descartada por ahora porque 属于 a marketing copy, no configuración; el fetch dinámico desde Firestore/CMS entra en un change posterior `contentful-from-cms`.

## Risks / Trade-offs

- **Risk**: Diferencia visual con la imagen de referencia: el SearchForm queda con fondo blanco **debajo** del hero en el DOM, no superpuesto → **Mitigation**: documentado en Non-Goals; el change futuro `search-form-variants` lo resuelve añadiendo `variant: 'light' | 'dark'` al SearchForm y moviéndolo opcionalmente dentro del HeroBanner. Aceptado por el cliente en preguntas previas.
- **Risk**: El placeholder CSS del fondo no es visualmente idéntico a la imagen industrial oscura → **Mitigation**: aceptado por el cliente; el TODO en el componente indica dónde reemplazar cuando llegue el asset real. No bloquea el cambio funcional.
- **Risk**: El teal `#14B8A6` es una estimación visual, no confirmada con el cliente → **Mitigation**: vive como un solo token en `globals.css` y se puede ajustar en un solo lugar sin tocar componentes. Se agregó como Open Question para confirmar antes de archivar.
- **Risk**: `splitHeadline` con edge cases (palabra destacada con regex special chars, palabra no presente, múltiples ocurrencias) → **Mitigation**: tests unitarios cubren: (a) ocurrencia única media, (b) ocurrencia al inicio, (c) ocurrencia al final, (d) palabra no presente (no rompe, no renderiza span), (e) múltiples ocurrencias (solo se destaca la primera).
- **Risk**: Reemplazar el `<h1>` del placeholder actual en `index.astro` puede romper el snapshot existente o un smoke test que valide el texto anterior → **Mitigation**: la sección 6 de tasks incluye verificación de test:smoke del home; si un snapshot rompe, se actualiza como parte del cambio (regresión intencional).
- **Trade-off**: Hardcoded del copy en `HERO_BANNER_CONTENT` vs fetch desde CMS/Firestore → simplicidad y tipos estrictos ahora; el change `contentful-from-cms` futuro lo reemplaza inyectando el contenido vía props sin tocar el componente.
- **Trade-off**: `HeroStat` definido pero no renderizado en este change vs no definirlo → costo de 4 líneas de tipos ahora a cambio de evitar un breaking change en el contrato futuro; aceptado.

## Migration Plan

- No requiere migración de datos ni cambios de API (`docs/api-spec.yml` invariante).
- Deploy: build SSG estándar (misma pipeline que Fase A). El `HeroBanner` nuevo + el `index.astro` actualizado entran juntos en un solo cambio. La pipeline existente (`npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:smoke`) valida todo.
- Rollback: revertir el commit del change `banner-home` — `index.astro` vuelve al placeholder anterior (`<h1>Riff Catálogo Digital</h1>` + `<p>Proyecto en desarrollo</p>`), el token `--color-brand-teal` se quita de `globals.css` y los archivos nuevos (`HeroBanner.astro`, `lib/types/hero-banner.ts`, `lib/config/hero-banner.ts`, tests asociados) se eliminan. No hay efectos en `Layout.astro`, `SearchForm.astro` ni sus specs.

## Open Questions

- **Color exacto del teal**: ¿se confirma `#14B8A6` (Tailwind `teal-500`) o se prefiere `#0D9488` (`teal-600`, un tono más oscuro)? Hoy se usa `#14B8A6` como estimación. Ajustable en un solo lugar (`globals.css`) antes de archivar.
- **Href de los CTAs**: hoy se usan `/servicios` y `/contacto` como placeholders. ¿Son esos los paths correctos del sitio, o deben ser anclas a secciones (`#servicios`, `#contacto`) dentro del mismo home? Pendiente confirmar con el cliente antes de archivar.
- **`stats-strip`**: confirmado fuera de scope. ¿Lo agendamos como siguiente change prioritario?
- **`search-form-variants`**: la apariencia "SearchForm sobre hero oscuro" de la imagen de referencia se posterga. ¿Es el siguiente change después de `stats-strip`?
