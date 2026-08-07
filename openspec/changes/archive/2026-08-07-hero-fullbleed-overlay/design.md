## Context

La primera pantalla del home (`/`) debe reproducir `docs/design/components/Inicio.png`:

- La imagen real del hero (`@/assets/img/banner_home.webp`) cubre **todo el viewport** inicial (tope → base, ancho y alto completos).
- Encima hay una capa azul semitransparente del design system (`--color-secondary` #1F2D40) a **opacidad 0.8** (`bg-secondary/80`), NO negra ni gris.
- Dentro de esa primera pantalla —sobre la imagen azulada— quedan visibles: `TopHeader`, `Header` (site-header), `SearchForm`, y luego el contenido del hero (headline h1, subtítulo h2, descripción p, CTAs).
- **TopHeader, Header y SearchForm deben tener fondo transparente** (`bg-transparent`), para que la imagen quede visible detrás de ellos. No se usan los fondos sólidos navy/white actuales en la home.
- `PanelHome` (panel teal + white con stats) se superpone sobre el borde inferior del hero con su negative margin actual.

Stack: Astro 7 + Tailwind v4. Tokens en `apps/web/src/styles/globals.css` (`--color-secondary: #1F2D40`, `--color-primary: #41B3C4`, `--color-accent: #F26A21`).

Estado actual (previo a corregir): el `HeroBanner` contiene su propia imagen + overlay en su `<section>`, y el `Layout` renderiza `TopHeader`/`Header`/`SearchForm` con fondos sólidos `bg-secondary` gradient / `bg-white`, montados ANTES del hero — por eso la imagen no quedaba detrás de ellos. Se corrige moviendo el fondo al Layout (modo `hero`) y añadiendo un modo `transparent` a los tres componentes.

Constraint del cliente: "no deben ser modificados sus estilos [de los demás componentes], eso lo haremos paso a paso" — en la primera iteración se interpretó como no tocar esos componentes en absoluto. El usuario después aclaró que sí hace falta que TopHeader/Header/SearchForm sean **transparentes** y queden dentro del viewport para ver la imagen detrás => este cambio introduce un modo `transparent` que solo se activa en el layout de la home; las demás páginas quedan iguales (modo default sólido).

## Goals / Non-Goals

**Goals:**

- Que la imagen + `bg-secondary/80` cubran el **viewport completo en la home**, comenzando desde el tope del documento (detrás de los headers).
- Que `TopHeader`, `Header` y `SearchForm` se rendericen con `transparent` sobre la imagen en la home.
- Conservar el modo default (fondos sólidos) para páginas sin hero (productos, cotización).
- Mantener overlay decorativo `aria-hidden="true"`, `alt` descriptivo, y acceso semántico igual o superior.

**Non-Goals:**

- No rediseñar TopHeader/Header/SearchForm más allá del fondo transparente (sin cambios de textos, tipografía, alturas internas).
- No cambiar `PanelHome` en este ticket.
- No cambiar las páginas distintas de la home (su porción no usa hero).
- No resolver sobreposiciones finas (e.g. si PanelHome cubre demasiado en laptops de 720px) — queda fuera de scope.

## Decisions

### Decision 1 — El fondo hero vive en el Layout (modo `hero`), no en HeroBanner

- **Decisión**: El Layout de la home (via prop `hero`) renderiza un wrapper `relative min-h-screen overflow-hidden flex flex-col` con la imágen `<Picture>` absoluta y el overlay `absolute inset-0 bg-secondary/80` como primer y segundo hijo, y un `relative z-10` que envuelve `TopHeader`, `Header`, `SearchForm` + slot del contenido.
- **Rationale**: Solo así la imagen cubre el viewport **desde el tope** quedando detrás de los headers (que el Layout monta). Si la imagen viviera solo en HeroBanner (posterior en el DOM), nunca quedar detrás de los headers sólidos.
- **Alternativa descartada**: mover TopHeader/Header/SearchBar dentro de HeroBanner — duplicaría estructura para construirlas en las demás páginas.
- **Alternativa descartada**: fondo en `<body>` vía CSS — no se puede usar `astro:assets` `<Picture>` con variantes AVIF/WebP y no hay prop de configuración.

### Decision 2 — Prop `transparent` en TopHeader/Header/SearchForm (default false)
- **Decisión**: Cada componente acepta `transparent?: boolean`. Cuando `true`, el fondo sólido se reemplaza por `bg-transparent` (y en SearchForm el borde inferior pasa a `border-white/10` translucent). Cuando `false` (default), se mantiene exactamente el estilo actual (sólido).
- **Rationale**: respeta la convención "uno de los otros componentes queda igual en las demás páginas" y permite activarlo solo en home. Evita duplicar estilos.
- **Cómo se decide el default**: componente presentacional: se propaga desde la página/layout.

### Decision 3 — HeroBanner se reduce a contenido (sin imagen ni overlay)
- **Decisión**: `HeroBanner` pasa a renderizar solo el bloque de contenido (h1+highlight, h2, p, CTAs) con clases de tipografía/paddings responsive. No renderiza `<Picture>`, ni overlay, ni `md:min-h-screen` (eso ahora está en el shell del Layout).
- **Rationale**: la imagen era responsabilidad del Hero solitary; ahora es del shell de primera pantalla. El componente conserva su role contenido y los tests de headline/highlight/CTAs/accessibility seguirlos.
- **Nota**: La spec canónica hero-banner (archivada en `real-site-images`) decía que HeroBanner contiene el background; este cambio la reemplaza: el background vive en el shell.

### Decision 4 — No `md:min-h-screen` dentro de HeroBanner ni centrado flex del hero content dentro del shell
- **Decisión**: el shell del layout usa `min-h-screen` (talle por defecto `min-h`); el flex de contenido es normal (`relative z-10 flex flex-col`). El Hero content queda tras el SearchForm como hasta hoy; el centrado vertical de ese contenido ya no es objetivo (se removió el requisito md:min-h-screen del componente; el shell garantiza la cobertura de imagen del viewport, lo cual es el requisito del usuario).
- **Rationale**: Evita jugar con flex justiy en elementos que deberían quedar según diseño. El requisito prioritario es "imagen cubre el viewport y headers transparentes sobre ella".

### Decision 5 — Aislamiento de pruebas
- Tests nuevos: Layout hero shell (imagen + overlay + z-10 + transparentes), prop `transparent` de cada componente (default-false + true sobre la home), y HeroBanner content-only (sin `<picture>`/overlay).
- Los snapshots de Header/TopHeader/SearchForm no cambian en modo default; los de Hero cambiaron (no imagen) y se regeneran.
- El comp vídeo de Test del layout hero se puede testear renderizando `index.astro` con props completas o directamente un mini-fixture del Layout (según disponibilidad de helper AstroContainer).

## Risks / Trade-offs

- **[Riesgo] Logo de Header (logo-web.webp) sobre imagen**: el logo real tiene su color; sobre fondo transparente + capa azul 0.8 no debería perder legibilidad (es logo con colores de marca, casi firma). Se verifica visualmente.
- **[Riesgo] `min-h-screen` con contenido alto en móvil puede desbordar** → se usa `min-h-screen` (no `h-screen`), el contenido que supere puede crecer; móvil puede ver la imagen detrás de los headers pero el contenido scrolla. Esto se valida en el task visual.
- **[Riesgo] al quitar bg del TopHeader en modo transparent, el anica y los divisores requieren `bg-white/10`** → se reemplaza `border-gray-200` por `border-white/10` en modo transparent para mantener los divisores visibles.
- **[Tradeoff] SearchForm `transparent`: el card de inputs sigue siendo blanco sólido (bg-white) para legibilidad** — no se hace translúcido el input/select; solo el wrapper form-table es transparente para ver la imagen alrededor.

## Migration Plan

1. Los cambios son SSG (Astro). Modificar pedired assets no cambia rutas emitidas.
2. Rollback: revertir los cambios a Layout/3 componentes (sin migración de datos).
3. No afecta API ni Data Model (no aplica `api-spec.yml` / `data-model.md`).

## Open Questions

- ¿En móvil se quiere también `min-h-screen` en el hero? Como los headers transparentes van arriba en mobile también, se mantiene `min-h-screen` global (mejoría de DX con la referencia en móvil). Si el usuario prefiere evitar scroll, ajustar a `md:min-h-screen` en un cambio aparte.