# design-tokens Specification

## Purpose

Define canónicamente el sistema de design tokens del Catálogo Digital Riff: colores (marca + neutros + estado), tipografías (Montserrat / Open Sans), radio y sombras. Los tokens se declaran como entradas `@theme` de Tailwind v4 en `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css` (sincronizados manualmente), y se consumen vía utilities Tailwind (`bg-primary`, `text-secondary`, `border-border`, `shadow-1`, etc.). Fuente visual canónica: `docs/design/style-guide/index.html`.

## Requirements

## ADDED Requirements

### Requirement: Marca — paleta de 12 colores

El `globals.css` SHALL declarar en el bloque `@theme {}` los 12 tokens de color de marca extraídos de la guía visual, con nombres y valores exactos:

| Token CSS | HEX | Tailwind utility |
|---|---|---|
| `--color-primary` | `#41B3C4` | `bg-primary` / `text-primary` / `border-primary` |
| `--color-primary-dark` | `#2E9AAD` | `-dark` |
| `--color-primary-darker` | `#227E8E` | `-darker` |
| `--color-primary-light` | `#D2EEF2` | `-light` |
| `--color-primary-100` | `#EAF7F9` | `-100` |
| `--color-secondary` | `#1F2D40` | `bg-secondary` / `text-secondary` / `from-secondary` |
| `--color-secondary-dark` | `#16202E` | `-dark` |
| `--color-secondary-light` | `#35455E` | `-light` |
| `--color-accent` | `#F26A21` | `bg-accent` / `text-accent` |
| `--color-accent-dark` | `#D14E12` | `-dark` |
| `--color-accent-darker` | `#B03E0E` | `-darker` |
| `--color-accent-light` | `#FDE8DC` | `-light` |

El componente/consumidor SHALL usar exclusivamente las utilities Tailwind generadas desde estos tokens; nunca literales hex.

#### Scenario: Tokens de marca presentes en globals.css de apps/web
- **WHEN** se inspecciona `apps/web/src/styles/globals.css`
- **THEN** el bloque `@theme {}` contiene las 12 declaraciones listadas arriba (`--color-primary: #41B3C4` hasta `--color-accent-light: #FDE8DC`)
- **AND** ninguna de las declaraciones usa el prefijo obsoleto `--color-brand-*`

#### Scenario: Tokens de marca presentes en globals.css de apps/admin
- **WHEN** se inspecciona `apps/admin/src/styles/globals.css`
- **THEN** el bloque `@theme {}` contiene las mismas 12 declaraciones con los mismos valores que `apps/web`
- **AND** la comparación programática entre los dos `@theme` SHALL reportar cero diferencias

#### Scenario: Utilities Tailwind de marca consumibles en .astro
- **WHEN** un componente `.astro` aplica la clase `bg-primary`
- **THEN** el CSS generado por Tailwind v4 resuelve a `background-color: var(--color-primary)` (i.e. `#41B3C4`)
- **AND** la utilidad `text-accent` resuelve a `color: var(--color-accent)` (i.e. `#F26A21`)

### Requirement: Neutros — 6 tokens para texto, bordes y fondos

El `globals.css` SHALL declarar 6 tokens neutros:

| Token CSS | HEX | Uso semántico |
|---|---|---|
| `--color-text` | `#1F2D40` | texto base (sinónimo intencional de `--color-secondary`) |
| `--color-text-2` | `#5C6675` | texto secundario |
| `--color-muted` | `#98A1AC` | texto terciario / placeholder |
| `--color-border` | `#E3E8ED` | border base 1px de paneles |
| `--color-bg` | `#F6F8FA` | fondo de sección / página |
| `--color-white` | `#FFFFFF` | superficie sobre fondo |

#### Scenario: Tokens neutros presentes en globals.css
- **WHEN** se parsea el `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 6 declaraciones listadas (`--color-text`, `--color-text-2`, `--color-muted`, `--color-border`, `--color-bg`, `--color-white`)
- **AND** los valores hex coinciden con los de la tabla

#### Scenario: Utilidad text-muted disponible en componentes
- **WHEN** un componente aplica `text-muted`
- **THEN** el color computado resuelve a `#98A1AC`

### Requirement: Estado — 12 tokens para 4 estados semánticos

El `globals.css` SHALL declarar 4 estados (success, warning, error, info) con 3 tonos cada uno (base, dark, light) = 12 tokens:

| Estado | Base | Dark | Light |
|---|---|---|---|
| Success | `--color-success: #25D366` | `--color-success-dark: #149A49` | `--color-success-light: #E4F8EC` |
| Warning | `--color-warning: #F5B01E` | `--color-warning-dark: #9A6E08` | `--color-warning-light: #FEF4DC` |
| Error | `--color-error: #E0453A` | `--color-error-dark: #B93127` | `--color-error-light: #FCE9E7` |
| Info | `--color-info: #2D9CDB` | `--color-info-dark: #1B74A6` | `--color-info-light: #E7F3FB` |

#### Scenario: Tokens de estado presentes en globals.css
- **WHEN** se parsea el `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 12 declaraciones de estado con los valores hex exactos de la tabla
- **AND** cada estado expone sus 3 tonos (base, dark, light)

#### Scenario: Utilidad bg-success-light consumible
- **WHEN** un componente aplica `bg-success-light`
- **THEN** el color de fondo resuelve a `#E4F8EC`

### Requirement: Tipografía — familias Montserrat y Open Sans self-hosted

El `globals.css` SHALL declarar las familias tipográficas:

| Token CSS | Familia |
|---|---|
| `--font-heading` | `"Montserrat", sans-serif` |
| `--font-body` | `"Open Sans", sans-serif` |

Las fuentes SHALL cargarse self-hosted vía `@fontsource/montserrat` y `@fontsource/open-sans` importados desde `globals.css` con `@import '@fontsource/montserrat/600.css'` (idem 700, 800) y `@import '@fontsource/open-sans/400.css'` (idem 600, 700, 400-italic). Queda prohibido el uso de CDN externo (`cdn.jsdelivr.net` o similar) para fuentes.

#### Scenario: Fuentes declaradas en @theme
- **WHEN** se parsea el `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene `--font-heading: "Montserrat", sans-serif` y `--font-body: "Open Sans", sans-serif`

#### Scenario: Fuentes importadas via @fontsource
- **WHEN** se inspecciona el top de `apps/web/src/styles/globals.css`
- **THEN** existen imports `@fontsource/montserrat` (pesos 600, 700, 800) y `@fontsource/open-sans` (pesos 400, 600, 700, 400-italic)
- **AND** no existen referencias a CDN externo (`cdn.jsdelivr.net`, `fonts.googleapis.com`, etc.)

#### Scenario: Utilidad font-heading consumible
- **WHEN** un componente aplica `font-heading`
- **THEN** la fuente tipográfica computada resuelve a `'Montserrat', sans-serif` con `font-weight: 700`

### Requirement: Radio y sombras — flat design

El `globals.css` SHALL declarar:

| Token CSS | Valor |
|---|---|
| `--radius` | `2px` |
| `--shadow-1` | `0 1px 2px rgba(22,32,46,.06)` |
| `--shadow-2` | `0 2px 6px rgba(22,32,46,.08)` |
| `--shadow-3` | `0 4px 12px rgba(22,32,46,.10)` |
| `--shadow-4` | `0 8px 20px rgba(22,32,46,.12)` |
| `--shadow-5` | `0 12px 28px rgba(22,32,46,.14)` |

El sistema sigue el principio **flat design**: las superficies se separan por defecto con borders 1px y color sólido. Las sombras (`shadow-1..5`) se reservan exclusivamente para capas flotantes (dropdowns, menús, modales, overlays). Los componentes base (Header, TopHeader, HeroBanner, PanelHome, SearchForm) NO aplican shadows en su estado estático.

#### Scenario: Radius declarado
- **WHEN** se parsea `apps/web/src/styles/globals.css`
- **THEN** contiene `--radius: 2px`
- **AND** la utilidad `rounded` resuelve a `border-radius: var(--radius)` (2px)

#### Scenario: 5 niveles de shadow declarados
- **WHEN** se parsea el bloque `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene las 5 declaraciones `--shadow-1` hasta `--shadow-5` con los valores exactos de la tabla

#### Scenario: Componentes base no usan sombra
- **WHEN** se renderiza cualquier componente base (`TopHeader.astro`, `Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`) en su estado estático
- **THEN** ninguno aplica una utilidad `shadow-*` en su JSX

### Requirement: Prohibición de literales hex y tokens obsoletos

Ningún archivo `.astro`, `.ts`, `.json` de `apps/web/src/` y `apps/admin/src/` SHALL contener:

- Literales hex (`#XXXXXX`) en atributos `class`, `style`, o strings de configuración (excepto tests, snapshots de referencia, y el propio `globals.css` source).
- Referencias a los tokens obsoletos `--color-brand-navy`, `--color-brand-navy-light`, `--color-brand-orange`, `--color-brand-teal`.
- Utilities Tailwind obsoletas `bg-brand-navy`, `bg-brand-navy-light`, `bg-brand-orange`, `bg-brand-teal`, `text-brand-teal`, `from-brand-navy`, `to-brand-navy-light`, `via-brand-navy-light`, `border-brand-*`.

#### Scenario: Cero literales hex en componentes web
- **WHEN** se ejecuta un grep recursivo en `apps/web/src/components/` y `apps/web/src/pages/` con el regex `#[0-9A-Fa-f]{6}` excluyendo archivos `.snap` y de test
- **THEN** el resultado SHALL estar vacío (cero coincidencias)

#### Scenario: Cero referencias a tokens obsoletos
- **WHEN** se ejecuta un grep recursivo en `apps/web/src/` buscando `(bg|text|from|to|via|border)-brand-(navy|navy-light|orange|teal)`
- **THEN** el resultado SHALL estar vacío

#### Scenario: globals.css no declara tokens obsoletos
- **WHEN** se parsea `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css`
- **THEN** ninguno de los dos contiene declaraciones `--color-brand-*`

### Requirement: Sincronización programática web ↔ admin

Existe un test que compara los bloques `@theme {}` de `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css` y SHALL validar que los tokens declarados son idénticos en nombre y valor. Si una app añade o modifica un token, este test SHALL romper hasta que la otra app se sincronice.

#### Scenario: Test de sincronización pasa
- **WHEN** se ejecuta el test de sincronización de tokens (en `apps/web/src/styles/__tests__/sync.test.ts` o equivalente)
- **THEN** lee ambos `globals.css`
- **AND** parsea las entradas `@theme {}`
- **AND** reporta que ambos archivos declaran exactamente el mismo conjunto de pares (nombre → valor)
- **AND** el test pasa

#### Scenario: Test rompe si admin se desincroniza
- **WHEN** se elimina un token (p.ej. `--color-primary-dark`) de solo `apps/admin/src/styles/globals.css`
- **THEN** el test de sincronización SHALL fallar con un mensaje que mencione el token faltante y la app donde falta

### Requirement: Catálogo de iconos Material Symbols Outline

El catálogo de iconos usados en el sistema SHALL estar documentado en `docs/design/style-guide/README.md` con el formato `<nombre-de-referencia>` → `<icono-material-symbols>`. El set único autorizado para UI funcional es `material-symbols` (variant `outline`); los iconos de marca/redes sociales usan el set `logos` (Iconify Logos) porque Material Symbols no incluye glifos de marcas (verificado: `facebook-outline` no existe en `@iconify-json/material-symbols`).

Los iconos mínimos del catálogo SHALL incluir: `phone`, `facebook`, `x`, `instagram`, `linkedin`, `menu`, `close`, `search`, `calendar`, `check`, `warning`, `info`, `error`, `arrow-right`, `copy`, `filters`, `trash`, `more`, `clock`, `star`, `bookmark`.

#### Scenario: Catálogo documentado con nombre Material Symbols
- **WHEN** se lee `docs/design/style-guide/README.md`
- **THEN** contiene una tabla o lista con cada icono de referencia mapeado a su nombre completo de icono (`material-symbols:<name>` para UI, `logos:<name>` para marcas/redes sociales)
- **AND** la tabla incluye al menos los 21 iconos mínimos listados arriba

#### Scenario: Único set de iconos en apps/web
- **WHEN** se ejecuta un grep en `apps/web/src/` buscando referencias `<Icon name="`
- **THEN** las referencias de UI usan el prefijo `material-symbols:` como nombre de set
- **AND** las únicas referencias no-`material-symbols` permitidas son `logos:*` para iconos de marca/redes sociales (facebook, x, instagram, linkedin)
- **AND** no existen otras familias de iconos (`mdi:`, `lucide:`, `heroicons:`, etc.) referenciadas

### Requirement: Documentación canónica de tokens

`docs/design/style-guide/README.md` SHALL contener la tabla canónica completa de tokens (colores marca + neutros + estado + tipografías + radio + shadows) con su nombre CSS, valor, utilidad Tailwind equivalente y rol semántico. Esta tabla es la fuente de verdad operativa para desarrolladores (la guía visual HTML sigue siendo el insumo de diseño).

#### Scenario: README de la guía contiene tabla canónica
- **WHEN** se lee `docs/design/style-guide/README.md`
- **THEN** contiene las secciones "Colores de marca", "Neutros", "Estado", "Tipografía", "Radio y sombras"
- **AND** cada sección lista los tokens con sus valores y utilities Tailwind

#### Scenario: frontend-standards referencia el README de la guía
- **WHEN** se lee `docs/frontend-standards.md`
- **THEN** contiene una sección "Design Tokens" que apunta a `docs/design/style-guide/README.md`
- **AND** deja constancia de la convención (two `globals.css` sincronizados manualmente, sin `packages/` por ahora)
