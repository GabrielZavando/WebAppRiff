## MODIFIED Requirements

### Requirement: Public site supports a minimum viewport matrix without horizontal scroll

El sitio público (Astro, `apps/web`) SHALL render sin scroll horizontal en los siguientes viewports de referencia: `320×568`, `375×667`, `568×320` (landscape de móvil), `640×360` (landscape de tablet pequeña), `640×800` (portrait de tablet pequeña), `768×1024`, `1024×768`, `1204×800` y `1280×800`. La invariante SHALL verificarse como `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` (tolerancia de 1px por sub-píxel de redondeo) en cada viewport de la matriz.

#### Scenario: Home sin scroll horizontal en la matriz de viewports

- **WHEN** se carga `/` y se recorren los viewports `320×568`, `375×667`, `568×320`, `640×360`, `640×800`, `768×1024`, `1024×768`, `1204×800` y `1280×800`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1` en ninguno de ellos
- **AND** el `<h1>` del hero y las cuatro celdas de estadísticas del panel quedan dentro del ancho del viewport
- **AND** las grillas de productos, servicios y equipo quedan dentro del ancho del viewport en `640×360` y `640×800`

#### Scenario: Detalle de producto sin scroll horizontal

- **WHEN** se carga `/productos/{slug}` en los viewports `320×568` y `375×667`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `<h1>` con el título del producto queda contenido dentro de la columna de información

#### Scenario: Catálogo sin scroll horizontal en vista lista

- **WHEN** se carga `/productos?view=list` en los viewports `320×568` y `375×667`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** la imagen de cada tarjeta y la fila de CTAs quedan contenidas dentro del ancho de la tarjeta
