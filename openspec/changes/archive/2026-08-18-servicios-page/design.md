## Context

El sitio público Astro (`apps/web/`) tiene un patrón establecido: componentes presentacionales (dumb) que reciben datos vía props desde un config hardcoded en `lib/config/`, con tipos en `lib/types/`. `Layout.astro` renderiza el chrome global (TopHeader, Header, SearchForm, Footer). La página `/servicios` ya existe como placeholder dentro de `Layout` con `searchSecondary`.

La imagen `docs/design/components/ServicesPage.png` muestra:

- **Hero** con fondo oscuro y título "Servicios Especializados en **Precisión** y Control" (con "Precisión" resaltado) + subtítulo descriptivo.
- **4 service cards** en layout alternado (imagen/texto invirtiendo cada card), cada una con: número (01–04), etiqueta de sector, título, descripción, imagen; y para algunas: bullets con checkmarks o tags/pills; más un botón CTA "CONTACTAR A UN ESPECIALISTA".
  - Card 01 — SECTOR RESIDENCIAL/COMERCIAL — Medición en Edificios (imagen izq / texto der)
  - Card 02 — SECTOR INDUSTRIAL — Medición Industrial (texto izq / imagen der, 2 bullets)
  - Card 03 — INGENIERÍA & CONSTRUCCIÓN — Obras y Proyectos (imagen izq / texto der, 4 tags)
  - Card 04 — QUÍMICA & PROCESOS — Tratamiento de Agua y Desalinización (texto izq / imagen der, 3 bullets)

## Goals / Non-Goals

**Goals:**

- Página `/servicios` completa con hero + 4 cards alternadas, siguiendo el mockup.
- Componentes dumb + config hardcoded (patrón del sitio).
- Cumplir design tokens (flat design, radio 0, sin `shadow*` estático, colores `primary`/`accent`/`secondary`).
- Tests Vitest (AstroContainer + snapshot) para `ServicesHero` y `ServiceCard`.
- Accesibilidad: jerarquía de headings, `alt` descriptivo en imágenes, CTA con nombre accesible.

**Non-Goals:**

- NO se implementa backend (el CTA apunta a `/contacto` ya existente).
- NO se integra CMS (`contentful-from-cms` es change futuro; el config hardcoded se migrará sin tocar componentes).
- NO se modifica `Layout.astro` (la página usa `hero={false}` y `searchSecondary`, igual que el placeholder actual).
- NO se añaden imágenes nuevas (se reutilizan `assets/img` existentes).

## Decisions

1. **Componentes dumb + config hardcoded**: `ServicesHero` y `ServiceCard` reciben todo por props desde `SERVICIOS_PAGE_CONTENT` en `lib/config/services-page.ts`. Cumple SRP Astro (frontmatter sin lógica de negocio no trivial) y el patrón del sitio (`HERO_BANNER_CONTENT`, `CONTACT_PAGE_CONTENT`, `SERVICES_SECTION_CONTENT`). Alternativa: leer `import.meta.env` dentro del componente → descartada por romper el principio dumb y dificultar testing aislado.

2. **Reutilizar `splitHeadline()` de `lib/config/hero-banner.ts`**: `ServicesHero` delega el split del headline resaltado a la misma función pura ya testeada que usan `HeroBanner` y `ContactHero`. Evita duplicar lógica de split. Alternativa: copiar la función → descartada (duplicación innecesaria).

3. **Hero igual al de la página de inicio (imagen de fondo + overlay transparente)**: ajuste post-apply solicitado por el cliente. La página usa `hero={true}` en `Layout`, igual que `index.astro`. `Layout` expone un prop opcional `heroImage` (default `banner_home.webp`) usado en el `<Picture>` full-bleed del hero; `servicios.astro` lo sobreescribe con `tratamiento-agua.webp` para usar esa imagen específica como fondo del banner de servicios (segundo ajuste post-apply del cliente), manteniendo el mismo overlay `bg-secondary/80`, header/buscador transparentes que cambian a sólido en scroll, y el `ServicesHero` transparente (sin `bg-secondary-dark`) superpuesto con su contenido (headline + subtítulo) y altura (`py-16 md:py-24`). Decisiones previas (hero sólido `bg-secondary-dark`, sin imagen) se descartan por estos ajustes. Alternativa considerada: renderizar la imagen dentro de `ServicesHero` → descartada porque duplicaría el shell de hero de `Layout` (overlay, z-index, scroll) y rompería la coherencia con la home; el prop `heroImage` centraliza el hero en `Layout`.

4. **`ServiceCard` con prop `imagePosition: 'left' | 'right'`**: controla la alternancia. Card 01 y 03 → `left`; card 02 y 04 → `right`. Mobile-first: imagen arriba, contenido abajo en todas (`flex flex-col`); desde `md+` se usa `md:flex-row` y se invierte el orden con `md:flex-row-reverse` cuando `imagePosition === 'right'`. Las imágenes usan `astro:assets` `<Image>` con `widths`/`sizes` y `loading="lazy"`.

5. **Campos opcionales `intro`, `bullets` y `tags` en `ServicePageService`** (ajuste post-apply: texto extendido en cards 01-03):
    - `intro?: string` → párrafo de entrada renderizado sobre la lista de `bullets` (es el único párrafo de la card; el campo `description` fue eliminado por el cliente). Cards 01, 02 y 03. Presenta el servicio y cierra con "Nuestro servicio incluye:" / "abarca:" / "incluyen:" antes del `<ul>`.
    - `bullets?: readonly string[]` → renderiza `<ul>` con `lucide:check` (color `text-primary`). Lo usan ahora cards 01 (8 bullets), 02 (8 bullets), 03 (4 bullets) y 04 (3 bullets).
    - `tags?: readonly string[]` → renderiza fila de pills `border border-border text-text-2`; el componente lo sigue soportando, pero en `/servicios` ninguna card lo usa (card 03 migró de tags a bullets por requerimiento del cliente).
    - Card 04 queda igual: solo `bullets` (3); sin `description` ni `intro`.
    Alternativa: componentes separados `ServiceCardWithBullets` / `ServiceCardWithTags` → descartada por duplicación; un solo componente con props opcionales es más simple y reutilizable (ISP-friendly).

6. **Número de card**: `index` 1-based derivado del array en la página (`services.map((s, i) => ...)`) y pasado como prop `number`. Renderizado como `String(number).padStart(2, '0')` (01, 02…). Color `text-primary`, `font-heading font-bold`.

7. **Etiqueta de sector**: campo `sector` en el service (ej. `"SECTOR RESIDENCIAL/COMERCIAL"`). Renderizado en `text-primary uppercase text-xs tracking-wide font-heading`.

8. **CTA "CONTACTAR A UN ESPECIALISTA"**: botón `<a href="/contacto">` con `bg-accent hover:bg-accent-dark text-white font-heading uppercase text-sm px-6 py-3` e icono `lucide:arrow-right` decorativo (`aria-hidden="true"`). Reutiliza el patrón de botón accent del sitio (igual que `ContactForm`).

9. **Tokens y flat design**: sin `rounded*` ni `shadow*` estáticos. Card = `bg-white border border-border`. Hero de servicios = sección TRANSPARENTE (`text-white`) que se superpone a la imagen `banner_home.webp` + overlay `bg-secondary/80` provistos por `Layout` con `hero={true}` (igual que home). Resaltado "Precisión" = `text-accent`. Imágenes de card: `object-cover`, sin radio.

10. **Imágenes**: reutilizan `edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg` desde `assets/img/` (convención `image-assets`). `alt` descriptivo (no repite el título). `loading="lazy"` (sección below fold).

11. **Página `servicios.astro`**: usa `<Layout title="Servicios — Riff" description="..." hero>` (igual que `index.astro`, sin `searchSecondary`): `hero` activa la imagen `banner_home.webp` + overlay y el header/buscador transparentes con cambio de color al scroll (idéntico al comportamiento de inicio). El `<main>` contiene `ServicesHero` (sección transparente sobre la imagen) + sección de 4 `ServiceCard` envuelta en `bg-bg` (neutro claro) para separar del hero. Sin `<h1>` fuera del hero.

12. **Headings**: exactamente una `<h1>` en el hero. Cada título de card es `<h2>` (la página de servicios es la única con estas secciones; jerarquía: `h1` hero → `h2` cada card). El número y la etiqueta de sector son `<span>`/`<p>`, no headings.

## Risks / Trade-offs

- **Risk**: el cliente esperaba el hero con imagen de fondo igual que la home. → **Mitigation**: ajuste post-apply implementado — `servicios.astro` usa `hero` (banner_home.webp + overlay) y `ServicesHero` transparente, manteniendo el contenido y la altura del hero de servicios.
- **Risk**: el copy de bullets/tags no está transcrito con exactitud en la imagen. → **Mitigation**: redacto copy coherente con el dominio (medición industrial, tratamiento de agua) basado en la imagen y en los servicios ya existentes en `SERVICES_SECTION_CONTENT`.
- **Trade-off**: config hardcoded vs CMS → consiste con el resto del sitio SSG; el change `contentful-from-cms` futuro reemplazará los configs sin tocar componentes.
- **Trade-off**: hero con fondo sólido en vez de imagen → aceptado para MVP; mejora visual futura opcional.

## Migration Plan

- No requiere migración de datos ni cambios de API (`docs/api-spec.yml` invariante en este change).
- Deploy: build SSG estándar; la nueva página `/servicios` se genera en el build (reemplaza el placeholder).
- Rollback: revertir el commit del change `servicios-page` — `servicios.astro` vuelve al placeholder y los componentes/nuevos archivos se eliminan.

## Open Questions

- ¿El cliente quiere imagen de fondo en el hero de servicios o fondo sólido? (Resuelto parcialmente: uso sólido por coherencia; ajustable post-apply.)
- ¿El CTA debe ir a `/contacto` o a un formulario de servicio específico? (Uso `/contacto` por simplicidad; el change backend de contacts es futuro.)
