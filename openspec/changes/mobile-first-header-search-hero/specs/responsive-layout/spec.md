## MODIFIED Requirements

### Requirement: Sticky shell respects a viewport-height budget on short viewports

El grupo sticky del sitio (header + barra de búsqueda, envueltos en `Layout.astro`) SHALL ocupar como máximo el 50% de la altura del viewport en viewports cuya altura sea menor o igual a 400px (orientación landscape de móvil, por ejemplo `568×320`). El header y el buscador SHALL compactar su padding vertical y la densidad de sus controles en esos casos, de modo que el contenido principal de la página siga siendo visible sin scroll. En portrait, la base mobile-first del buscador SHALL organizar el select en su propia fila y el input + botón en una segunda fila, y el header SHALL distribuir su padding vertical como `py-2`; el grupo sticky puede superar el 50% de la altura del viewport en portrait sin considerarse un defecto.

#### Scenario: Grupo sticky compacto a 568×320

- **WHEN** se carga `/` en el viewport `568×320`
- **THEN** la altura del wrapper sticky (`header-scroll-shell`) es menor o igual al 50% de 320px (160px)
- **AND** el header aplica padding vertical reducido respecto de su valor en portrait
- **AND** la barra de búsqueda no apila sus tres controles verticalmente en ese viewport

#### Scenario: Comportamiento vertical sin cambios

- **WHEN** se carga `/` en un viewport portrait de 320×568 o superior
- **THEN** el buscador organiza el select en una fila y el input + botón en otra fila
- **AND** el header aplica `py-2` (8px arriba/abajo) y mantiene el logo centrado verticalmente
- **AND** el grupo sticky puede superar el 50% de la altura del viewport sin considerarse un defecto
