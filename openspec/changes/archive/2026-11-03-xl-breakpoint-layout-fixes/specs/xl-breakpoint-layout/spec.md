# xl-breakpoint-layout Specification

## Purpose
Delta de requerimientos para el breakpoint `xl:` (>= 1280px) del sitio público (`apps/web`, Astro SSG). Aplica ajustes de layout específicos de escritorio grande sin alterar el comportamiento de breakpoints menores (`sm`, `md`, `lg`). Cada requisito especifica clases de utilidad Tailwind exactas y el componente/archivo afectado.

## ADDED Requirements

### Requirement: Footer — botón Scroll to Top a la derecha de "SANTIAGO, CHILE" en xl:
El botón de scroll-to-top (`<button data-scroll-top>`) de `Footer.astro` SHALL renderizarse a la derecha del texto de ubicación ("SANTIAGO, CHILE") en la barra inferior a partir del breakpoint `xl:`. Actualmente el botón se renderiza antes (a la izquierda) de la ubicación; en `xl:` el orden invierte a ubicación primero, botón segundo, quedando el botón como el elemento más a la derecha del grupo.

#### Scenario: Botón scroll-top a la derecha de la ubicación en xl:
- **WHEN** `Footer.astro` se inspecciona en la barra inferior (`.container flex ... sm:flex-row sm:pr-24`)
- **THEN** dentro del grupo flex de la barra inferior el `<span>` con el texto "SANTIAGO, CHILE" aparece en el DOM antes del `<button data-scroll-top>`
- **AND** el botón es el último elemento del grupo (derecha visual de la ubicación)
- **AND** se conserva `sm:pr-24` para que los FAB flotantes no cubran el grupo

### Requirement: PanelHome — caja flotante de estadísticas sube 5rem en xl:
El `<section data-panel-home>` de `PanelHome.astro` SHALL mantener `lg:mt-20` (desplazamiento hacia abajo 5rem) en el breakpoint `lg:` y SHALL aplicar `xl:mt-4` (desplazamiento hacia abajo 1rem) en el breakpoint `xl:` y superiores. El stacking `z-10` y `relative` se preservan.

#### Scenario: Offset del panel home en lg vs xl
- **WHEN** `PanelHome.astro` se inspecciona
- **THEN** la clase de la sección contiene `lg:mt-20` (desplaza hacia abajo en `lg:`)
- **AND** la clase de la sección contiene `xl:mt-4` (desplaza hacia abajo 1rem en `xl:` y superiores)
- **AND** la sección conserva `relative` y `z-10`
- **AND** no se elimina `lg:mt-20` (sobrevive en `lg:` y `md`)

### Requirement: Home — tarjetas de "Nuestros Productos" en 4 columnas en xl:
La grid de tarjetas de `SolutionSection.astro` (sección "Nuestros Productos" del home) SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2` (2 columnas en `lg:`).

#### Scenario: Grid de productos del home en 4 columnas en xl
- **WHEN** `SolutionSection.astro` se renderiza con 4 soluciones
- **THEN** el contenedor de la grid de tarjetas lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2` (2 columnas)
- **AND** en `xl:` las 4 tarjetas quedan en una sola fila

### Requirement: Home — tarjetas de "Servicios especializados" en 4 columnas en xl:
La grid de tarjetas de `ServicesSection.astro` (sección "Servicios especializados" del home) SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `sm:grid-cols-2` (2 columnas a partir de `sm`).

#### Scenario: Grid de servicios especializados del home en 4 columnas en xl
- **WHEN** `ServicesSection.astro` se renderiza con 4 servicios
- **THEN** el contenedor de la grid de tarjetas lleva `xl:grid-cols-4`
- **AND** en `sm:` se mantiene `sm:grid-cols-2`
- **AND** en `xl:` las 4 tarjetas quedan en una sola fila

### Requirement: Home — tarjetas de "Soluciones Destacadas" en 4 columnas en xl:
La grid de tarjetas de `DestacadosSection.astro` (sección "Soluciones Destacadas" del home) SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2` (2 columnas en `lg:`).

#### Scenario: Grid de destacados del home en 4 columnas en xl
- **WHEN** `DestacadosSection.astro` se renderiza con 4 o más productos
- **THEN** el contenedor de la grid de tarjetas lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2`
- **AND** en `xl:` las tarjetas fluyen en filas de 4 mediante auto-placement de CSS Grid

### Requirement: Nosotros — pilares "¿Qué nos define?" en 4 columnas en xl:
La grid de pilares de `NosotrosValueProp.astro` (sección bajo el encabezado "¿Qué nos define?") SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2`.

#### Scenario: Grid de pilares de Nosotros en 4 columnas en xl
- **WHEN** `NosotrosValueProp.astro` se renderiza con 4 pilares
- **THEN** el contenedor de la grid de pilares lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2`

### Requirement: Nosotros — sectores "Presencia Sólida en Industrias Críticas" en 4 columnas en xl:
La grid de sectores de `NosotrosValueProp.astro` (sección bajo "Presencia Sólida en Industrias Críticas") SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2`.

#### Scenario: Grid de sectores de Nosotros en 4 columnas en xl
- **WHEN** `NosotrosValueProp.astro` se renderiza con 4 sectores
- **THEN** el contenedor de la grid de sectores lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2`

### Requirement: Servicios — Portafolio de Productos en xl:
La sección 1 de `servicios.astro` (`ServiciosPortafolioSection.astro`, "Nuestros Productos — Portafolio Técnico") SHALL presentar sus 4 tarjetas de solución en una lista vertical apilada con divisores horizontales (`divide-y`) en el breakpoint `xl:`, manteniendo el mismo layout que en `lg:` y breakpoints menores (no se aplica grid de 4 columnas en `xl:`). Cada tarjeta conserva su `id` de ancla y `scroll-mt-*`.

#### Scenario: Lista de portafolio de productos en xl
- **WHEN** `ServiciosPortafolioSection.astro` se renderiza con 4 soluciones en `xl:` (>= 1280px)
- **THEN** el contenedor que envuelve las tarjetas usa `divide-y` y NO `xl:grid-cols-4`
- **AND** las tarjetas se apilan verticalmente igual que en `lg:`
- **AND** cada `SolucionPortafolioCard` conserva su `id` de ancla y `scroll-mt-*`

### Requirement: Servicios — Servicios Especializados en 4 columnas en xl:
La sección 2 de `servicios.astro` (`ServiciosTerrenoSection.astro`, "Servicios Especializados en Terreno") SHALL mostrar sus 4 tarjetas de servicio en 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2`.

#### Scenario: Grid de servicios en terreno en 4 columnas en xl
- **WHEN** `ServiciosTerrenoSection.astro` se renderiza con 4 servicios
- **THEN** el contenedor de la grid lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2`
- **AND** en `xl:` las 4 tarjetas quedan en una sola fila

### Requirement: Representaciones — marcas exclusivas en 1 columna en xl:
La sección "Marcas de Representación Exclusiva" de `representaciones.astro` SHALL mostrar sus 5 tarjetas de marca en **1 sola columna** (`xl:grid-cols-1`, equivalente a layout vertical `flex-col`) en el breakpoint `xl:`. Actualmente las tarjetas se apilan en una columna (`flex flex-col`); en `xl:` se mantienen en una columna.

#### Scenario: Grid de marcas de representación en 1 columna en xl
- **WHEN** `representaciones.astro` renderiza la sección de marcas con 5 tarjetas en `xl:` (>= 1280px)
- **THEN** el contenedor que envuelve las tarjetas de marca lleva `xl:grid-cols-1` (o conserva `flex-col`)
- **AND** en `xl:` las 5 tarjetas quedan apiladas en una sola columna
- **AND** cada `RepresentacionBrandCard` conserva su layout interno (`md:flex-row`, panel de logo a la izquierda)

### Requirement: Representaciones — pilares "¿Por qué adquirir..." en 4 columnas en xl:
La sección "¿Por qué adquirir a través del representante oficial en Chile?" de `representaciones.astro` (tarjetas `ValuePropCard`) SHALL mostrar 4 columnas en el breakpoint `xl:` mediante `xl:grid-cols-4`, sobre su configuración actual `lg:grid-cols-2`.

#### Scenario: Grid de pilares de valor de Representaciones en 4 columnas en xl
- **WHEN** `representaciones.astro` renderiza la sección de propuesta de valor con 4 pilares
- **THEN** el contenedor de la grid de pilares lleva `xl:grid-cols-4`
- **AND** en `lg:` se mantiene `lg:grid-cols-2`
