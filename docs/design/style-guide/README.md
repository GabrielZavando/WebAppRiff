# Design Tokens & Icon Catalog

This file documents the canonical design tokens and icon catalog for the Riff Catálogo Digital Headless project. Source of truth: `docs/design/style-guide/index.html`.

---

## Design Tokens

### Marca (13 tokens)

| Token CSS | HEX | Tailwind Utility | Semantic Role |
|---|---|---|---|
| `--color-primary` | `#41B3C4` | `bg-primary`, `text-primary`, `border-primary` | Primario · Teal |
| `--color-primary-dark` | `#2E9AAD` | `-dark` | Primario oscuro |
| `--color-primary-darker` | `#227E8E` | `-darker` | Primario muy oscuro |
| `--color-primary-deep` | `#006874` | `-deep` | Teal profundo · fondo de secciones destacadas |
| `--color-primary-light` | `#D2EEF2` | `-light` | Primario claro |
| `--color-primary-100` | `#EAF7F9` | `-100` | Primario 100% |
| `--color-secondary` | `#1F2D40` | `bg-secondary`, `text-secondary`, `from-secondary` | Base · Navy |
| `--color-secondary-dark` | `#16202E` | `-dark` | Navy oscuro |
| `--color-secondary-light` | `#35455E` | `-light` | Navy claro |
| `--color-accent` | `#F26A21` | `bg-accent`, `text-accent` | Acento · Naranja |
| `--color-accent-dark` | `#D14E12` | `-dark` | Naranja oscuro |
| `--color-accent-darker` | `#B03E0E` | `-darker` | Naranja muy oscuro |
| `--color-accent-light` | `#FDE8DC` | `-light` | Naranja claro |

### Neutros (6 tokens)

| Token CSS | HEX | Tailwind Utility | Semantic Role |
|---|---|---|---|
| `--color-text` | `#1F2D40` | `text-text` | Texto base |
| `--color-text-2` | `#5C6675` | `text-text-2` | Texto secundario |
| `--color-muted` | `#98A1AC` | `text-muted` | Texto terciario / placeholder |
| `--color-border` | `#E3E8ED` | `border-border` | Borde base 1px |
| `--color-bg` | `#F6F8FA` | `bg-bg` | Fondo de sección / página |
| `--color-white` | `#FFFFFF` | `bg-white`, `text-white` | Superficie sobre fondo |

### Estado (12 tokens: 4 estados × 3 tonos)

| Estado | Base | Dark | Light |
|---|---|---|---|
| Success | `#25D366` (`bg-success`) | `#149A49` (`-dark`) | `#E4F8EC` (`-light`) |
| Warning | `#F5B01E` (`bg-warning`) | `#9A6E08` (`-dark`) | `#FEF4DC` (`-light`) |
| Error | `#E0453A` (`bg-error`) | `#B93127` (`-dark`) | `#FCE9E7` (`-light`) |
| Info | `#2D9CDB` (`bg-info`) | `#1B74A6` (`-dark`) | `#E7F3FB` (`-light`) |

### Tipografía

| Token CSS | Familia | Pesos cargados (via `@fontsource`) |
|---|---|---|
| `--font-heading` | `"Montserrat", sans-serif` | 600, 700, 800 |
| `--font-body` | `"Open Sans", sans-serif` | 400, 600, 700, 400-italic |

### Radio y Sombras

| Token CSS | Valor | Uso |
|---|---|---|
| `--radius` | `0` | Radio global; flat design estricto, ángulos rectos (sin esquinas redondeadas) |
| `--shadow-1` | `0 1px 2px rgba(22,32,46,.06)` | Capas flotantes nivel 1 |
| `--shadow-2` | `0 2px 6px rgba(22,32,46,.08)` | Dropdowns, menús |
| `--shadow-3` | `0 4px 12px rgba(22,32,46,.10)` | Modales |
| `--shadow-4` | `0 8px 20px rgba(22,32,46,.12)` | Overlays fijos |
| `--shadow-5` | `0 12px 28px rgba(22,32,46,.14)` | Overlays fijos nivel máximo |

> **Flat design principle (radio 0):** Estética flat estricta con ángulos rectos: `--radius: 0` y **prohibido** usar la utility `rounded*` (ninguna variante) en componentes, páginas o configs. Las superficies se separan por defecto con bordes 1px y color sólido. Las sombras se reservan exclusivamente para capas flotantes (dropdowns, menús, modales, overlays). Los componentes base (Header, TopHeader, HeroBanner, PanelHome, SearchForm) NO aplican `shadow*` en su estado estático.

---

## Catálogo de Iconos

Set único autorizado: **Lucide** (`lucide:*`). Aplica tanto a iconos de UI funcionales como a iconos de marca/redes sociales (uniformados al set Lucide). Los sets `material-symbols`, `logos` y `simple-icons` quedan **obsoletos** (prohibidos en código nuevo), **excepto** `simple-icons:x` que es la única excepción documentada — utilizada para el logo de marca oficial de X, ya que Lucide no provee el logo actual de X (el `lucide:x` existente es el icono de cerrar, no la marca).

### Mapeo de los 5 componentes base

| Referencia | Icono (Iconify name) | Uso |
|---|---|---|
| `phone` | `lucide:phone` | Teléfono en TopHeader |
| `facebook` | `lucide:facebook` | Red social Facebook |
| `x` | `simple-icons:x` | Red social X (logo oficial) — excepción al set único Lucide |
| `instagram` | `lucide:instagram` | Red social Instagram |
| `linkedin` | `lucide:linkedin` | Red social LinkedIn |
| `menu` | `lucide:menu` | Hamburguesa menú móvil |
| `close` | `lucide:x` | Cerrar menú móvil |

### Catálogo completo (21 iconos mínimos)

| Referencia | Icono (Iconify name) | Uso |
|---|---|---|
| `search` | `lucide:search` | Búsqueda |
| `calendar` | `lucide:calendar` | Calendario / fecha |
| `check` | `lucide:check` | Check / éxito |
| `warning` | `lucide:triangle-alert` | Advertencia |
| `info` | `lucide:info` | Información |
| `error` | `lucide:circle-alert` | Error |
| `arrow-right` | `lucide:arrow-right` | Flecha derecha / siguiente |
| `copy` | `lucide:copy` | Copiar al portapapeles |
| `filters` | `lucide:list-filter` | Filtros |
| `trash` | `lucide:trash` | Eliminar |
| `more` | `lucide:ellipsis-vertical` | Menú más opciones |
| `clock` | `lucide:clock` | Reloj / tiempo |
| `star` | `lucide:star` | Estrella / favorito |
| `bookmark` | `lucide:bookmark` | Marcador |

> **Nota:** Único set base: `lucide`. Los alias antiguos de Lucide (`alert-triangle`, `alert-circle`, `more-vertical`, `x-circle`) siguen resolviéndose en `@iconify-json/lucide`, pero se documentan los nombres canónicos actuales (`triangle-alert`, `circle-alert`, `ellipsis-vertical`, `x`).

---

## Sincronización

- `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css` **DEBEN** declarar el mismo `@theme {}` (mismos nombres y valores).
- Test de sincronización: `apps/admin/src/styles/__tests__/sync.test.ts` valida que ambos archivos son idénticos token a token.
- Cambiar tokens en una app sin actualizar la otra romperá el test de sincronización.

---

## Referencias

- Spec: `openspec/changes/design-system-revision/specs/design-tokens/spec.md`
- Guía visual: `docs/design/style-guide/index.html`
- Tasks: `openspec/changes/design-system-revision/tasks.md`