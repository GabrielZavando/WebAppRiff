## Why

El sitio público Astro (apps/web/) tiene un header principal y un buscador globales que hoy son estáticos: al hacer scroll se desplazan y desaparecen junto con el resto del contenido. Eso obliga al usuario a volver al tope para seguir navegando o buscando. Se requiere un comportamiento de "compactación al scroll" (previsto desde el inicio: existe el `TODO[site-header-scroll-animations]` en `Header.astro` y la nota correspondiente en el `design.md` del change archivado `site-header`) que mantenga el Header + Buscador fijos y visibles, reduzca el logo a un tercio y cambie el fondo del conjunto a `--color-secondary` (#1F2D40) con una animación suave, revirtiendo todo al volver al tope.

## What Changes

- Nuevo estado "compacto" disparado por scroll: el conjunto **Header + SearchForm** queda fijo (`position: sticky; top: 0`) cuando `scrollY > 0`, y la barra de contacto superior (TopHeader) se desplaza y desaparece normalmente (no participa del conjunto fijo).
- El logo se reduce al hacer scroll: de **300px a 200px de ancho en desktop** (≥640px) y de **200px a 150px en mobile** (<640px) al activarse el estado compacto, manteniendo su relación de aspecto (330×134).
- El fondo de **Header y SearchForm** pasa a sólido `--color-secondary` (#1F2D40) al activarse el estado compacto (en home/hero parte de transparente sobre la imagen; en el resto de páginas el buscador pasa de blanco a navy). Se usa el token `bg-secondary`, sin literales hex.
- Al volver a `scrollTop === 0` todo revierte a su estado original con la misma animación.
- Animación suave de 300ms `ease-in-out` para fondo y tamaño de logo; desactivada bajo `prefers-reduced-motion`.
- Efecto **global** (todas las páginas) vía `Layout.astro`.
- Se elimina el `TODO[site-header-scroll-animations]` de `Header.astro` (queda resuelto).

## Capabilities

### New Capabilities
- `site-header-scroll`: Comportamiento de compactación al scroll del conjunto Header + Buscador (fijado sticky, encogimiento del logo a 1/3, fondo sólido `--color-secondary` y reverso al tope) con animación suave y respeto de `prefers-reduced-motion`. Agrega los requerimientos de scroll que coordinan los componentes `Header`, `SearchForm` y el `Layout`.

### Modified Capabilities
<!-- Ninguna: el comportamiento de scroll es nuevo (no cambia requerimientos existentes de `site-header`, `search-form`, `top-header` ni `home-hero-shell`). La implementación toca esos componentes, pero a nivel de spec es un capability nuevo. -->

## Impact

- `apps/web/src/layouts/Layout.astro` — nuevo wrapper `sticky top-0 z-30` que agrupa `<Header/>` + `<SearchForm/>`; nuevo `<script>` (bundled) que inicializa el estado de scroll.
- `apps/web/src/components/Header.astro` — clases `site-header` / `site-header__inner` en el `<header>` y su contenedor; `site-logo` en la imagen del logo; eliminación del TODO.
- `apps/web/src/components/SearchForm.astro` — clase `site-search` en el wrapper `role="search"`.
- `apps/web/src/lib/scroll/createHeaderScrollState.ts` — **nuevo** módulo puro y testeable que calcula el estado compacto y lo aplica vía atributo `data-scrolled` en `document.body`.
- `apps/web/src/styles/header-scroll.css` — **nuevo** partial de estilos del estado compacto (overlay `::after` en header, transición de fondo en search, `max-width` en logo, regla `prefers-reduced-motion`); importado en `apps/web/src/styles/globals.css`.
- Tests: Vitest unitario para `lib/scroll`, tests AstroContainer para las nuevas clases (regeneración de snapshot de `Header.test.ts`), y E2E Playwright `e2e/site-header-scroll.spec.ts`.
