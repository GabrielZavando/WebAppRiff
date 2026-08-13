## Why

Tres ajustes menores de layout solicitados para mejorar la experiencia visual en el home del sitio público: (1) el logo del sitio debe tener un ancho máximo controlado (200px en móvil, 300px en desktop) en lugar del ancho fijo de 330px; (2) el buscador debe tener respiración horizontal en móvil para no tocar los bordes del viewport; (3) la caja de contenido del banner principal (título, subtítulo y CTAs) debe subirse para quedar visible en el viewport inicial, reduciendo el padding superior.

## What Changes

- **Logo**: cambiar el `<img>` del logo de `w-[330px]` (ancho fijo) a `w-full max-w-[200px] sm:max-w-[300px]` (ancho máximo responsivo, escala proporcional). Se conservan los atributos `width="330"`/`height="134"` para la relación de aspecto y el CLS.
- **Buscador**: agregar `px-4 md:px-0` al contenedor interno del SearchForm (`max-w-[860px] mx-auto py-4`) para dar respiración horizontal en móvil y mantener el comportamiento de escritorio sin cambios.
- **Banner principal**: cambiar el padding vertical simétrico `py-16 md:py-24 lg:py-32` del wrapper de contenido por uno asimétrico `pt-4 pb-16 md:pt-8 md:pb-24 lg:pt-12 lg:pb-32`, reduciendo el padding superior para que el contenido quede visible en el viewport inicial.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `site-header`: modificar el requisito "Header renders logo at 2× size with overflow" para añadir el constraint de ancho máximo responsivo (200px móvil / 300px desktop) sobre el `<img>` del logo.
- `search-form`: modificar el requisito "SearchForm inner container is constrained to 860px and centered" para permitir padding horizontal `px-4` en móvil (removido en `md:px-0`), reemplazando la prohibición absoluta de padding horizontal.
- `hero-banner`: modificar el requisito "HeroBanner layout is responsive across viewports" (escenario "Section padding scales with viewport") para usar padding vertical asimétrico con padding superior reducido.

## Impact

- Archivos afectados:
  - `apps/web/src/components/Header.astro` (clase del `<img>` logo)
  - `apps/web/src/components/SearchForm.astro` (clase del contenedor interno)
  - `apps/web/src/components/HeroBanner.astro` (clase del wrapper de contenido)
- Tests afectados (deben actualizarse antes de codear, TDD):
  - `apps/web/src/components/__tests__/Header.test.ts` (aserción `w-[330px]` → `max-w-[200px]` + `sm:max-w-[300px]`)
  - `apps/web/src/components/__tests__/SearchForm.test.ts` (aserción de padding horizontal)
  - `apps/web/src/components/__tests__/HeroBanner.test.ts` (aserción de padding vertical)
  - Snapshots: `Header.test.ts.snap`, `SearchForm.test.ts.snap`, `HeroBanner.test.ts.snap` (regenerar con `vitest -u`)
- No hay cambios en la API, modelo de datos, ni dependencias.
