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

El sistema sigue el principio **flat design estricto con ángulos rectos**: el token `--radius` es `0` (radio global cero); los componentes base (Header, TopHeader, HeroBanner, PanelHome, SearchForm) NO aplican ninguna utilidad `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg` ni variantes responsivas. Las superficies se separan por defecto con borders 1px y color sólido. Las sombras (`shadow-1..5`) se reservan exclusivamente para capas flotantes (dropdowns, menús, modales, overlays); los componentes base NO aplican `shadow-*` en su estado estático.

#### Scenario: Radius declarado como 0
- **WHEN** se parsea `apps/web/src/styles/globals.css`
- **THEN** contiene `--radius: 0` (sin sufijo `px` o con `0px`, ambos aceptados)
- **AND** el mismo valor `0` se declara en `apps/admin/src/styles/globals.css`

#### Scenario: Componentes base no aplican utilidad rounded
- **WHEN** se renderiza cualquier componente base (`TopHeader.astro`, `Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`)
- **THEN** ninguno aplica una utilidad `rounded*` (`rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`, ni variantes `md:rounded*`/`lg:rounded*`) en ningún elemento visible del componente

#### Scenario: 5 niveles de shadow declarados
- **WHEN** se parsea el bloque `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 5 declaraciones `--shadow-1` hasta `--shadow-5` con los valores exactos de la tabla

#### Scenario: Componentes base no usan sombra
- **WHEN** se renderiza cualquier componente base (`TopHeader.astro`, `Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`) en su estado estático
- **THEN** ninguno aplica una utilidad `shadow-*` en su JSX

### Requirement: Catálogo de iconos Lucide

El catálogo de iconos usados en el sistema SHALL estar documentado en `docs/design/style-guide/README.md` con el formato `<nombre-de-referencia>` → `<icono-lucide>`. El set único autorizado para UI funcional Y para iconos de marca/redes sociales es `lucide` (Iconify Lucide) — outline stroke 2px. NO se usan los sets `material-symbols`, `logos`, `mdi`, `heroicons` ni ningún otro en `apps/web/src/`.

Los iconos mínimos del catálogo SHALL incluir: `phone`, `facebook`, `x` (twitter), `instagram`, `linkedin`, `menu`, `close`, `search`, `calendar`, `check`, `warning`, `info`, `error`, `arrow-right`, `copy`, `filters`, `trash`, `more`, `clock`, `star`, `bookmark`.

Un mapeo de referencia SHALL figurar en el README con las equivalencias usadas por los 5 componentes: `phone` → `lucide:phone`, `menu` → `lucide:menu`, `close` → `lucide:x`, `facebook` → `lucide:facebook`, `x` → `lucide:twitter`, `instagram` → `lucide:instagram`, `linkedin` → `lucide:linkedin`.

#### Scenario: Catálogo documentado con nombre Lucide
- **WHEN** se lee `docs/design/style-guide/README.md`
- **THEN** contiene una tabla o lista con cada icono de referencia mapeado a su nombre completo de icono (`lucide:<name>`)
- **AND** la tabla incluye al menos los 21 iconos mínimos listados arriba
- **AND** NO menciona `material-symbols:*` ni `logos:*` como sets autorizados (esos sets quedan obsoletos)

#### Scenario: Único set de iconos en apps/web es Lucide
- **WHEN** se ejecuta un grep en `apps/web/src/` buscando referencias `<Icon name="`
- **THEN** todas las referencias usan el prefijo `lucide:` como nombre de set
- **AND** no existen referencias a `material-symbols:`, `logos:`, `mdi:`, `heroicons:` ni otras familias de iconos

#### Scenario: package.json declara @iconify-json/lucide y NO los sets obsoletos
- **WHEN** se lee `apps/web/package.json`
- **THEN** declara `@iconify-json/lucide` en `dependencies` o `devDependencies`
- **AND** NO declara `@iconify-json/material-symbols`
- **AND** NO declara `@iconify-json/logos`

## RENAMED Requirements

- FROM: ### Requirement: Catálogo de iconos Material Symbols Outline
- TO: ### Requirement: Catálogo de iconos Lucide
