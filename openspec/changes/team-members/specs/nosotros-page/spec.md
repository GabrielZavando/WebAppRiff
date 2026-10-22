# nosotros-page Specification (delta)

## REMOVED Requirements

### Requirement: Team section renders the four leadership cards

**Reason**: El equipo ficticio de 4 personas (Steven Marks, Lara Smith, John Doe y Felipe Román) se reemplaza por el roster real de 8 integrantes definido en la capability `team-roster`. El badge de área y el pie con icono dejan de formar parte del requisito de la tarjeta.

**Migration**: La sección de equipo pasa a consumir `TEAM_MEMBERS` desde `src/lib/config/team.ts`. Las tarjetas mantienen foto, nombre, cargo y descripción; se eliminan `area`, `areaTone`, `footerLabel` y `footerIcon`. El resto de la página (`/nosotros`) no cambia.

## ADDED Requirements

### Requirement: Team section renders the eight team member cards

La sección de equipo SHALL renderizar el encabezado "Equipo RIFF — Liderazgo & Experiencia" con su copy verbatim y el badge de acreditación "+100 años de experiencia combinada en terreno", y exactamente 8 tarjetas en el orden canónico definido por `TEAM_MEMBERS` de la capability `team-roster`: Ruby Barrientos, Felipe Román, Patricio Barrientos, Francisco Mehech, Eric Pérez, Loredana Quiroga, Francys Padra y Melany Bravo.

Cada tarjeta SHALL renderizar únicamente: la foto del integrante en proporción 3:4 (asset local 900x1200, vía `astro:assets`, con `alt` descriptivo no vacío), mostrada en color natural (sin filtro `grayscale`), el nombre como `<h3>`, el cargo exacto como texto visible y la descripción exacta del roster. La tarjeta NO SHALL renderizar badge de área, ni pie de tarjeta, ni icono decorativo de pie. El grid SHALL mantener el comportamiento responsive de 1 columna en móvil, 2 desde `sm` y 4 desde `lg`.

#### Scenario: SC-206 — Ocho tarjetas de equipo

- **WHEN** la sección de equipo renderiza
- **THEN** se renderizan exactamente 8 tarjetas
- **AND** los nombres en orden son Ruby Barrientos, Felipe Román, Patricio Barrientos, Francisco Mehech, Eric Pérez, Loredana Quiroga, Francys Padra y Melany Bravo
- **AND** cada tarjeta muestra el cargo exacto del roster (p. ej. "Directora · Gerenta Comercial" y "Gerente de Operaciones")
- **AND** cada tarjeta muestra la descripción exacta definida en `team-roster`
- **AND** cada tarjeta renderiza una imagen con `alt` no vacío

#### Scenario: Card is simplified to photo, name, role and description

- **WHEN** cada tarjeta renderiza
- **THEN** la tarjeta contiene la foto, el nombre, el cargo y la descripción
- **AND** la tarjeta no contiene badge de área sobre la foto
- **AND** la tarjeta no contiene pie de tarjeta ni icono Lucide de pie
- **AND** la tarjeta no renderiza los campos `area`, `areaTone`, `footerLabel` ni `footerIcon`

#### Scenario: Portrait keeps the delivered 3:4 proportion

- **WHEN** la foto de cada integrante renderiza
- **THEN** el contenedor de la foto declara una proporción 3:4 (`aspect-[3/4]`)
- **AND** la imagen se renderiza con `object-cover`
- **AND** la imagen declara `loading="lazy"`

#### Scenario: Portrait is shown in full color

- **WHEN** la foto de cada integrante renderiza en `/nosotros`
- **THEN** la imagen NO declara el filtro `grayscale`
- **AND** la foto conserva sus colores naturales

#### Scenario: Section header and accreditation badge are preserved

- **WHEN** la sección de equipo renderiza
- **THEN** existe el `<h2>` "Equipo RIFF — Liderazgo & Experiencia"
- **AND** existe el badge "+100 años de experiencia combinada en terreno" con un icono Lucide decorativo
- **AND** el subtítulo "Profesionales comprometidos con la precisión y el servicio técnico en terreno." está presente

#### Scenario: Grid remains responsive 1 -> 2 -> 4

- **WHEN** el grid de tarjetas renderiza
- **THEN** el contenedor declara `grid-cols-1`, `sm:grid-cols-2` y `lg:grid-cols-4`
- **AND** aplica un gap uniforme entre tarjetas
- **AND** no se genera scroll horizontal en viewport angosto
