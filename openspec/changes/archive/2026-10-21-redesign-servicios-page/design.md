## Context

La página `/servicios` (`apps/web/src/pages/servicios.astro`) se compone hoy de `ServicesHero` sobre el banner de `Layout` y una sección `bg-bg` con cuatro `ServiceCard` alternadas. El cliente entregó un rediseño en `docs/design/components/soluciones/modelo.html` y `modelo.png` con dos secciones editoriales nuevas: un portafolio técnico de soluciones y un bloque de servicios en terreno. El requisito explícito es reemplazar casi todo el contenido, conservando Header, Footer y Hero, y respetando estrictamente los tokens del sistema Riff (flat design, Montserrat/Open Sans, Lucide, sin hex ni `brand-*`).

El proyecto ya usa el patrón "componentes dumb + config tipada hardcodeada" (`representaciones-page.ts`, `services-page.ts`, `nosotros-page.ts`). El sitio es SSG, por lo que el contenido se resuelve en build-time y no hay fetching en runtime.

Restricciones relevantes:

- `docs/frontend-standards.md`: frontmatter sin lógica de negocio, iconos solo Lucide vía `astro-icon`, imágenes solo con `astro:assets` desde `assets/img/`, prohibido `@astrojs/image`, prohibido `rounded*` y sombras en superficies estáticas.
- `docs/design/style-guide/README.md`: catálogo canónico de tokens e iconos; los iconos usados deben estar documentados.
- Tests existentes: `apps/web/src/pages/__tests__/servicios.test.ts`, `apps/web/src/lib/config/__tests__/services-page.test.ts`, `apps/web/src/components/__tests__/ServiceCard.test.ts`, `apps/web/src/components/__tests__/no-brand-classes.test.ts` y `apps/web/src/styles/__tests__/icon-catalog.test.ts`.

## Goals / Non-Goals

**Goals:**

- Reemplazar la lista de `ServiceCard` por las dos secciones del mockup, con copy textual del `modelo.html`.
- Mantener intactos `Layout` (Header, Footer, banner, overlay, scroll behavior) y `ServicesHero`.
- Conservar los cuatro slugs de servicio del home y añadir las cuatro anclas del portafolio.
- Redirigir los cuatro CTAs "SABER MÁS" del home a su ancla exacta del portafolio en `/servicios`.
- Extraer todo el contenido a `services-page.ts` con tipos estrictos, incluida una unión discriminada para el cuerpo variable de la Sección 2.
- Respetar el sistema de diseño: tokens `@theme`, flat design, Montserrat/Open Sans, Lucide.
- Cubrir el comportamiento con tests de config, componentes y composición de página (TDD).

**Non-Goals:**

- Cambiar Header, Footer, TopHeader, SiteCredits, WhatsApp, banner o el copy del Hero.
- Crear la página `/soluciones`; los CTAs "SABER MÁS" del home se redirigen a las anclas del portafolio en `/servicios`, no a esa ruta genérica.
- Añadir imágenes o assets nuevos.
- Migrar el contenido a CMS.
- Cambiar tokens de color, tipografía, radios o sombras.
- Modificar backend, API o dependencias.

## Decisions

### D1 — Conservar el chrome y la estructura del Hero

`servicios.astro` mantiene `Layout` con `hero` y `heroImage={tratamientoAgua}` y `ServicesHero` con su estructura actual, pero el copy del `<h1>` cambia a "Portafolio industrial de soluciones & Servicios Industriales" y la palabra destacada "Servicios Industriales" usa `text-primary` (`--color-primary` = `#41B3C4`), no el acento naranja. El bloque de hero y el sub-nav vacío del `modelo.html` (`modelo.html:64-73`) no se implementan: el mockup no aporta contenido allí.

**Alternativas descartadas:** reemplazar el banner por una banda navy con grid técnico (rompe la identidad del sitio); mover el copy del Hero al nuevo encabezado de sección (duplicaría el `h1`).

### D15 — Overlay del banner compartido y paridad entre Inicio y Servicios

Ambas páginas usan el mismo `Layout.astro` en modo `hero`, que ya renderiza una única capa `<div class="absolute inset-0 bg-secondary/80" aria-hidden="true">` sobre la imagen. No se añade ningún overlay propio en las páginas ni en `ServicesHero`; la paridad se fija con un test que renderiza Inicio y `/servicios` y compara esa capa exacta (mismas clases, misma opacidad y una sola instancia por página). El cambio de imagen de fondo (banner del home vs. `tratamiento-agua.webp`) no altera la capa.

**Alternativas descartadas:** duplicar el overlay en cada página (riesgo de divergencia); cambiar la opacidad en una página (rompe la identidad visual compartida).

### D2 — Dos secciones y cinco componentes nuevos

| Componente | Rol |
|---|---|
| `ServiciosSectionHeading.astro` | Encabezado reutilizable: marcador, eyebrow, `h2`, intro y borde inferior. |
| `SolucionPortafolioCard.astro` | Fila de la Sección 1: icono, categoría, título, descripción, especificaciones, chips y CTA. |
| `ServicioTerrenoCard.astro` | Fila de la Sección 2: imagen con caption, índice/sector, título, descripción, cuerpo variable y CTA. |
| `ServiciosPortafolioSection.astro` | Wrapper `bg-bg` de la Sección 1 con heading y lista `divide-y`. |
| `ServiciosTerrenoSection.astro` | Wrapper `bg-primary-100 border-y border-border` de la Sección 2 con heading y tarjetas alternadas. |

`servicios.astro` queda como composición dumb:

```astro
<ServicesHero {...SERVICIOS_PAGE_CONTENT.hero} />
<ServiciosPortafolioSection {...SERVICIOS_PAGE_CONTENT.portfolioSection} />
<ServiciosTerrenoSection {...SERVICIOS_PAGE_CONTENT.fieldServicesSection} />
```

**Alternativas descartadas:** una sola tarjeta genérica con muchos condicionales (viola SRP y mezcla dos layouts distintos); renderizar todo inline en la página (duplica el patrón de encabezado y dificulta los tests).

### D3 — Config tipada en `services-page.ts` con unión discriminada

Se extiende `apps/web/src/lib/config/services-page.ts` y `apps/web/src/lib/types/services-page.ts`:

```ts
SERVICIOS_PAGE_HERO // sin cambios

SERVICIOS_PORTFOLIO_SECTION: {
  eyebrow, headline, intro,
  solutions: readonly SolucionPortafolio[]
}

SERVICIOS_FIELD_SECTION: {
  eyebrow, headline, intro,
  services: readonly ServicioTerreno[]
}

SERVICIOS_PAGE_CONTENT = {
  hero,
  portfolioSection,
  fieldServicesSection,
}
```

`ServicioTerrenoBody` es una unión discriminada:

```ts
type ServicioTerrenoBody =
  | { kind: 'features'; features: readonly ServicioFeature[] }
  | { kind: 'bullets'; bullets: readonly ServicioBullet[] }
  | { kind: 'tags'; tags: readonly string[] };
```

Cada tarjeta de la Sección 2 usa exactamente una variante, igual que el mockup: features (01), bullets (02 y 04) y tags (03). Esto evita estados inválidos y permite renderizado exhaustivo.

**Alternativas descartadas:** campos opcionales independientes (`features?`, `bullets?`, `tags?`) que permiten combinaciones contradictorias; un `bodyHtml` con HTML embebido (rompe el tipado y el control de tokens).

### D4 — Remapeo de tokens Material/Stitch

| Mockup | Riff |
|---|---|
| `brand-navy`, `on-background` | `text-secondary` / `text-text` |
| `brand-cyan`, `primary-container` | `text-primary`, `bg-primary` |
| `brand-cyan-dark` | `text-primary-dark` o `text-primary-deep` |
| `brand-orange`, `secondary-container` | `bg-accent`, `text-accent` |
| `background` | `bg-bg` |
| `surface-dim` | `bg-primary-100` (Sección 2) o `bg-bg` (paneles) |
| `surface-variant` | `bg-primary-light` |
| `outline-variant` | `border-border` |
| `outline` | `text-muted` |
| `text-slate-*` | `text-text-2` / `text-muted` |
| `font-display` / `font-headline` | `font-heading` |
| `font-body` | `font-body` |
| `font-label` (Inter) | `font-heading` para labels en mayúsculas |
| `shadow-sm` | Eliminar; separar con `border-border` |

No se copian estilos inline, `background-image`, `border-radius: 0 !important` ni el patrón `tech-grid-pattern`. El radio 0 ya está garantizado por `--radius: 0` y la regla de no usar `rounded*`.

### D5 — Iconos Lucide y actualización del catálogo

Mapeo:

| Mockup | Lucide |
|---|---|
| `speed` | `lucide:gauge` |
| `water_ec` | `lucide:droplets` |
| `science` | `lucide:flask-conical` |
| `valve` | `lucide:settings-2` |
| `tune` | `lucide:sliders-horizontal` |
| `check_circle` | `lucide:circle-check` |
| `check_box` | `lucide:square-check` |
| `arrow_forward` | `lucide:arrow-right` |

Los nombres viven en la config (`icon: string`), no hardcodeados en el HTML. Los iconos que acompañan texto son decorativos (`aria-hidden="true"`). Se añaden `flask-conical`, `settings-2` y `square-check` a `docs/design/style-guide/README.md` porque el catálogo debe documentar los iconos usados.

**Alternativas descartadas:** Material Symbols (set prohibido); SVG inline (prohibido por estándares); `lucide:valve` (no existe en el set instalado).

### D6 — Anclas y deep links

- Sección 2 conserva `id={slug}` con los cuatro slugs del home y `scroll-mt-72 md:scroll-mt-40 lg:scroll-mt-44`.
- Sección 1 usa ids nuevos: `solucion-medicion-fluidos`, `solucion-tratamiento-agua`, `solucion-productos-quimicos`, `solucion-control-accesorios`, también con `scroll-mt-*`.
- El contrato de slugs se valida en los tests de config y de página, no solo en la implementación.
- El home consume esos ids: `SOLUTIONS_DATA[*].href` apunta a `/servicios#{id}` para que "SABER MÁS" abra la fila correspondiente (ver D14).

### D7 — CTAs a `/contacto`

Ambas secciones usan CTAs sólidos `bg-accent hover:bg-accent-dark text-white` con `lucide:arrow-right` decorativo y destino `/contacto`. El mockup apunta a `#contacto-tecnico`, un ancla inexistente; se descarta.

### D8 — Fondos y separación de secciones

- Sección 1: `bg-bg`, contenedor interno blanco con `border border-border` y `divide-y divide-border`.
- Sección 2: `bg-primary-100 border-y border-border`.
- Tarjetas y paneles: `bg-white border border-border`.
- Sin sombras en estado estático.

### D9 — Responsive y flat design

- Sección 1: una columna en móvil; dos columnas desde `lg`; panel de especificaciones con grilla `sm:grid-cols-2` o `sm:grid-cols-3` según cantidad.
- Sección 2: una columna en móvil; imagen y contenido en una grilla de 12 columnas desde `md` (5/7), con orden alternado.
- Imágenes de la Sección 2 con `aspect` y `object-cover`, `loading="lazy"`, `widths`/`sizes` razonables.
- Sin `rounded*`, sin `shadow*`, sin hex, sin `brand-*`.

### D10 — Semántica y accesibilidad

- Jerarquía: un `h1` (`ServicesHero`), un `h2` por sección, `h3` por tarjeta, `h4` solo para el título del panel de especificaciones.
- Los títulos de features se renderizan como `<strong>` dentro de la caja, no como headings, para no inflar la jerarquía.
- Captions sobre imagen con texto blanco/primario y overlay `bg-secondary-dark/90`; contraste suficiente.
- Iconos decorativos con `aria-hidden="true"`; CTAs con texto visible como nombre accesible.

### D11 — Retiro de `ServiceCard` y sus tests

Al reemplazar la lista, `ServiceCard.astro` queda sin uso. Se eliminan el componente, `ServiceCard.test.ts` y su snapshot. La cobertura de bullets, tags, CTA y anclas se traslada a `ServicioTerrenoCard.test.ts`; la cobertura de la composición y del contrato de slugs se traslada a los tests de página y config.

**Alternativas descartadas:** mantener el componente muerto (deuda innecesaria y confusión sobre el patrón vigente).

### D12 — Assets

No se añaden binarios. Las cuatro imágenes de la Sección 2 ya existen:

- `edificios.jpg`
- `medidores-de-agua.webp`
- `planta-tratamiento.webp`
- `osmosis-inversa.jpg`

La Sección 1 no usa imágenes. Las URLs remotas del `modelo.html` se descartan.

### D13 — Estrategia de tests (TDD)

1. Tests de config: estructura, longitudes, copy, iconos, slugs, una sola variante por tarjeta.
2. Tests de `ServiciosSectionHeading`: `h2`, marcador, intro, sin rounded/shadow.
3. Tests de `SolucionPortafolioCard`: contenido, specs, chips, CTA, ancla.
4. Tests de `ServicioTerrenoCard`: imagen/caption, índice/sector, tres variantes, CTA y ancla.
5. Tests de página: dos `h2`, ocho `article`, anclas, fondos, hero intacto, cuatro imágenes.
6. Tests de catálogo de iconos: README con las tres entradas nuevas.
7. Verificación final: `npm run lint`, `npm run typecheck`, `npm run test` en `apps/web`.

### D14 — Deep links desde las tarjetas del home

Los cuatro CTAs "SABER MÁS" de `SolutionSection` dejan de apuntar a la ruta genérica `/soluciones` (que no existe) y pasan a apuntar al ancla exacta de la Sección 1 de `/servicios`:

| Tarjeta del home | `href` |
|---|---|
| Medición de Fluidos | `/servicios#solucion-medicion-fluidos` |
| Tratamiento de Agua | `/servicios#solucion-tratamiento-agua` |
| Productos Químicos | `/servicios#solucion-productos-quimicos` |
| Control y Accesorios | `/servicios#solucion-control-accesorios` |

El mapeo se declara explícitamente en `SOLUTIONS_DATA` (no se deriva del `slug` porque `medicion-de-fluidos` no coincide con `solucion-medicion-fluidos`). Los tests de config y de `SolutionSection` fijan los cuatro valores para evitar regresiones; el `scroll-mt-*` de cada `SolucionPortafolioCard` compensa el header sticky al llegar por ancla.

**Alternativas descartadas:** derivar `#solucion-${slug}` (rompe la primera tarjeta); mantener `/soluciones` (ruta inexistente y sin contenido); crear la página `/soluciones` (fuera de alcance).

### D16 — Títulos principales en mayúsculas

Los seis `<h1>` principales (Inicio, Nosotros, Productos, Servicios, Representaciones y Contacto) se muestran completamente en mayúsculas. La transformación se aplica con la utilidad `uppercase` en el propio `<h1>`, no reescribiendo el copy de la config: así se conservan los textos, los tests de contenido, los `highlightedWord` y la semántica del documento, y el span destacado también queda en mayúsculas. `NosotrosHero` y `RepresentacionesHero` ya la tenían; se añade a `HeroBanner`, `ProductsPageHeader`, `ServicesHero` y `ContactHero`, con cobertura de test en los seis.

**Alternativas descartadas:** cambiar las cadenas de config a mayúsculas (rompe comparaciones, highlights y copy reutilizado); aplicar `text-transform` global a todos los `h1` (afectaría páginas fuera del alcance).

## Risks / Trade-offs

- **[Copy muy extenso en la Sección 1]** → Mantener el texto textual del mockup; usar `max-w-3xl`, `leading-relaxed` y espaciado generoso. Si en revisión visual resulta excesivo, se ajusta la config sin tocar componentes.
- **[Duplicidad “Tratamiento de Agua” entre secciones]** → Aceptada explícitamente en la revisión; la Sección 1 vende la línea de equipamiento y la Sección 2 el servicio en terreno.
- **[Contraste de `text-primary` sobre blanco]** → Se usa `primary-dark`/`primary-deep` para textos pequeños cuando haga falta, manteniendo el token. Verificar visualmente.
- **[Contradicción con la spec vigente de `services-page`]** → El delta elimina los requisitos de `ServiceCard` y añade los nuevos; al archivar, la spec principal queda coherente.
- **[Tests existentes acoplados a cuatro `article`/`h2`]** → Se actualizan junto con la implementación; no se conservan expectativas obsoletas.
- **[Iconos nuevos fuera del catálogo]** → Se actualiza el README y se añade cobertura en el test de catálogo para evitar regresiones.
- **[Pérdida de enlaces si cambian los slugs o las anclas]** → Los slugs se mantienen, los ids `solucion-*` se cubren con tests de página y el mapeo `href` del home se cubre con tests de config y de `SolutionSection`.

## Migration Plan

1. Escribir/actualizar los tests de config, componentes y página (fallando primero).
2. Extender `lib/types/services-page.ts` y `lib/config/services-page.ts`.
3. Crear `ServiciosSectionHeading`, `SolucionPortafolioCard`, `ServicioTerrenoCard`, `ServiciosPortafolioSection` y `ServiciosTerrenoSection`.
4. Actualizar `servicios.astro` para componer las dos secciones.
5. Eliminar `ServiceCard.astro`, `ServiceCard.test.ts` y su snapshot.
6. Actualizar `docs/design/style-guide/README.md` con los iconos nuevos.
7. Actualizar `SOLUTIONS_DATA[*].href` del home a las anclas `#solucion-*` y sus tests.
8. Ejecutar `npm run lint`, `npm run typecheck` y `npm run test` en `apps/web`.
9. Verificar `/servicios#medicion-en-edificios`, `/servicios#solucion-medicion-fluidos` y los "SABER MÁS" del home en el navegador.

Rollback: al ser SSG y un cambio de contenido/componentes, revertir el commit restaura la página anterior; no hay migraciones de datos ni cambios de API.

## Open Questions

Ninguna. Las decisiones de alcance fueron confirmadas en la revisión: se implementan ambas secciones, se acepta la duplicidad de “Tratamiento de Agua”, los CTAs van a `/contacto`, se conservan los slugs y se añaden las anclas nuevas, el copy del mockup se usa tal cual, `ServiceCard` se elimina y la Sección 2 usa `bg-primary-100`.
