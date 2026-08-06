# Design Tokens & Icon Catalog

This file documents the canonical design tokens and icon catalog for the Riff Catálogo Digital Headless project. Source of truth: `docs/design/style-guide/index.html`.

---

## Design Tokens

### Marca (12 tokens)

| Token CSS | HEX | Tailwind Utility | Semantic Role |
|---|---|---|---|
| `--color-primary` | `#41B3C4` | `bg-primary`, `text-primary`, `border-primary` | Primario · Teal |
| `--color-primary-dark` | `#2E9AAD` | `-dark` | Primario oscuro |
| `--color-primary-darker` | `#227E8E` | `-darker` | Primario muy oscuro |
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
| `--radius` | `2px` | Radio global; círculos 50% solo en swatches, radios, toggles |
| `--shadow-1` | `0 1px 2px rgba(22,32,46,.06)` | Capas flotantes nivel 1 |
| `--shadow-2` | `0 2px 6px rgba(22,32,46,.08)` | Dropdowns, menús |
| `--shadow-3` | `0 4px 12px rgba(22,32,46,.10)` | Modales |
| `--shadow-4` | `0 8px 20px rgba(22,32,46,.12)` | Overlays fijos |
| `--shadow-5` | `0 12px 28px rgba(22,32,46,.14)` | Overlays fijos nivel máximo |

> **Flat design principle:** Las superficies se separan por defecto con bordes 1px y color sólido. Las sombras se reservan exclusivamente para capas flotantes (dropdowns, menús, modales, overlays). Los componentes base (Header, TopHeader, HeroBanner, PanelHome, SearchForm) NO aplican shadows en su estado estático.

---

## Catálogo de Iconos

Set base autorizado: **Material Symbols Outline** (`material-symbols:*`) para iconos de UI funcionales. Para iconos de marca/redes sociales se usan sets específicos:

| Referencia | Icono (Iconify name) | Set | Uso |
|---|---|---|---|
| `phone` | `material-symbols:contact-phone-outline` | Material Symbols | Teléfono en TopHeader |
| `facebook` | `logos:facebook` | Logos | Red social Facebook |
| `x` / `twitter` | `logos:twitter` | Logos | Red social X (Twitter) |
| `instagram` | `logos:instagram` | Logos | Red social Instagram |
| `linkedin` | `logos:linkedin` | Logos | Red social LinkedIn |
| `menu` | `material-symbols:menu-outline` | Material Symbols | Hamburguesa menú móvil |
| `close` | `material-symbols:close-outline` | Material Symbols | Cerrar menú móvil |
| `search` | `material-symbols:search` | Material Symbols | Búsqueda |
| `calendar` | `material-symbols:calendar-month-outline` | Material Symbols | Calendario / fecha |
| `check` | `material-symbols:check-outline` | Material Symbols | Check / éxito |
| `warning` | `material-symbols:warning-outline` | Material Symbols | Advertencia |
| `info` | `material-symbols:info-outline` | Material Symbols | Información |
| `error` | `material-symbols:error-outline` | Material Symbols | Error |
| `arrow-right` | `material-symbols:arrow-forward-outline` | Material Symbols | Flecha derecha / siguiente |
| `copy` | `material-symbols:content-copy-outline` | Material Symbols | Copiar al portapapeles |
| `filters` | `material-symbols:filter-list-outline` | Material Symbols | Filtros |
| `trash` | `material-symbols:delete-outline` | Material Symbols | Eliminar |
| `more` | `material-symbols:more-vert-outline` | Material Symbols | Menú más opciones |
| `clock` | `material-symbols:schedule-outline` | Material Symbols | Reloj / tiempo |
| `star` | `material-symbols:star-outline` | Material Symbols | Estrella / favorito |
| `bookmark` | `material-symbols:bookmark-outline` | Material Symbols | Marcador |

> **Nota:** Único set base para UI: `material-symbols` (variant `outline`). Iconos de marca (redes sociales) usan `logos:*`. Los iconos `menu`/`close` del menú móvil también son `material-symbols:*` (las variantes `*-outline` existen como aliases de `menu`/`close` en `@iconify-json/material-symbols`), por lo que no se requiere ningún set auxiliar para UI funcional.

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