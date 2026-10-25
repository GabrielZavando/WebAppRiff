# Spec Delta — nosotros-page

## REMOVED Requirements

### Requirement: Historical timeline renders the five milestones under #historia
**Reason**: El cliente aprobó un nuevo relato institucional con 4 hitos (1979, 2013, 2018, Dic-2024); el hito "2012 — Consolidación & Continuidad Familiar" desaparece del relato y el copy de los hitos restantes se reemplaza íntegramente (decisión del usuario: reemplazo total, 2026-10-24).
**Migration**: Sustituido por el requirement "Historical timeline renders the four approved milestones under #historia" (ver ADDED), que conserva el ancla `#historia`, la estructura de tarjetas, los tonos y las notas laterales.

## ADDED Requirements

### Requirement: Historical timeline renders the four approved milestones under #historia

La sección de línea de tiempo SHALL llevar el `id="historia"` y renderizar exactamente 4 hitos en orden cronológico con el copy verbatim aprobado por el cliente (2026-10-24) — 1979 (título "Nuestro Origen", tone `primary`, badge "AÑO 1979"), 2013 (título "Nace Aguapur Medición", tone `primary`, badge "AÑO 2013"), 2018 (título "El Nacimiento de RIFF", tone `accent`, badge "AÑO 2018") y Diciembre 2024 (título "La Evolución hacia RIFF", tone `dark`, badge "DICIEMBRE 2024") — conservando el diseño y la estructura de tarjetas actual (badge, `<h3>`, párrafo, nota lateral, marcadores 01..03 + ★ en el último, alternancia de posiciones por índice). Las notas laterales existentes SHALL conservarse en los hitos sobrevivientes ("Hito Clave" 1979, "Hito de Especialización" 2013, "Salto Tecnológico" 2018, "Capacidad Actual" Dic-2024) y la nota del hito 2012 SHALL desaparecer junto con su hito. El resaltado `<strong>` del hito 2024 SHALL apuntar a la subcadena "RIFF" del nuevo texto (equivalente visual del anterior resaltado "RIFF SpA"). El encabezado de sección (eyebrow, título y párrafo introductorio) y el ancla del hero "CONOCER NUESTRA HISTORIA" (`href="#historia"`) SHALL conservarse sin cambios.

#### Scenario: Timeline renders exactly four milestones in chronological order

- **WHEN** la sección de historia renderiza
- **THEN** existe un elemento con `id="historia"`
- **AND** se renderizan exactamente 4 hitos con los años/badges "AÑO 1979", "AÑO 2013", "AÑO 2018" y "DICIEMBRE 2024"
- **AND** los títulos `<h3>` son, en orden, "Nuestro Origen", "Nace Aguapur Medición", "El Nacimiento de RIFF" y "La Evolución hacia RIFF"
- **AND** ningún hito muestra el texto "Consolidación & Continuidad Familiar" ni el badge "AÑO 2012"

#### Scenario: 1979 milestone renders the approved copy verbatim

- **WHEN** el hito 1979 renderiza
- **THEN** su párrafo contiene, verbatim, el texto aprobado que comienza "En 1979, comienza nuestra historia con la creación de Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales."
- **AND** menciona el legado de 2012 ("el legado continuó en 2012 con la siguiente generación: sus hijos")
- **AND** conserva la nota lateral con label "Hito Clave"

#### Scenario: 2013 and 2018 milestones render the approved copy verbatim

- **WHEN** los hitos 2013 y 2018 renderizan
- **THEN** el hito 2013 contiene el texto que comienza "En 2013, Ruby Barrientos Periale, la única hija del Sr. Patricio Barrientos, junto a su esposo Felipe Román Araya, fundó Aguapur Medición."
- **AND** el hito 2018 contiene el texto que comienza "En 2018, RIFF nace como una línea de negocio dentro de Aguapur Medición, enfocada en la fabricación y comercialización de flujómetros."
- **AND** conservan sus notas laterales "Hito de Especialización" y "Salto Tecnológico" respectivamente

#### Scenario: December 2024 milestone renders the approved copy with the RIFF highlight and a two-item list

- **WHEN** el hito Diciembre 2024 renderiza
- **THEN** su párrafo contiene, verbatim, el texto aprobado que comienza "En diciembre de 2024, damos un paso significativo en nuestra trayectoria con la transformación de Aguapur Medición en RIFF." y termina exactamente en "expandimos nuestra oferta para incluir:"
- **AND** el párrafo va seguido de una lista con viñetas de exactamente 2 ítems: "Equipos y Suministros para Tratamiento de Agua." y "Desarrollo de Productos Químicos."
- **AND** el párrafo posterior "En RIFF, contamos con un equipo de profesionales con más de 30 años..." SHALL NOT aparecer en el timeline (se reubica en la sección de propuesta de valor)
- **AND** la subcadena "RIFF" del párrafo se renderiza dentro de un `<strong>` (tarjeta oscura con resaltado, igual que el diseño anterior)
- **AND** conserva la nota lateral con label "Capacidad Actual"

#### Scenario: Timeline structure, markers and anchor are preserved

- **WHEN** la sección de historia renderiza con los nuevos hitos
- **THEN** el ancla del hero "CONOCER NUESTRA HISTORIA" sigue apuntando a `href="#historia"`
- **AND** los marcadores numéricos de escritorio son 01, 02, 03 y la estrella (★/lucide:star) en el último hito
- **AND** las tarjetas conservan sus tonos (`primary`, `primary`, `accent`, `dark`), la alternancia de posiciones por índice y el encabezado de sección sin cambios

## MODIFIED Requirements

### Requirement: Value proposition renders four pillars and four industry sectors

La sección de propuesta de valor SHALL renderizar el encabezado con el título "¿Qué nos define?" (renombrado desde "Nuestra Propuesta de Valor" en este change, 2026-10-24) y como párrafo introductorio el cuerpo verbatim "En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria. Esto nos permite ofrecer a nuestros clientes las mejores soluciones técnicas, respaldadas por equipos y materiales de empresas líderes globales, representadas en exclusiva por nosotros en Chile. Nuestra calidad nos ha permitido captar y mantener como clientes a una parte importante de las principales compañías industriales del país, incluidas las de los sectores minero, alimenticio y rural. Estas industrias se benefician constantemente de la durabilidad, eficiencia y calidad de los productos que suministramos, así como de nuestro servicio de postventa, que forma parte integral de nuestra propuesta de valor." (reemplaza al intro anterior "Más de tres décadas acumuladas de know-how hidrométrico…"); los 4 pilares — Durabilidad Extrema, Precisión Certificada, Eficiencia Hídrica, Servicio In-Situ — cada uno con icono Lucide decorativo, título, descripción y nota al pie de la referencia; y el bloque "Presencia Sólida en Industrias Críticas" con las 4 tarjetas de sector — Gran Minería & Pulpa, Alimentos & Bebidas, Redes Rurales (APR), Edificación & Inmobiliario — cada una con número "SECTOR 0x", descripción verbatim e icono Lucide decorativo.

#### Scenario: SC-204 — 4 pilares y 4 sectores

- **WHEN** la sección de propuesta de valor renderiza
- **THEN** se renderizan los títulos "Durabilidad Extrema", "Precisión Certificada", "Eficiencia Hídrica" y "Servicio In-Situ"
- **AND** cada pilar muestra su descripción de la referencia (p. ej. "Componentes de fundición dúctil…")
- **AND** se renderizan los títulos "Gran Minería & Pulpa", "Alimentos & Bebidas", "Redes Rurales (APR)" y "Edificación & Inmobiliario"
- **AND** las tarjetas de sector muestran los sellos "SECTOR 01" … "SECTOR 04" y su descripción verbatim
- **AND** los iconos de pilares y sectores se resuelven vía el set Lucide (`lucide:`) y son decorativos (`aria-hidden="true"`)

#### Scenario: Renamed section header with the relocated intro paragraph

- **WHEN** la sección de propuesta de valor renderiza en `/nosotros`
- **THEN** el `<h2>` de la sección muestra exactamente "¿Qué nos define?"
- **AND** el párrafo introductorio es el cuerpo verbatim que comienza "En RIFF, contamos con un equipo de profesionales con más de 30 años de experiencia en la industria."
- **AND** el intro anterior "Más de tres décadas acumuladas de know-how hidrométrico…" ya no se renderiza
- **AND** ese párrafo no aparece en ninguna tarjeta del timeline (vive exclusivamente en esta sección)
