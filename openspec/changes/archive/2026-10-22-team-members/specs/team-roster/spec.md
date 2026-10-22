# team-roster Specification (delta)

## ADDED Requirements

### Requirement: Canonical team roster contains the eight members

El sitio SHALL definir el roster canónico del equipo en `apps/web/src/lib/config/team.ts`, exportado como `TEAM_MEMBERS`, con exactamente 8 integrantes en este orden:

| # | id | Nombre | Cargo | Descripción |
|---|---|---|---|---|
| 1 | `ruby-barrientos` | Ruby Barrientos | Directora · Gerenta Comercial | A cargo de la estrategia comercial y el desarrollo de RIFF, orientando el crecimiento, las relaciones estratégicas y la generación de nuevas oportunidades de negocio. |
| 2 | `felipe-roman` | Felipe Román | Gerente de Operaciones | A cargo de la gestión operativa, coordinando procesos, recursos y proyectos para asegurar una ejecución eficiente y el cumplimiento de los compromisos con nuestros clientes. |
| 3 | `patricio-barrientos` | Patricio Barrientos | Ingeniero Químico · Asesor Técnico | Referente técnico en tratamiento de agua y procesos industriales, aportando experiencia y conocimiento especializado en el análisis y desarrollo de soluciones para aplicaciones de distinta complejidad. |
| 4 | `francisco-mehech` | Francisco Mehech | Coordinador de Servicios y Logística | Coordina la gestión de servicios en terreno y los procesos logísticos asociados, articulando requerimientos, recursos y entregas para dar respuesta a las necesidades de cada proyecto. |
| 5 | `eric-perez` | Eric Pérez | Responsable de Ingeniería y Puesta en Marcha | Referente del área de ingeniería en terreno, instalación, instrumentación y puesta en marcha de equipos y sistemas, apoyando además el diagnóstico y resolución de requerimientos técnicos de mayor complejidad. |
| 6 | `loredana-quiroga` | Loredana Quiroga | Líder de Ventas Técnicas y Licitaciones | A cargo de la gestión de ventas técnicas y oportunidades provenientes de licitaciones y portales, coordinando propuestas y requerimientos para diferentes aplicaciones y sectores industriales. |
| 7 | `francys-padra` | Francys Padra | Responsable de Desarrollo Comercial | Orienta la gestión y desarrollo de oportunidades comerciales, fortaleciendo la relación con clientes y conectando sus requerimientos con el portafolio de productos y servicios de RIFF. |
| 8 | `melany-bravo` | Melany Bravo | Coordinadora de Gestión Interna | Coordina procesos administrativos y de soporte interno, facilitando la gestión documental y la articulación entre las distintas áreas de la organización. |

Cada entrada de `TEAM_MEMBERS` SHALL ser un objeto `TeamMember` con campos `readonly`: `id`, `name`, `role`, `description`, `image`, `imageAlt` e `isFeatured`. Los `id` SHALL ser únicos. `role` SHALL ser el texto visible exacto del cargo (no un slug ni un código que requiera una función de traducción). El orden del array SHALL ser el orden canónico de render.

#### Scenario: Roster contains the eight members in canonical order

- **WHEN** se inspecciona `TEAM_MEMBERS`
- **THEN** el array tiene exactamente 8 entradas
- **AND** los nombres en orden son Ruby Barrientos, Felipe Román, Patricio Barrientos, Francisco Mehech, Eric Pérez, Loredana Quiroga, Francys Padra y Melany Bravo
- **AND** los cargos coinciden exactamente con los de la tabla del requirement

#### Scenario: Every member exposes the complete typed contract

- **WHEN** se inspecciona cada entrada de `TEAM_MEMBERS`
- **THEN** `id`, `name`, `role`, `description`, `image`, `imageAlt` e `isFeatured` existen
- **AND** `id`, `name`, `role`, `description` y `imageAlt` son strings no vacíos
- **AND** `image` es un `ImageMetadata` importado desde `@/assets/img/nosotros/`
- **AND** `isFeatured` es un booleano
- **AND** todos los `id` son únicos
- **AND** ninguna entrada usa `any`

#### Scenario: Descriptions are the exact client copy

- **WHEN** se inspecciona la descripción de cada integrante
- **THEN** cada `description` coincide exactamente con el texto de la tabla del requirement
- **AND** no se añaden, eliminan ni reformulan frases del copy entregado

### Requirement: Featured selection exposes exactly three members

El roster SHALL exportar `FEATURED_TEAM_MEMBERS` como el subconjunto de `TEAM_MEMBERS` cuyo `isFeatured` es `true`, preservando el orden canónico. Hoy SHALL contener exactamente 3 integrantes: Ruby Barrientos, Felipe Román y Patricio Barrientos.

#### Scenario: Exactly three members are featured

- **WHEN** se inspecciona `FEATURED_TEAM_MEMBERS`
- **THEN** el array tiene exactamente 3 entradas
- **AND** los nombres son Ruby Barrientos, Felipe Román y Patricio Barrientos, en ese orden
- **AND** todos sus `isFeatured` son `true`

#### Scenario: Featured is derived and excludes the rest of the roster

- **WHEN** se comparan `FEATURED_TEAM_MEMBERS` y `TEAM_MEMBERS`
- **THEN** `FEATURED_TEAM_MEMBERS` contiene todos los miembros con `isFeatured === true`
- **AND** no contiene ningún miembro con `isFeatured === false`
- **AND** el orden relativo de los destacados es el mismo que en `TEAM_MEMBERS`

### Requirement: Member photos map to the correct roster entries

Cada integrante SHALL mapear su retrato al archivo correcto de `apps/web/src/assets/img/nosotros/`: `ruby-barrientos.jpg`, `felipe-roman.jpg`, `patricio-barrientos.jpg`, `francisco-mehech.jpg`, `eric-perez.jpg`, `loredana-quiroga.jpg`, `francys-padra.jpg` y `melany-bravo.jpg`. Todas las fotos SHALL ser locales, de proporción 3:4 (900x1200), renderizadas vía `astro:assets` y con un `alt` descriptivo no vacío, distinto del nombre literal del integrante.

#### Scenario: Each member uses the expected image file

- **WHEN** se inspecciona `image.src` de cada integrante
- **THEN** Ruby usa `ruby-barrientos.jpg`, Felipe usa `felipe-roman.jpg`, Patricio usa `patricio-barrientos.jpg` y Francisco usa `francisco-mehech.jpg`
- **AND** Eric usa `eric-perez.jpg`, Loredana usa `loredana-quiroga.jpg`, Francys usa `francys-padra.jpg` y Melany usa `melany-bravo.jpg`
- **AND** ninguna imagen proviene de una URL externa ni de `public/`

#### Scenario: Photos keep the delivered 3:4 proportion

- **WHEN** se inspecciona `image` de cada integrante
- **THEN** `image.width` es 900 e `image.height` es 1200
- **AND** la relación de aspecto es 3:4

#### Scenario: Alt text is descriptive and non-empty

- **WHEN** se inspecciona `imageAlt` de cada integrante
- **THEN** el valor no está vacío
- **AND** describe la fotografía o el contexto del retrato
- **AND** no es idéntico al valor de `name`

### Requirement: Roster is the single source of truth

`apps/web/src/lib/config/team.ts` SHALL ser la única definición de los integrantes. `NOSOTROS_TEAM_SECTION_CONTENT.members` SHALL ser `FEATURED_TEAM_MEMBERS` y `NOSOTROS_PAGE_CONTENT.team.members` SHALL ser `TEAM_MEMBERS`; ninguna de las dos configuraciones de página SHALL volver a declarar nombres, cargos, descripciones, imágenes ni el flag `isFeatured`.

#### Scenario: Home config consumes the featured selection

- **WHEN** se inspecciona `NOSOTROS_TEAM_SECTION_CONTENT`
- **THEN** `members` es exactamente `FEATURED_TEAM_MEMBERS`
- **AND** la config no contiene literales de integrantes ni imports de imágenes de retratos

#### Scenario: About page config consumes the full roster

- **WHEN** se inspecciona `NOSOTROS_PAGE_CONTENT.team`
- **THEN** `members` es exactamente `TEAM_MEMBERS`
- **AND** la config no contiene literales de integrantes ni imports de imágenes de retratos

#### Scenario: No duplicated roster literals

- **WHEN** se busca en las configuraciones de la Home y de `/nosotros`
- **THEN** los nombres, cargos, descripciones e imports de fotos del equipo existen únicamente en `src/lib/config/team.ts`
