## Why

La primera pantalla que ve un visitante al llegar al home (ruta `/`) debe transmitir la identidad industrial de Riff desde el primer instante, tal como muestra la referencia `docs/design/components/Inicio.png`: la imagen real del hero ocupa **todo el viewport** (ancho y alto), cubierta por una capa azul semitransparente (`--color-secondary` #1F2D40 a opacidad 0.8). La imagen, los headers y el buscador quedan dentro de esa primera pantalla; TopHeader, Header y SearchForm deben ser **transparentes** para que la imagen se vea detrás.

El objetivo principal del cliente es: "la imagen de fondo debe estar cubierta por una capa transparente con color azul y opacidad de unos 0.8, debe ocupar todo el ancho y alto del viewport, y todos los demás componentes deben estar encima (barra superior, header, buscador, textos), pero no deben ser modificados sus estilos — eso se hará paso a paso". La única excepción necesaria para cumplir esa visión es que el fondo de los headers sea transparente, requisito explícito del cliente ("deben tener fondo transparente, para que se vea la imagen de fondo detrás de los elementos").

## What Changes

- `apps/web/src/layouts/Layout.astro`: gana un modo `hero` (prop) que envuelve la home en un shell `min-h-screen overflow-hidden` con la imagen del hero `<Picture>` a pantalla completa + overlay `absolute inset-0 bg-secondary/80` detrás de TopHeader/Header/SearchForm/contenido (`z-10`).
- `apps/web/src/components/TopHeader.astro`: prop `transparent` (default `false`). En home usa `bg-transparent` en lugar del gradiente navy.
- `apps/web/src/components/Header.astro`: prop `transparent` (default `false`). En home usa `bg-transparent` en lugar del gradiente navy.
- `apps/web/src/components/SearchForm.astro`: prop `transparent` (default `false`). En home el wrapper `role="search"` usa `bg-transparent` + borde inferior translúcido (mantiene inputs blancos y botón `bg-accent`).
- `apps/web/src/components/HeroBanner.astro`: deja de renderizar la imagen `<Picture>` propia y el overlay; pasa a ser solo el contenido (headline/subtítulo/descripción/CTAs) porque el fondo ahora lo provee el shell del Layout. Se elimina el requisito `min-h-screen` del componente (pertenece al shell).
- **NO** se rediseña tipografía, alturas, CTAs, PanelHome, ni páginas distintas de la home: esos refinamientos seguirán en cambios posteriores dedicados.

## Capabilities

### New Capabilities
- `home-hero-shell`: shell del Layout de la home que aporta fondo (imagen + `bg-secondary/80`) full-viewport detrás de headers translúcidos, e integra el modo hero en `index.astro`.

### Modified Capabilities
- `hero-banner`: pasa de renderizar el bg real + overlay a renderizar solo contenido; la imagen/overlay se mueven al shell.
- `top-header`: nuevo modo `transparent`.
- `site-header`: nuevo modo `transparent`.
- `search-form`: nuevo modo `transparent`.

## Impact

- **Código afectado**: `apps/web/src/layouts/Layout.astro`, `apps/web/src/pages/index.astro`, `apps/web/src/components/{HeroBanner,TopHeader,Header,SearchForm}.astro` y sus tests unitarios + snapshots.
- **APIs / contratos**: sin cambios. Sitio SSG, sin endpoints nuevos.
- **Dependencias**: sin nuevas dependencias. El token `secondary` (#1F2D40) ya existe en `globals.css`.
- **Riesgo visual**: en viewports muy bajos, PanelHome puede cubrir un porcentaje mayor del hero; aceptado y verificado en el task visual. El fondo transparente en headers exige verificar contraste del logo y textos sobre la capa azul.
- **Accesibilidad**: overlay decorativo (`aria-hidden="true"`), `alt` descriptivo, un único `<header>` landmark, sin regresión WCAG: texto blanco sobre `#1F2D40` a 0.8 sigue siendo > 7:1.