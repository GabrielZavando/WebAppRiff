## Why

El sitio público (apps/web) presenta problemas de ajuste visual en el breakpoint `lg:` (1024px): el logo del header choca con el buscador, el botón de búsqueda se siente comprimido, la caja flotante del inicio está demasiado alta, las tarjetas de productos y de valor propuesta se apilan en una columna en desktop, y el título de alianzas en Representaciones es excesivamente grande. Se requieren ajustes de Tailwind con prefijo `lg:` para mejorar el espaciamiento, la alineación y la legibilidad en escritorio sin cambiar el comportamiento ni el contenido.

## What Changes

- Header.astro: centrar el logo verticalmente y agregar padding arriba y abajo en `lg:` para que no choque con el buscador.
- SearchForm.astro: ampliar el botón de búsqueda al menos 18px en `lg:`.
- PanelHome.astro: desplazar la caja flotante al menos 5rem hacia abajo (`lg:mt-20` o similar) en `lg:`; reducir el tamaño de fuente de los valores de las estadísticas (40+, 30.000+, 5+, 9+) en `lg:`.
- DestacadosSection.astro ("Nuestros Productos"): distribuir las 4 tarjetas en 2 columnas en `lg:` (actualmente 4 columnas).
- NosotrosValueProp.astro: distribuir las 4 tarjetas de pilares en 2 columnas en `lg:` (actualmente 4 columnas).
- ServiciosTerrenoSection.astro: distribuir las 4 tarjetas de "Servicios especializados en terreno" en 2 columnas en `lg:`.
- representaciones.astro: reducir el título "Alianzas Estratégicas y Representación Exclusiva" al menos 1rem en `lg:`; distribuir las 4 tarjetas de "¿Por qué adquirir a través del representante oficial en Chile?" en 2 columnas en `lg:`.

## Capabilities

### New Capabilities

- `web/lg-breakpoint-layout`: ajustes de layout en el breakpoint `lg:` (1024px) a lo largo del sitio público, cubriendo header, buscador, panel de inicio, sección de productos destacados, pilares de Nosotros, servicios en terreno y representaciones.

### Modified Capabilities

Ninguna. Este cambio solo modifica clases de Tailwind con prefijo `lg:` (implementación); no cambia requisitos ni comportamiento de especificaciones existentes.

## Impact

- apps/web/src/components/Header.astro
- apps/web/src/components/SearchForm.astro
- apps/web/src/components/PanelHome.astro
- apps/web/src/components/DestacadosSection.astro
- apps/web/src/components/NosotrosValueProp.astro
- apps/web/src/components/ServiciosTerrenoSection.astro
- apps/web/src/components/ServicioTerrenoCard.astro (contenedor de tarjetas, indirecto)
- apps/web/src/pages/representaciones.astro
