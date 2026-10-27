# design-tokens Specification

## MODIFIED Requirements

### Requirement: Radio y sombras — flat design

El `globals.css` SHALL declarar:

| Token CSS | Valor |
|---|---|
| `--radius` | `0` |
| `--shadow-1` | `0 1px 2px rgba(22,32,46,.06)` |
| `--shadow-2` | `0 2px 6px rgba(22,32,46,.08)` |
| `--shadow-3` | `0 4px 12px rgba(22,32,46,.10)` |
| `--shadow-4` | `0 8px 20px rgba(22,32,46,.12)` |
| `--shadow-5` | `0 12px 28px rgba(22,32,46,.14)` |

El sistema sigue el principio **flat design estricto con ángulos rectos**: el token `--radius` es `0` (radio global cero); los componentes base (Header, HeroBanner, PanelHome, SearchForm) NO aplican ninguna utilidad `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg` ni variantes responsivas. Las superficies se separan por defecto con borders 1px y color sólido. Las sombras (`shadow-1..5`) se reservan exclusivamente para capas flotantes (dropdowns, menús, modales, overlays); los componentes base NO aplican `shadow-*` en su estado estático.

#### Scenario: Radius declarado como 0
- **WHEN** se parsea `apps/web/src/styles/globals.css`
- **THEN** contiene `--radius: 0` (sin sufijo `px` o con `0px`, ambos aceptados)
- **AND** el mismo valor `0` se declara en `apps/admin/src/styles/globals.css`

#### Scenario: Componentes base no aplican utilidad rounded
- **WHEN** se renderiza cualquier componente base (`Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`)
- **THEN** ninguno aplica una utilidad `rounded*` (`rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`, ni variantes `md:rounded*`/`lg:rounded*`) en ningún elemento visible del componente

#### Scenario: 5 niveles de shadow declarados
- **WHEN** se parsea el bloque `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 5 declaraciones `--shadow-1` hasta `--shadow-5` con los valores exactos de la tabla

#### Scenario: Componentes base no usan sombra
- **WHEN** se renderiza cualquier componente base (`Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`) en su estado estático
- **THEN** ninguno aplica una utilidad `shadow-*` en su JSX
