# Proposal

## Why

La Home y `/nosotros` muestran hoy dos equipos ficticios distintos (Steven Marks, Lara Smith, John Doe y Felipe Román) definidos en dos configuraciones independientes. El cliente entregó el roster real de 8 integrantes con fotos definitivas y pidió que la Home destaque a 3, mientras `/nosotros` muestra a los 8. Mantener dos fuentes de datos duplicadas garantiza inconsistencias de copy, cargos e imágenes; se necesita una única fuente de verdad y una selección explícita de destacados.

## What Changes

- Añadir una fuente única del roster en `apps/web/src/lib/config/team.ts` (tipos en `src/lib/types/team.ts`) con los 8 integrantes reales, sus fotos, cargos, descripciones y el campo `isFeatured`.
- Derivar `FEATURED_TEAM_MEMBERS` (exactamente 3) mediante `isFeatured`; la Home consume solo los destacados y `/nosotros` consume el roster completo.
- Home: reemplazar el contenido ficticio por Ruby Barrientos, Felipe Román y Patricio Barrientos. Mantener el diseño editorial actual (foto, overlay degradado, nombre y cargo sobre la imagen, hover grayscale → color, offset de la tarjeta central) y añadir la descripción dentro del overlay.
- `/nosotros`: reemplazar las 4 tarjetas ficticias por las 8 reales y simplificar cada tarjeta a foto, nombre, cargo y descripción. Eliminar el badge de área y el pie con icono; mantener el header de sección con su badge de acreditación.
- Mapear cada integrante con su archivo real de `apps/web/src/assets/img/nosotros/` (`ruby-barrientos.jpg`, `felipe-roman.jpg`, `patricio-barrientos.jpg`, `francisco-mehech.jpg`, `eric-perez.jpg`, `loredana-quiroga.jpg`, `francys-padra.jpg`, `melany-bravo.jpg`).
- Mantener los dos componentes existentes (`NosotrosTeamSection.astro` y `NosotrosTeamGrid.astro`) sin crear una tarjeta compartida; ambos se alimentan del roster compartido.
- **No** se modifica el backend, la API, Firestore ni el panel admin: el roster sigue siendo contenido hardcodeado del sitio SSG.

## Capabilities

### New Capabilities

- `team-roster`: contrato de la fuente única del equipo — 8 integrantes en orden canónico, copy exacto, mapeo de fotos, `isFeatured` y derivación de los 3 destacados.

### Modified Capabilities

- `team-section`: la sección de la Home pasa del contenido ficticio de 3 personas a los 3 destacados reales, añade descripción a la tarjeta y cambia el contrato de `TeamMember` (rol como texto visible, `isFeatured`, `description`) manteniendo el diseño y el comportamiento de hover actuales.
- `nosotros-page`: la sección de equipo pasa de 4 tarjetas ficticias a las 8 reales, simplifica la tarjeta a foto + nombre + cargo + descripción y elimina los badges de área y el pie con icono. El grid responsive `1 → 2 → 4` se mantiene.

## Impact

- **Frontend** (`apps/web/`):
  - Nuevos: `src/lib/config/team.ts`, `src/lib/types/team.ts` y sus tests.
  - Modificados: `src/lib/config/nosotros-team-section.ts`, `src/lib/types/nosotros-team-section.ts`, `src/lib/config/nosotros-page.ts`, `src/lib/types/nosotros-page.ts`.
  - Componentes: `src/components/NosotrosTeamSection.astro` (Home) y `src/components/NosotrosTeamGrid.astro` (`/nosotros`).
  - Tests: `NosotrosTeamSection.test.ts`, `NosotrosTeamGrid.test.ts`, tests de config/tipos y `pages/__tests__/nosotros.test.ts` en lo que dependa del equipo.
- **Assets**: 8 fotos reales en `src/assets/img/nosotros/` (900x1200, 3:4). Se importan con `astro:assets`; el pipeline `sharp` genera WebP en build.
- **Specs**: nueva `team-roster`; deltas `MODIFIED` para `team-section` y `REMOVED` + `ADDED` para el requirement de equipo de `nosotros-page`.
- **Sin impacto**: backend, API, Firestore, panel admin, Layout/Header/Footer, sistema de tokens y dependencias npm.
