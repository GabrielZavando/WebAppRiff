# site-header-scroll Specification

## MODIFIED Requirements

### Requirement: Header and Search group stick on scroll

The site SHALL keep the Header and SearchForm fixed at the top of the viewport (`position: sticky; top: 0`) when the page is scrolled down (`scrollY > 0`), grouped inside a single sticky wrapper rendered by `Layout.astro`. There is no contact bar above the group anymore. On short viewports (height <= 400px, e.g. `568×320`) the sticky group SHALL respect a viewport-height budget: the combined height of the Header and the SearchForm SHALL NOT exceed 50% of the viewport height, and the group SHALL compact its vertical padding accordingly via a viewport-height media-query variant (`[@media(max-height:400px)]:`). (MODIFIED in `responsive-web-design-fixes` — presupuesto de alto del grupo sticky en viewports de baja altura.)

#### Scenario: Sticky grouping activates on scroll
- **WHEN** the user scrolls the page so that `window.scrollY > 0`
- **THEN** the Header and SearchForm remain visible at the top of the viewport (their wrapper computes `position: sticky` with `top: 0`)
- **AND** no retired top contact bar exists in the document to scroll out of view

#### Scenario: Sticky grouping does not apply at the top
- **WHEN** the page is at `scrollTop === 0`
- **THEN** the Header and SearchForm render in their normal document flow position (no compact/sticky visual offset beyond their natural layout)

#### Scenario: El grupo sticky respeta el presupuesto de alto
- **WHEN** la página se renderiza en un viewport de `568×320`
- **THEN** la altura del wrapper sticky `.header-scroll-shell` es menor o igual a 160px (50% de 320px)
- **AND** el header y el buscador aplican su variante `[@media(max-height:400px)]:` de padding vertical reducido

#### Scenario: El presupuesto no aplica en viewports altos
- **WHEN** la página se renderiza en un viewport portrait de `375×667` o superior
- **THEN** el grupo sticky conserva su altura natural (header + buscador apilado)
- **AND** el requisito de ≤50% de la altura del viewport no se aplica en esta orientación
