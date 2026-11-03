## MODIFIED Requirements

### Requirement: SearchForm inner container is constrained to 760px and centered with mobile horizontal padding

The SearchForm SHALL center its form content area horizontally in every viewport. The inner container div (direct parent of `<form>`) SHALL carry `mx-auto` and SHALL NOT carry the `container` utility (which applies `max-w-7xl` = 1280px with horizontal padding). Width behavior SHALL be breakpoint-dependent:

- **Below `md` (< 768px)**: the inner container SHALL carry `w-full`, `max-w-[760px]` and `px-4` horizontal padding so the form does not touch the screen edges.
- **From `md` (≥ 768px) up to `< xl` (< 1280px)**: the inner container SHALL occupy exactly 90% of the available viewport width (`md:w-[90%]`), SHALL remove the 760px cap (`md:max-w-none`) and SHALL remove the mobile horizontal padding (`md:px-0`), remaining horizontally centered.
- **From `xl` (≥ 1280px)**: the inner container SHALL restore the maximum width of 760px (`xl:max-w-[760px]`) and remain centered, so the search bar does not keep growing on desktop.

The inner container SHALL NOT carry `px-6` or `px-8` (only `px-4` on mobile is allowed). The outer `role="search"` wrapper SHALL retain full viewport width with its background and border.

#### Scenario: Inner container uses max-w-760px and mobile horizontal padding

- **WHEN** el SearchForm se renderiza en un viewport `< 768px`
- **THEN** el div directamente envolvente de `<form>` lleva `max-w-[760px]`
- **AND** ese div lleva `mx-auto` (centrado)
- **AND** ese div NO contiene la utility `container` (que es `max-w-7xl`)
- **AND** ese div lleva `px-4` (16px de padding horizontal en móvil)
- **AND** ese div NO contiene `px-6` ni `px-8` (solo `px-4` en móvil está permitido)

#### Scenario: From md to below xl the container is 90% of the viewport and centered

- **WHEN** el SearchForm se renderiza en los viewports `768×1024`, `1024×768` y `1204×800`
- **THEN** el div directamente envolvente de `<form>` lleva `md:w-[90%]`
- **AND** ese div lleva `md:max-w-none` (sin el tope de 760px)
- **AND** ese div lleva `md:px-0`
- **AND** el ancho renderizado del div es el 90% del ancho del viewport (±1px por redondeo de sub-píxel)
- **AND** el margen izquierdo y el derecho del div son iguales (±1px), confirmando el centrado horizontal
- **AND** el div NO lleva `px-6` ni `px-8`

#### Scenario: From xl the container restores the 760px cap

- **WHEN** el SearchForm se renderiza en un viewport `>= 1280px`
- **THEN** el div directamente envolvente de `<form>` lleva `xl:max-w-[760px]`
- **AND** el ancho renderizado del div es de como máximo 760px (±1px)
- **AND** el div permanece centrado (`mx-auto`)

#### Scenario: No horizontal overflow across the md range

- **WHEN** se carga cualquier página con buscador en los viewports `768×1024`, `1024×768` y `1204×800`
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` queda dentro del ancho del viewport
