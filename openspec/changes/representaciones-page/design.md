## Context

El sitio público Astro (`apps/web`) usa un único layout (`src/layouts/Layout.astro`) que compone todo el chrome (TopHeader, Header + SearchForm sticky, Footer, SiteCredits, WhatsApp flotante y `ClientRouter`/View Transitions). Hoy `/marcas` es un placeholder "en construcción" (`src/pages/marcas.astro`) que ya se envuelve en ese `Layout`.

El cliente entregó el diseño definitivo de la página en `docs/design/components/representaciones/reference.html` y `reference.png`. Es un export de Stitch (`shell-type: web_blank`) que contiene **solo el contenido central** en cuatro secciones: hero editorial, marcas de representación exclusiva (5), distribuidores autorizados (2) y propuesta de valor (4 pillars).

Tres restricciones del proyecto condicionan la implementación:

1. **Design system estricto** (`docs/frontend-standards.md`): Tailwind v4 con tokens en `@theme` (`apps/web/src/styles/globals.css`); solo utilities derivadas de tokens; prohibido hex literal y clases `brand-*`; flat design (radio 0, sin sombras).
2. **Iconos**: exclusivamente `astro-icon` + Lucide (`<Icon name="lucide:..." />`); prohibido SVG de iconos inline/local.
3. **Imágenes**: optimizables en `src/assets/img/` vía `astro:assets`; pero los logos reales de las empresas **no fueron entregados**.

El diseño de referencia usa una paleta Material de Stitch (teal `#006874`, naranja `#a04100`, superficies `#f8f9ff`) y clases tipográficas inexistentes en el proyecto (`font-display-lg`, `font-headline-lg`, `font-label-bold`), por lo que el HTML de referencia NO puede copiarse tal cual.

## Goals / Non-Goals

**Goals:**

- Entregar `/representaciones` como página final, fiel a la estructura y el contenido del diseño de referencia.
- Reutilizar `Layout.astro` (chrome completo: Header, Footer, WhatsApp, SiteCredits, View Transitions) sin crear un layout alternativo.
- Remapear colores y tipografía Material a los design tokens de Riff.
- Usar `astro-icon` + Lucide, con un mapping explícito desde los Material Symbols del diseño.
- Representar los logos ausentes con wordmarks tipográficos reemplazables por `<Image>` en el futuro.
- Renombrar el ítem del menú `Marcas` → `Representaciones`.
- Contenido centralizado y tipado; componentes presentacionales; responsive mobile-first.
- Todo bajo TDD (test de composición + tests de config + actualización de tests existentes).

**Non-Goals:**

- No se agregan los logos reales ni binarios de imagen nuevos.
- No se implementan redirects ni SEO para `/marcas`.
- No se crea `StandaloneLayout.astro` ni se extrae `BaseHead.astro`.
- No se modifica el comportamiento del chrome global ni el layout existente.
- No se crea backend/CMS: el contenido queda hardcodeado en config (patrón del sitio SSG).

## Decisions

### D1 — Reutilizar `Layout.astro` en lugar de un layout standalone

El requisito "sin header ni footer" se refería a que el mockup de Stitch solo muestra el contenido central; la página final SÍ debe tener el chrome completo. Se descarta crear `StandaloneLayout.astro` o condicionar `Layout.astro` con una prop `chrome`. Alternativa considerada: layout `BlankLayout.astro` + `BaseHead.astro`; se descarta por decisión explícita del cliente y por menor superficie de cambio/regresión.

### D2 — `showSearch={false}`

La página se compone como `marcas.astro`/`contacto.astro`: `<Layout title="Representaciones — Riff" showSearch={false}>`. El diseño de referencia no incluye barra de búsqueda y el placement de 5 tarjetas de marca no se beneficia de ella. **Supuesto a confirmar por el cliente** (ver Open Questions).

### D3 — Contenido en config tipado + componentes presentacionales

Se sigue el patrón del sitio: `lib/config/<página>.ts` + `lib/types/<página>.ts` + componentes "dumb". Fuente de los textos: `reference.html`. Tipos exportados, sin `any` (evita lógica de negocio en el frontmatter, `frontend-standards.md` § SRP a nivel de componente `.astro`).

### D4 — Descomposición en componentes

| Archivo (tentativo) | Responsabilidad |
| --- | --- |
| `pages/representaciones.astro` | Composición de las 4 secciones dentro de `Layout` |
| `components/RepresentacionesHero.astro` | Hero editorial oscuro + 3 métricas |
| `components/RepresentacionBrandCard.astro` | Tarjeta de marca (wordmark + categoría + descripción); se mapea 5× |
| `components/DistribuidorCard.astro` | Tarjeta PIUSI/SENSUS (wordmark + ícono + bullets + garantía); se mapea 2× |
| `components/ValuePropCard.astro` | Pillar (ícono + índice + título + descripción); se mapea 4× |
| `lib/config/representaciones-page.ts` | Contenido de las 4 secciones |
| `lib/types/representaciones-page.ts` | Contratos de props/content |

Se evita un componente por sección completa cuando la tarjeta es la unidad reutilizable; el hero sí es un componente propio. Alternativa descartada: un único `RepresentacionesPage.astro` monolítico (viola SRP y el límite de tamaño).

### D5 — Remapeo de tokens (Material/Stitch → Riff)

| Diseño referencia | Token Riff |
| --- | --- |
| Navy hero (`inverse-surface` `#233242`) | `bg-secondary` (`#1F2D40`) |
| Teal `primary` `#006874` / `primary-fixed-dim` | `text-primary` / `bg-primary` (`#41B3C4`) |
| Naranja `secondary-container` `#fc7728` | `bg-accent` / `text-accent` (`#F26A21`) |
| Superficie página `surface` `#f8f9ff` | `bg-bg` (`#F6F8FA`) |
| Superficie sección `surface-container-low` | `bg-primary-100` |
| Tarjetas `surface-container-lowest` | `bg-white` + `border border-border` |
| Texto `on-surface` / `on-surface-variant` | `text-text` / `text-text-2` |
| `tertiary` `#4f5e81` (pillar 04) | `text-secondary` (no hay token tertiary) |
| `font-display-*` / `headline-*` / `label-bold` | `font-heading` + escala Tailwind (`text-5xl`/`text-2xl`/`text-xs`…) |
| `font-body-*` | `font-body` + escala |

### D6 — Iconos: Material Symbols → Lucide (astro-icon)

| Material Symbol | Lucide |
| --- | --- |
| `engineering` | `lucide:wrench` |
| `assignment_turned_in` | `lucide:clipboard-check` |
| `inventory_2` | `lucide:package` |
| `security` | `lucide:shield-check` |
| `local_gas_station` | `lucide:fuel` |
| `sensors` | `lucide:radio-tower` |
| `check` | `lucide:check` |

Verificado que los nombres existen en `@iconify-json/lucide`. Los íconos decorativos llevan `aria-hidden`.

### D7 — Wordmarks tipográficos reemplazables

Cada marca se renderiza como texto estilizado (`font-heading`, tokens de color) dentro de un contenedor con `data-brand-logo` (hook estable). Cuando el cliente entregue los logos, se sustituye el contenido interno por `<Image>` sin tocar la estructura de la tarjeta. Alternativas descartadas: caja/imagen SVG genérica (rompe la estética) y binarios placeholder (contradice `image-assets`/no aporta).

### D8 — Fondo de grilla del hero en CSS con tokens

El diseño usa un patrón de grilla SVG inline. Para respetar "sin SVG de iconos inline/local" y "solo tokens", el patrón se implementa como fondo CSS decorativo (`aria-hidden`) con `repeating-linear-gradient` sobre `var(--color-primary)` a baja opacidad. Fallback aceptado: fondo plano `bg-secondary` si el patrón compromete legibilidad/tests.

### D9 — Flat design (sin `rounded*` ni `shadow*`)

El diseño usa `shadow-sm`; el sistema Riff es flat (radio 0, sombras reservadas a capas flotantes). Las tarjetas se separan con `bg-white border border-border`. Esto es una desviación consciente y documentada del mockup.

### D10 — Responsive mobile-first

Marcas: `flex-col` → `md:flex-row` (panel de wordmark `md:w-64`). Distribuidores: 1 col → `lg:grid-cols-2`. Pillars: 1 col → `md:grid-cols-2 lg:grid-cols-4`. Métricas del hero: 1 col → `sm:grid-cols-3` (o columna lateral desde `lg`).

### D11 — Estrategia de tests (TDD)

1. Test de composición de página (`pages/__tests__/representaciones.test.ts`): chrome presente, sin `role="search"`, sin hero image, 5 marcas, 2 distribuidores, 4 pillars, íconos Lucide, sin hex/`brand-*`/`rounded`/`shadow`.
2. Tests de config (`lib/config/__tests__/representaciones-page.test.ts`): forma y contenido esperado.
3. Actualizar `navigation.test.ts`, `Header.test.ts` (+ snapshot) y e2e (`site-header.spec.ts`, `search-form.spec.ts`).

### D12 — Eliminar `/marcas` sin redirect

`pages/marcas.astro` se elimina. No hay redirect (proyecto en desarrollo, decisión del cliente). Esto es un BREAKING change de ruta.

### D13 — Renombre del menú

`NAVIGATION_ITEMS` pasa de `{ label: 'Marcas', href: '/marcas' }` a `{ label: 'Representaciones', href: '/representaciones' }`. Un solo cambio cubre desktop y mobile (ambos navs comparten la lista).

## Risks / Trade-offs

- **Enlaces rotos a `/marcas`** → Aceptado (dev, sin redirect). Mitigación futura: agregar redirect si el sitio pasa a producción con enlaces externos.
- **Placeholders que parecen logos finales** → `data-brand-logo` documentado + nota en la config; tarea explícita de sustitución cuando lleguen los logos.
- **Deriva de diseño por quitar sombras (flat)** → Documentado en D9; revisión visual contra `reference.png` antes de archivar.
- **Patrón de grilla con tokens puede no replicar el look exacto** → Fallback a fondo plano (D8).
- **Churn de snapshot de `Header`** → Regenerar con `vitest -u` y revisar el diff del snapshot.
- **e2e desactualizados** → `e2e/site-header.spec.ts` y `e2e/search-form.spec.ts` referencian `/marcas`; se actualizan a `/representaciones`.
- **Conflicto de specs preexistente**: `openspec/specs/image-assets/spec.md` afirma que los iconos se consumen con `material-symbols:*`/`logos:*`, mientras el código actual, `frontend-standards.md` y este change usan Lucide. Se sigue Lucide (instrucción del cliente + standards). No se modifica `image-assets` en este change; se registra como deuda de spec a resolver aparte.

## Migration Plan

1. Crear tipos y config con el contenido (TDD: test de config primero).
2. Crear los componentes de tarjeta/hero y el test de composición.
3. Crear `pages/representaciones.astro`; eliminar `pages/marcas.astro`.
4. Renombrar el ítem en `navigation.ts` y actualizar sus tests/snapshot.
5. Actualizar e2e y correr `make ci` (lint + typecheck + test + validate).
6. Build de verificación (`npm run build`) y revisión visual contra `reference.png`.

**Rollback**: revertir el commit del change (no hay migración de datos ni infra).

## Open Questions

1. **`showSearch`**: se asume `showSearch={false}` (consistente con `/marcas` y `/contacto`). ¿El cliente quiere la barra de búsqueda visible en `/representaciones`?
2. **Redirect `/marcas`**: se asume sin redirect (dev). ¿Se necesitará un 301 cuando el sitio salga a producción?
3. **Logos reales**: sin fecha de entrega; los wordmarks quedan como placeholder.
