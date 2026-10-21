## ADDED Requirements

### Requirement: Catálogo de iconos del rediseño de servicios
El catálogo documentado en `docs/design/style-guide/README.md` SHALL incluir los mapeos `flask-conical` → `lucide:flask-conical`, `settings-2` → `lucide:settings-2` y `square-check` → `lucide:square-check`, usados por los nuevos componentes de `/servicios`. Todos los iconos de los componentes nuevos SHALL consumirse vía `astro-icon` con el prefijo `lucide:` y SHALL ser decorativos (`aria-hidden="true"`) cuando acompañan texto.

#### Scenario: Catálogo actualizado
- **WHEN** se lee `docs/design/style-guide/README.md`
- **THEN** contiene las tres entradas nuevas `flask-conical`, `settings-2` y `square-check` con su nombre completo `lucide:<name>`

#### Scenario: Set único en los componentes nuevos
- **WHEN** se inspeccionan `SolucionPortafolioCard.astro` y `ServicioTerrenoCard.astro`
- **THEN** todas las referencias de icono usan el prefijo `lucide:`
- **AND** no se referencia `material-symbols:`, `logos:`, `mdi:` ni `heroicons:`
