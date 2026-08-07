# Verificación visual — `hero-fullbleed-overlay`

> Esta carpeta debe contener las 4 capturas de pantalla requeridas por el
> task 5.1 del cambio OpenSpec `hero-fullbleed-overlay`. Este README documenta
> el checklist exacto; el agente build no puede generar capturas, por lo que
> deben tomarse manualmente desde el dev server (`cd apps/web && npm run dev`)
> abriendo http://localhost:4321/ en los 4 viewports.

## Cómo reproducir

1. `cd apps/web && npm run dev`
2. Abrir http://localhost:4321/ en el navegador.
3. Para cada viewport abajo: redimensionar la ventana (o DevTools → Toggle device toolbar) a las dimensiones indicadas, capturar y guardar el archivo con el nombre exacto que se pide en esta misma carpeta.

## Capturas requeridas

| Archivo esperado        | Viewport     | Qué se debe verificar                                                                                                                                                           |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1-mobile-375x667.png`  | 375×667      | La imagen + overlay azul `bg-secondary/80` cubren todo el viewport; TopHeader oculto (solo `sm:flex`); Header y SearchForm transparentes mostrando la imagen detrás; texto del hero legible. |
| `2-tablet-768x1024.png` | 768×1024     | Imagen + overlay cubren el viewport completo; TopHeader, Header y SearchForm transparentes con la imagen visible detrás; el contenido del hero fluye bajo el search.            |
| `3-laptop-1280x720.png` | 1280×720     | El hero llena el viewport; los tres headers (TopHeader, Header, SearchForm) transparentes sobre la imagen; buscador y CTAs legibles; PanelHome cubre la franja inferior del hero. |
| `4-desktop-1920x1080.png` | 1920×1080  | El hero llena el viewport; headers transparentes; contenido con `lg:py-32` dando respiro; PanelHome superpuesto sin cubrir excesivamente.                                        |

## Estado de verificación automática

Antes de esta validación manual, el agente build ya confirmó:

- `curl http://localhost:4321/` → HTTP 200.
- El HTML servido contiene:
  - `<picture ...>` con `<source type="image/avif">` y `<source type="image/webp">` de `banner_home` al inicio del `<body>`.
  - `<div class="absolute inset-0 bg-secondary/80" aria-hidden="true">` (overlay decorativo).
  - `<div class="w-full relative z-10 flex flex-col min-h-screen">` envolviendo TopHeader/Header/SearchForm/slot.
  - TopHeader/Header/SearchForm con `bg-transparent` en la home; páginas internas (`/productos`, `/cotizacion`) conservan sus fondos sólidos.
- Suite completa de Vitest: 18 archivos / 211 tests pasan (incluidos snapshots actualizados).

## Acción si algo no se ve bien

- Si en `1280×720` el `PanelHome` cubre demasiado del hero: **no corregir en este cambio** (Non-Goal explícito). Abrir un issue / task en `openspec/changes/hero-fullbleed-overlay/tasks.md` con la observación y abordarlo en un cambio aparte (p. ej. `hero-panel-overlap-tune`).
- Si en algún viewport aparece scroll horizontal: revisar el `overflow-x-hidden` del `<body>` en modo `hero` del Layout; si el panel teal+white rompe horizontal, es tema del `PanelHome` y queda fuera de scope aquí.
- Si la página no se puede scrollear hacia abajo (PanelHome/CTA colapsados): **no usar `overflow-hidden` (ambos ejes)** en el `<body>`/modo hero — desactiva el scroll vertical de la home (fix 6.4 aplicado).
- Si el overlay se ve negro/gris (no azul): revisar que `bg-secondary/80` esté efectivamente aplicado y que el token `--color-secondary` siga siendo `#1F2D40` en `apps/web/src/styles/globals.css`.
- Si los headers se ven con fondo sólido sobre el hero: verificar que la home renderice el `Layout` con la prop `hero` (sin ella los headers no reciben `transparent=true`).
