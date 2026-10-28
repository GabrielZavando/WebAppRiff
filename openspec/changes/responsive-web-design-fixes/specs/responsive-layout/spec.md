# responsive-layout Specification

## ADDED Requirements

### Requirement: Public site supports a minimum viewport matrix without horizontal scroll

El sitio público (Astro, `apps/web`) SHALL render sin scroll horizontal en los siguientes viewports de referencia: `320×568`, `375×667`, `568×320` (landscape de móvil), `768×1024`, `1024×768`, `1204×800` y `1280×800`. La invariante SHALL verificarse como `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1` (tolerancia de 1px por sub-píxel de redondeo) en cada viewport de la matriz.

#### Scenario: Home sin scroll horizontal en la matriz de viewports

- **WHEN** se carga `/` y se recorren los viewports `320×568`, `375×667`, `568×320`, `768×1024`, `1024×768`, `1204×800` y `1280×800`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1` en ninguno de ellos
- **AND** el `<h1>` del hero y las cuatro celdas de estadísticas del panel quedan dentro del ancho del viewport

#### Scenario: Detalle de producto sin scroll horizontal

- **WHEN** se carga `/productos/{slug}` en los viewports `320×568` y `375×667`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `<h1>` con el título del producto queda contenido dentro de la columna de información

#### Scenario: Catálogo sin scroll horizontal en vista lista

- **WHEN** se carga `/productos?view=list` en los viewports `320×568` y `375×667`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** la imagen de cada tarjeta y la fila de CTAs quedan contenidas dentro del ancho de la tarjeta

### Requirement: Long words and headings never force horizontal overflow

Todo texto del sitio público que se renderiza como encabezado (`<h1>`–`<h3>`), cifra destacada o CTA SHALL aplicar una estrategia de quiebre de palabra (`break-words` o equivalente) que impida que una palabra indivisible se extienda más allá del ancho de su contenedor. Los encabezados SHALL escalar su tamaño por breakpoint en lugar de usar un tamaño fijo único para todos los viewports.

#### Scenario: Palabra larga en el título del producto

- **WHEN** un producto con un `titulo` de más de 20 caracteres sin espacios se renderiza en `/productos/{slug}` a `320×568`
- **THEN** el `<h1>` no desborda su contenedor
- **AND** el texto se envuelve o se corta la palabra dentro del ancho disponible

#### Scenario: Escala responsiva en encabezados corrigidos

- **WHEN** se inspecciona el `<h1>` del hero del home, el `<h1>` del hero de Representaciones o el `<h1>` del detalle de producto
- **THEN** cada uno declara al menos una variante responsiva de tamaño tipográfico (por ejemplo `text-3xl md:text-7xl`) en lugar de un único tamaño fijo

### Requirement: Sticky shell respects a viewport-height budget on short viewports

El grupo sticky del sitio (header + barra de búsqueda, envueltos en `Layout.astro`) SHALL ocupar como máximo el 50% de la altura del viewport en viewports cuya altura sea menor o igual a 400px (orientación landscape de móvil, por ejemplo `568×320`). El header y el buscador SHALL compactar su padding vertical y la densidad de sus controles en esos casos, de modo que el contenido principal de la página siga siendo visible sin scroll.

#### Scenario: Grupo sticky compacto a 568×320

- **WHEN** se carga `/` en el viewport `568×320`
- **THEN** la altura del wrapper sticky (`header-scroll-shell`) es menor o igual al 50% de 320px (160px)
- **AND** el header aplica padding vertical reducido respecto a su valor en portrait
- **AND** la barra de búsqueda no apila sus tres controles verticalmente en ese viewport

#### Scenario: Comportamiento vertical sin cambios

- **WHEN** se carga `/` en un viewport portrait de 320×568 o superior
- **THEN** el buscador mantiene su layout apilado (mobile-first) y el header mantiene su padding vertical habitual
- **AND** el grupo sticky puede superar el 50% de la altura del viewport sin considerarse un defecto

### Requirement: Desktop navigation does not overflow between 1024px and 1279px

El menú de escritorio del header SHALL ser visible desde `xl` (1280px). En el rango `lg` (1024px) a menos de 1280px, el header SHALL mantener el acceso a la navegación mediante el menú hamburguesa con overlay a pantalla completa, y los elementos del nav de escritorio (íconos de navegación, CTA y logo) SHALL estar dimensionados de modo que, cuando el nav de escritorio se renderiza, el conjunto completo quepa dentro del ancho del viewport sin scroll horizontal.

#### Scenario: Menú de escritorio visible desde 1280px

- **WHEN** el header se renderiza en un viewport `>= 1280px`
- **THEN** el `<nav aria-label="Navegación principal">` es visible y el botón hamburguesa está oculto

#### Scenario: Menú móvil por debajo de 1280px

- **WHEN** el header se renderiza en un viewport de `1024px` a `1279px`
- **THEN** el `<nav aria-label="Navegación principal">` de escritorio está oculto
- **AND** el botón hamburguesa está visible y abre el overlay de navegación

#### Scenario: Sin desborde del header en el rango 1024–1279px

- **WHEN** el header se renderiza en los viewports `1024×768` y `1204×800`
- **THEN** el ancho del `<header>` no supera el ancho del viewport
- **AND** ningún hijo directo del header (logo, navegación, CTA) extiende su `boundingBox` más allá del borde derecho del viewport
