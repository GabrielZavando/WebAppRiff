## Context

`/representaciones` nació con wordmarks tipográficos porque los logos reales no estaban disponibles; hoy los siete binarios ya viven en `apps/web/src/assets/img/representaciones/` y el contrato de tipos anticipó su reemplazo con el hook `data-brand-logo`. La página compone cuatro bloques (hero, marcas, distribuidores, propuesta de valor) con contenedores propios `max-w-[1280px] px-6`, mientras `Header.astro` usa el utility `.container` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`), lo que produce un desfase de 8 px por lado en `lg+`.

El sitio usa hoy una mezcla de blanco puro (sin clase en `Layout`), `bg-bg` (`#F6F8FA`) y `bg-surface-muted` (`#E9EEF3`, ya declarado en `design-tokens`). El pedido es que la superficie base de página sea `bg-surface-muted` para que las tarjetas blancas resalten; `bg-bg` debe quedar como mat/control anidado.

Restricciones del proyecto: Astro SSG (`output: 'static'`), Tailwind v4 vía `@theme`, diseño plano (radio 0), tokens canónicos sin hex literales, componentes presentacionales alimentados por config tipado, y tests con `AstroContainer`.

## Goals / Non-Goals

**Goals:**

- Reemplazar los wordmarks por los logos reales optimizados con `astro:assets` en las cinco tarjetas de marca y en las dos tarjetas de distribuidores.
- Alinear todos los contenedores de `/representaciones` con el `.container` del `Header`, incluido el hero.
- Fijar `bg-surface-muted` como fondo base del sitio y migrar las superficies de página que usaban `bg-bg`.
- Mantener las tarjetas, paneles y formularios de contenido en `bg-white`.
- Cubrir logo, alineación y fondos con tests de componentes/página y validación estricta de OpenSpec.

**Non-Goals:**

- No se rediseñan las tarjetas, la tipografía, las grillas ni el copy de `/representaciones`.
- No se toca el backend, las APIs, Firestore, ni el pipeline de deploy.
- No se modifican los fondos intencionales oscuros (`bg-secondary`, `bg-primary-deep`, `bg-secondary-dark`) ni las tarjetas blancas.
- No se agregan ni reemplazan binarios de imagen: se usan exactamente los siete ya presentes.
- No se persigue una auditoría visual pixel-perfect de todas las páginas: la verificación es por clases/tokens y tests de render.

## Decisions

### D1 — Los logos viven en el config tipado como `ImageMetadata`

`lib/types/representaciones-page.ts` reemplaza `WordmarkSegment`/`wordmark` por `logo: ImageMetadata` en `RepresentacionBrand` y `Distribuidor`. `lib/config/representaciones-page.ts` importa cada archivo desde `@/assets/img/representaciones/` y lo asigna a su marca:

| Marca | Archivo |
| --- | --- |
| Apator Powogaz | `apator-logo.png` |
| RIFF Flow Metering | `Riff-meters.png` |
| Nitto Seiko | `nittoseiko-logo.jpg` |
| GL Sanitaria | `GL-Flow.webp` |
| ILMAP | `Ilmap-logo.webp` |
| PIUSI | `piusi-logo.png` |
| SENSUS | `sensus-logo.webp` |

Se elimina el campo `note`/`wordmark` de la tarjeta de marca (el `note` era parte del placeholder tipográfico; el `chip` y `sublabel` se conservan). El `alt` se deriva de `title` en las tarjetas de marca y de `wordmark`/`title` en distribuidores, evitando duplicar un campo de texto.

**Alternativas consideradas:** mantener `wordmark` como fallback si la imagen falla. Se descarta: agrega complejidad y el pipeline de Astro garantiza el asset en build; el texto redundante volvería a competir visualmente con el logo.

### D2 — `<Image>` con contenedor `data-brand-logo` y tamaños acotados

`RepresentacionBrandCard.astro` reemplaza el bloque de segmentos de texto por `<Image src={logo} alt={title} widths={[128, 256]} sizes="(max-width: 768px) 50vw, 256px" loading="lazy" class="h-auto w-full max-w-[192px] object-contain" />` dentro del panel `data-brand-logo`. `DistribuidorCard.astro` hace lo equivalente con `widths={[128, 256]}` y `class="h-auto w-full max-w-[180px] object-contain"`. Astro genera salidas WebP optimizadas para los assets locales por defecto.

El panel de la tarjeta de marca conserva `md:w-64`, `bg-bg` y su estructura; solo cambia el contenido interno. Así el reemplazo no re-maqueta la tarjeta (requisito histórico) y los tests pueden seguir verificando `flex-col md:flex-row` y `data-brand-logo`.

**Alternativas consideradas:** usar `<img src={logo.src}>` sin optimización. Se descarta porque incumple el pedido explícito de `astro:assets`/WebP y pierde el control de `widths`/`sizes`.

### D3 — `.container` como única fuente de alineación horizontal

Se sustituyen todos los `mx-auto max-w-[1280px] px-6` de `/representaciones` por `container`:

- `RepresentacionesHero.astro`: contenedor interno del hero.
- `representaciones.astro`: secciones de marcas, distribuidores y propuesta de valor.

No se define un contenedor nuevo ni se duplica el padding. El `Header` ya usa `.container`, por lo que ambos comparten `max-w-7xl` y los mismos breakpoints de padding. Los anchos internos de las grillas/tarjetas se mantienen.

**Alternativas consideradas:** cambiar el `Header` a `max-w-[1280px] px-6`. Se descarta porque `.container` es el patrón canónico del sitio y lo usan `Footer`, `SearchForm` y la mayoría de las secciones; además el pedido es alinear el contenido al Header, no al revés.

### D4 — `bg-surface-muted` en el body y en las superficies de página

`Layout.astro` agrega `bg-surface-muted` a las clases del `<body>` (`class:list`). Eso cubre páginas sin fondo propio (`/productos`) y los márgenes visibles alrededor de las secciones. Luego se migran las superficies de página que usaban `bg-bg`:

- `SolutionSection.astro` (home)
- `NosotrosTeamSection.astro` (home)
- `ServiciosPortafolioSection.astro` (`/servicios`, Sección 1)
- `IndustrialApplications.astro` (`/productos/[slug]`)
- `cotizacion.astro` (`<main>`)
- `productos/[slug].astro` (secciones de hero de producto y descripción)
- `representaciones.astro` (secciones de marcas y propuesta de valor)

No se toca `ServicesSection` (`bg-primary-deep`), `DestacadosSection` (`bg-secondary-dark`), `ServiciosTerrenoSection` (`bg-primary-100`), `Nosotros` (ya `bg-surface-muted`), `contacto` (`bg-primary-deep`) ni las tarjetas/paneles `bg-white`. Los `bg-bg` anidados (mats de `ProductCard`, badges de `DistribuidorCard`, inputs de formularios, chips de `ServicioTerrenoCard`, etc.) se conservan.

**Alternativas consideradas:** poner `bg-surface-muted` en cada página en vez del `body`. Se descarta porque duplica la regla y deja huecos en páginas nuevas; el `body` es la fuente única del fondo base.

### D5 — Tests primero y verificación por clases/atributos

Los tests existentes se ajustan en TDD:

- `RepresentacionBrandCard.test.ts` y `DistribuidorCard.test.ts`: esperan `<img>` con `alt` correcto dentro de `data-brand-logo`, ausencia de wordmark de texto y conservación de layout plano.
- `representaciones.test.ts`: espera siete `<img>` de logo (5 marcas + 2 distribuidores), contenedores `.container`, ausencia de `max-w-[1280px]`, y `bg-surface-muted` en las secciones correspondientes.
- `representaciones-page.test.ts` (config): valida que `logo` es un asset (`src` no vacío) para cada marca y distribuidor.
- `NosotrosTeamSection.test.ts`, `IndustrialApplications.test.ts` y tests de `ServiciosPortafolioSection`/`SolutionSection`: esperan `bg-surface-muted` en la superficie de sección.
- Se agrega una verificación de que `Layout.astro` declara `bg-surface-muted`.

La validación final es `npx openspec validate --all --strict` más `make ci` durante la implementación.

## Risks / Trade-offs

- **[Los tests actuales esperan textos de wordmark y `bg-bg`]** → Se actualizan junto con los componentes en el mismo cambio TDD; los tests de layout (`data-brand-logo`, `flex-col md:flex-row`) se conservan para evitar regresiones.
- **[Logos con relaciones de aspecto y transparencias distintas]** → Se usa `object-contain`, `h-auto` y un `max-w` acotado por tarjeta, sin fijar altura, para que ningún logo se deforme ni desborde el panel.
- **[Contraste insuficiente en alguna página clara]** → `bg-surface-muted` (#E9EEF3) frente a `bg-white` da un contraste suave pero perceptible; las tarjetas conservan `border-border`, por lo que el límite no depende solo del color.
- **[Cambio transversal de fondos con riesgo de tocar `bg-bg` anidados]** → El inventario de D4 separa explícitamente superficies de página de mats/controles; los tests verifican solo las secciones, no los mats internos.
- **[Alineación rota en el hero si solo se corrige la sección de marcas]** → D3 incluye el hero y las tres secciones para que todos los bordes coincidan con el Header.

## Migration Plan

1. Ajustar tests (fallidos) de logos, alineación y fondos.
2. Actualizar tipos/config de `/representaciones` e importar los siete logos.
3. Actualizar componentes de tarjetas y el hero; migrar contenedores a `.container`.
4. Aplicar `bg-surface-muted` en `Layout` y en las superficies de página listadas en D4.
5. Ejecutar `make lint`, `make test`, `make typecheck` y `npx openspec validate --all --strict`.
6. Desplegar el build estático habitual; no hay migración de datos. Rollback: revertir el commit (los binarios de logo ya existen y no se eliminan).

## Open Questions

Ninguna bloqueante. Supuestos registrados:

- El reemplazo de logos incluye también las tarjetas de distribuidores PIUSI/SENSUS porque sus binarios están en la misma carpeta y son marcas del mismo catálogo.
- La alineación con el Header se aplica también al hero (no solo a la grilla de marcas) para que el borde izquierdo/derecho sea uniforme en toda la página.
- El panel blanco de `PanelHome` es un elemento de contenido y conserva `bg-white`; no se considera fondo base de página.
