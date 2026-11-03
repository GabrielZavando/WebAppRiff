## ADDED Requirements

### Requirement: Logo del header centrado verticalmente en lg:
El logo del header (Header.astro) SHALL mantenerse alineado a la izquierda y SHALL centrarse verticalmente en el breakpoint `lg:` (1024px), con padding adicional arriba y abajo para no chocar con el buscador.

#### Scenario: Logo centrado verticalmente y sin colisión con buscador en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** el logo del header tiene padding vertical aumentado (clases `lg:pt-*` y `lg:pb-*`) y permanece centrado verticalmente respecto al buscador sin solaparse con él

### Requirement: Botón de búsqueda más ancho en lg:
El botón de búsqueda (SearchForm.astro) SHALL tener al menos 18px más de ancho en el breakpoint `lg:` para no sentirse comprimido.

#### Scenario: Botón de búsqueda ampliado en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** el ancho máximo del botón de búsqueda es al menos 18px mayor que en breakpoints menores (clase `lg:max-w-[>=78px]` o equivalente)

### Requirement: Caja flotante del inicio desplazada hacia abajo en lg:
La caja flotante sobre el banner (PanelHome.astro) SHALL desplazarse hacia abajo al menos 5rem en el breakpoint `lg:`.

#### Scenario: Caja flotante desplazada en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** la caja flotante tiene un margen superior de al menos 5rem (clase `lg:mt-20` o equivalente) respecto al banner superior

### Requirement: Valores de estadísticas reducidos en lg:
Los valores de las estadísticas (40+, 30.000+, 5+, 9+) en PanelHome.astro SHALL reducir su tamaño de fuente en el breakpoint `lg:`.

#### Scenario: Tamaño de fuente de estadísticas reducido en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** el tamaño de fuente de cada valor de estadística es menor que en breakpoints menores (clase `lg:text-*` reducida)

### Requirement: Tarjetas de productos en 2 columnas en lg:
Las 4 tarjetas de la sección "Nuestros Productos" (DestacadosSection.astro) SHALL distribuirse en 2 columnas en el breakpoint `lg:` en lugar de 4 columnas.

#### Scenario: Grid de productos en 2 columnas en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** las 4 tarjetas de productos se distribuyen en 2 columnas (clase `lg:grid-cols-2` en lugar de `lg:grid-cols-4`)

### Requirement: Tarjetas de pilares de Nosotros en 2 columnas en lg:
Las 4 tarjetas de pilares debajo de "¿Qué nos define?" (NosotrosValueProp.astro) SHALL estar en 2 columnas en el breakpoint `lg:`.

#### Scenario: Grid de pilares en 2 columnas en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** las 4 tarjetas de pilares se distribuyen en 2 columnas (clase `lg:grid-cols-2` en lugar de `lg:grid-cols-4`)

### Requirement: Tarjetas de servicios en terreno en 2 columnas en lg:
Las 4 tarjetas de "Servicios especializados en terreno" (ServiciosTerrenoSection.astro) SHALL estar en 2 columnas en el breakpoint `lg:`.

#### Scenario: Grid de servicios en terreno en 2 columnas en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** las 4 tarjetas de servicios en terreno se distribuyen en 2 columnas (contenedor cambia de columna única a `lg:grid-cols-2`)

### Requirement: Título de alianzas reducido en lg:
El título "Alianzas Estratégicas y Representación Exclusiva" en representaciones.astro SHALL reducir su tamaño al menos 1rem en el breakpoint `lg:`.

#### Scenario: Título de alianzas más pequeño en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** el tamaño de fuente del título es al menos 1rem menor que en breakpoints menores (clase `lg:text-*` reducida al menos 1rem)

### Requirement: Tarjetas de valor prop de Representaciones en 2 columnas en lg:
Las 4 tarjetas de la sección "¿Por qué adquirir a través del representante oficial en Chile?" en representaciones.astro SHALL estar en 2 columnas en el breakpoint `lg:`.

#### Scenario: Grid de valor prop en 2 columnas en lg:
- **WHEN** el viewport es `lg:` o mayor (>= 1024px)
- **THEN** las 4 tarjetas de valor propuesta se distribuyen en 2 columnas (clase `lg:grid-cols-2` en lugar de `lg:grid-cols-4`)
