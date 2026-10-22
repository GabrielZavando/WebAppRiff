# nosotros-page Specification (delta)

## REMOVED Requirements

### Requirement: Clients grid and closing CTA banner

**Reason**: La grilla estática de ocho nombres se reemplaza por el carrusel infinito de los 41 logos de clientes entregados por el cliente (change `nosotros-clients-carousel`).

**Migration**: El nuevo requirement "Clients carousel and closing CTA banner" lo sustituye; el encabezado de la sección y el banner de cierre con sus CTAs se preservan sin cambios de comportamiento.

## MODIFIED Requirements

### Requirement: Sections adapt to mobile, tablet and desktop

Cada sección del `/nosotros` SHALL ser responsive mobile-first: en viewport angosto los grids colapsan a una columna, la línea central y los badges numéricos de la timeline solo aparecen en desktop, la misión/visión se apilan, las tarjetas de equipo pasan de 1 → 2 → 4 columnas y los CTAs del banner final ocupan el ancho disponible en móvil. El carrusel de clientes SHALL mantener una altura estable y recortar el desborde horizontal (viewport con `overflow-hidden`). Ninguna sección SHALL desbordar horizontalmente en viewport angosto.

#### Scenario: SC-211 — Colapsos responsive

- **WHEN** los componentes de `/nosotros` renderizan
- **THEN** los grids de pilares, sectores y equipo declaran columnas base en móvil con incremento en breakpoints mayores (p. ej. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- **AND** el carrusel de clientes declara un viewport con `overflow-hidden` y no genera scroll horizontal en la página
- **AND** la línea central de la timeline y sus badges numéricos están ocultos fuera de desktop (clases `hidden lg:*`)
- **AND** la sección de misión/visión colapsa a una columna en móvil
- **AND** el contenido está contenido en el contenedor de página (sin elementos full-bleed que desborden)

## ADDED Requirements

### Requirement: Clients carousel and closing CTA banner

La sección final SHALL renderizar el encabezado ("Quienes Han Confiado en Nosotros" + copy verbatim) y, en lugar de la grilla estática de ocho nombres, un carrusel con los 41 logos de clientes (regido por el requirement "Clients logo carousel scrolls infinitely and pauses on hover"); no SHALL renderizar los ocho nombres en texto ni sus bajadas de sector. Además SHALL renderizar el banner de cierre "¿Listo para optimizar la medición y el flujo de su operación?" con su copy y dos CTA: "SOLICITAR ASESORÍA TÉCNICA" (→ `/contacto`) y el teléfono "+56 2 29079067" como enlace `tel:` (fuente única `getContactInfo()`).

#### Scenario: SC-207 — Carrusel de logos y banner de cierre

- **WHEN** la sección de clientes renderiza
- **THEN** el bloque de clientes contiene un carrusel con los 41 logos (no una grilla de nombres en texto)
- **AND** no se renderizan las bajadas de sector de los ocho clientes anteriores
- **AND** cada logo renderiza una imagen con `alt` no vacío
- **AND** existe el título "¿Listo para optimizar la medición y el flujo de su operación?"
- **AND** existe un ancla "SOLICITAR ASESORÍA TÉCNICA" con `href="/contacto"`
- **AND** existe un enlace `tel:+56229079067` con el texto visible "+56 2 29079067"

### Requirement: Clients logo carousel scrolls infinitely and pauses on hover

El bloque de clientes del `/nosotros` SHALL renderizar un carrusel horizontal infinito con los 41 logos de clientes ordenados alfabéticamente por nombre de empresa (orden definido en el array de configuración). Cada logo SHALL mostrarse completo, sin recorte ni distorsión, con una altura uniforme y un ancho proporcional a su relación de aspecto intrínseca; la celda blanca que lo contiene SHALL ajustar su ancho al logo, SHALL tener fondo blanco y SHALL incluir padding alrededor del logo. En escritorio (viewport ≥ 768 px) la celda SHALL medir 120 px de alto incluyendo el padding. El carrusel SHALL desplazarse automáticamente de derecha a izquierda de forma continua y lenta, con una duración de 120 segundos por ciclo completo declarada como constante de configuración. La animación SHALL implementarse únicamente con CSS (`@keyframes` + `animation-play-state`), sin JavaScript. Al hacer hover sobre el carrusel, la animación SHALL pausarse y, al retirar el cursor, SHALL reanudarse. Al hacer hover sobre un logo, el logo completo SHALL escalar ligeramente (≈1.05) sin recortarse y desbordando su caja de imagen, mientras la celda blanca conserva su tamaño, mediante composición por GPU (`scale3d`/`translateZ(0)`/`will-change: transform`), no mediante la propiedad `scale` estándar. Con `prefers-reduced-motion: reduce`, la animación SHALL quedar detenida, mostrando los logos estáticos.

#### Scenario: Desplazamiento infinito continuo

- **WHEN** la página `/nosotros` se carga con movimiento normal
- **THEN** el carrusel muestra los 41 logos y se desplaza automáticamente de derecha a izquierda
- **AND** al completar un ciclo el contenido se repite sin salto visible (loop continuo)
- **AND** la duración del ciclo completo es 120 s, definida como constante en configuración

#### Scenario: Logos completos con ancho proporcional

- **WHEN** el carrusel renderiza los logos de clientes
- **THEN** cada logo se muestra completo, sin recorte ni distorsión
- **AND** todos los logos comparten la misma altura
- **AND** el ancho de cada logo y de su celda es proporcional a la relación de aspecto del asset
- **AND** cada celda tiene fondo blanco y padding alrededor del logo
- **AND** en escritorio (viewport ≥ 768 px) cada celda mide 120 px de alto incluyendo el padding

#### Scenario: Pausa y reanudación al hover

- **WHEN** el usuario posa el cursor sobre el carrusel
- **THEN** la animación se pausa (`animation-play-state: paused`)
- **AND** al retirar el cursor la animación se reanuda automáticamente

#### Scenario: Escala del logo con aceleración por GPU

- **WHEN** el usuario posa el cursor sobre un logo
- **THEN** el logo completo escala ligeramente (≈1.05)
- **AND** el logo ampliado no se recorta y desborda su caja de imagen, mientras la celda blanca conserva su tamaño
- **AND** el efecto usa `scale3d`/`translateZ(0)`/`will-change: transform` (composición GPU), no la propiedad `scale` estándar

#### Scenario: Movimiento reducido

- **WHEN** el usuario tiene `prefers-reduced-motion: reduce`
- **THEN** el carrusel no se desplaza (animación detenida)
- **AND** los logos siguen visibles y legibles

#### Scenario: Accesibilidad del track duplicado

- **WHEN** el carrusel renderiza la copia duplicada usada para el loop continuo
- **THEN** la copia duplicada tiene `aria-hidden="true"`
- **AND** cada logo tiene `alt` no vacío con el nombre de la empresa
