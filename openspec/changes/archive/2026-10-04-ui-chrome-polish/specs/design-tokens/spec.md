# design-tokens Specification

## MODIFIED Requirements

### Requirement: Marca — paleta de 12 colores
El `globals.css` SHALL declarar en el bloque `@theme {}` los **14 tokens de color de marca** (12 extraídos de la guía visual + 2 de marca WhatsApp), con nombres y valores exactos:

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
| `--color-whatsapp` | `#25D366` | `bg-whatsapp` / `text-whatsapp` / `border-whatsapp` |
| `--color-whatsapp-dark` | `#1EBE5D` | `-dark` |

El componente/consumidor SHALL usar exclusivamente las utilities Tailwind generadas desde estos tokens; nunca literales hex. (MODIFIED in `ui-chrome-polish` — se añaden los 2 tokens de marca WhatsApp para el botón flotante `WhatsAppButton.astro`.)

#### Scenario: Tokens de marca presentes en globals.css de apps/web
- **WHEN** se inspecciona `apps/web/src/styles/globals.css`
- **THEN** el bloque `@theme {}` contiene las 14 declaraciones listadas arriba (`--color-primary: #41B3C4` hasta `--color-whatsapp-dark: #1EBE5D`)
- **AND** ninguna de las declaraciones usa el prefijo obsoleto `--color-brand-*`

#### Scenario: Tokens de marca presentes en globals.css de apps/admin
- **WHEN** se inspecciona `apps/admin/src/styles/globals.css`
- **THEN** el bloque `@theme {}` contiene las mismas 14 declaraciones con los mismos valores que `apps/web`
- **AND** la comparación programática entre los dos `@theme` SHALL reportar cero diferencias

#### Scenario: Utilities Tailwind de marca consumibles en .astro
- **WHEN** un componente `.astro` aplica la clase `bg-primary`
- **THEN** el CSS generado por Tailwind v4 resuelve a `background-color: var(--color-primary)` (i.e. `#41B3C4`)

### Requirement: Catálogo de iconos Lucide
El catálogo de iconos usados en el sistema SHALL estar documentado en `docs/design/style-guide/README.md` con el formato `<nombre-de-referencia>` → `<icono>`. El set único autorizado para UI funcional Y para iconos de marca/redes sociales es `lucide` (Iconify Lucide) — outline stroke 2px — con **dos excepciones documentadas** vía `simple-icons`: `simple-icons:x` (logo oficial de X; Lucide no provee el logo actual — pre-existente) y `simple-icons:whatsapp` (logo de marca de WhatsApp para el botón flotante `WhatsAppButton.astro`; Lucide no provee icono de marca WhatsApp — añadida en `ui-chrome-polish`). NO se usan los sets `material-symbols`, `logos`, `mdi`, `heroicons` ni ningún otro en `apps/web/src/`.

Los iconos mínimos del catálogo SHALL incluir: `phone`, `facebook`, `x` (twitter), `whatsapp`, `instagram`, `linkedin`, `menu`, `close`, `search`, `calendar`, `check`, `warning`, `info`, `error`, `arrow-right`, `copy`, `filters`, `trash`, `more`, `clock`, `star`, `bookmark`.

Un mapeo de referencia SHALL figurar en el README con las equivalencias usadas por los 5 componentes: `phone` → `lucide:phone`, `menu` → `lucide:menu`, `close` → `lucide:x`, `facebook` → `lucide:facebook`, `x` → `lucide:twitter`, `instagram` → `lucide:instagram`, `linkedin` → `lucide:linkedin`. Las excepciones `simple-icons:x` y `simple-icons:whatsapp` se documentan como tales en el catálogo (no forman parte del mapeo de los 5 componentes base). (MODIFIED in `ui-chrome-polish`.)

#### Scenario: Catálogo documentado con nombre Lucide
- **WHEN** se lee `docs/design/style-guide/README.md`
- **THEN** contiene una tabla o lista con cada icono de referencia mapeado a su nombre completo de icono (`lucide:<name>`)
- **AND** la tabla incluye al menos los 22 iconos mínimos listados arriba (incl. `whatsapp` → `simple-icons:whatsapp`)
- **AND** NO menciona `material-symbols:*` ni `logos:*` como sets autorizados (esos sets quedan obsoletos)

#### Scenario: Único set de iconos en apps/web es Lucide (con excepciones simple-icons)
- **WHEN** se ejecuta un grep en `apps/web/src/` buscando referencias `<Icon name="`
- **THEN** todas las referencias usan el prefijo `lucide:` como nombre de set, salvo las dos excepciones documentadas `simple-icons:x` y `simple-icons:whatsapp`
- **AND** no existen referencias a `material-symbols:`, `logos:`, `mdi:`, `heroicons:` ni otras familias de iconos

#### Scenario: package.json declara @iconify-json/lucide y NO los sets obsoletos
- **WHEN** se lee `apps/web/package.json`
- **THEN** declara `@iconify-json/lucide` en `dependencies` o `devDependencies`
- **AND** NO declara `@iconify-json/material-symbols`
- **AND** NO declara `@iconify-json/logos`