## REMOVED Requirements

### Requirement: PanelHome adornos la grid de estadísticas con un divisor en forma de más signo (+) mediante gap-px

**Reason**: El divisor basado en `gap-px` sobre un wrapper con `background-color: var(--color-primary)` produce líneas de 1px dependientes del redondeo subpíxel del grid, que a 640px se perciben superpuestas o irregulares. Se reemplaza por un esquema de bordes CSS determinista.

**Migration**: La verificación del divisor pasa a los escenarios de la nueva requirement "PanelHome renders the 2x2 stats grid with deterministic 1px dividers and a single outer border". El wrapper `stats-grid-wrap` y el contrato de accesibilidad se conservan.

## ADDED Requirements

### Requirement: PanelHome renders the 2x2 stats grid with deterministic 1px dividers and a single outer border

El `panel-home` right-half stats grid SHALL renderizar un marco rectangular de 1px en el color primario (`--color-primary`, `#41B3C4`) alrededor de las cuatro celdas y dos divisores interiores de 1px (uno vertical entre columnas y uno horizontal entre filas), de modo que el resultado sea un signo `+` estable, sin bordes duplicados ni líneas de distinto grosor.

La estructura SHALL ser: un wrapper `relative stats-grid-wrap flex-1` que se estira a la altura completa de la mitad blanca; dentro, un contenedor `grid grid-rows-2 h-full w-full border border-primary divide-y divide-primary`; dentro de cada fila, un `grid grid-cols-2 divide-x divide-primary` con dos celdas. Cada celda SHALL conservar `bg-white p-4 md:p-8 lg:p-12 flex flex-col justify-center min-w-0`. El componente SHALL NOT usar `gap-px` ni `grid-rows-2` con fondo primario para dibujar los divisores.

El padding SHALL vivir en las cells, no en el wrapper, para que los divisores alcancen los bordes reales de la mitad blanca. Los divisores son bordes CSS (no elementos DOM separados), por lo que no requieren `aria-hidden` y no alteran el texto ni el orden accesible de los cuatro valores y sus labels.

#### Scenario: Stats grid uses deterministic borders instead of gap-px

- **WHEN** el PanelHome renderiza la mitad derecha
- **THEN** la grid 2×2 está envuelta en un container `relative` (`stats-grid-wrap`) que se estira a la altura completa de la mitad blanca
- **AND** el contenedor de la grid declara `grid grid-rows-2 h-full w-full border border-primary divide-y divide-primary`
- **AND** cada fila declara `grid grid-cols-2 divide-x divide-primary`
- **AND** el componente no declara `gap-px` ni `grid-cols-2 grid-rows-2` con fondo primario como mecanismo de divisor

#### Scenario: Internal dividers are exactly 1px and never overlap

- **WHEN** el panel renderizado se inspecciona en el viewport `640×800`
- **THEN** el borde exterior computado del marco es de 1px en el color primario
- **AND** el divisor vertical computado entre las dos columnas es de 1px
- **AND** el divisor horizontal computado entre las dos filas es de 1px
- **AND** ningún par de celdas adyacentes comparte un borde duplicado de 2px

#### Scenario: Divider colour resolves from the primary token

- **WHEN** los bordes y divisores se inspeccionan
- **THEN** su color computado se resuelve de `--color-primary` (`rgb(65, 179, 196)`)
- **AND** el background-color de las cells se resuelve a blanco (`rgb(255, 255, 255)`)
- **AND** ningún literal hexadecimal aparece en el source del componente para el color del divisor

#### Scenario: Divider lines reach the actual edges of the white half

- **WHEN** el panel renderizado se mide
- **THEN** la cell más izquierda comienza en el borde izquierdo del marco (dentro de 1px)
- **AND** la cell más derecha termina en el borde derecho del marco (dentro de 1px)
- **AND** la cell más arriba comienza en el borde superior del marco (dentro de 1px)
- **AND** la cell más abajo termina en el borde inferior del marco (dentro de 1px)

#### Scenario: Divider no impacta accesibilidad

- **WHEN** el DOM renderizado se inspecciona con tecnologías asistenciales
- **THEN** los cuatro valores `<p>` estadísticos y sus labels permanecen sin modificar en texto y orden accesible
- **AND** los divisores son bordes CSS sin elementos DOM adicionales ni atributos ARIA
