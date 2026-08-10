# Tasks — Site Footer

## 1. Types

- [x] 1.1 Create `apps/web/src/lib/types/footer.ts` with `FooterLink` (`label`, `href`), `FooterColumn` (`title`, `links`), `FooterScheduleEntry` (`days`, `hours`) and `SiteFooterProps` (`logoAlt`, `tagline`, `socialLinks: readonly SocialLink[]` reusing `@/lib/types/top-header`, `columns`, `schedule`, `scheduleNote`) — all fields `readonly`, no `any`
- [x] 1.2 Create the type-level tests in `apps/web/src/lib/types/__tests__/footer.test.ts` asserting the contract shape (readonly fields, `SocialLink` reuse, array-of-columns structure)

## 2. Config

- [x] 2.1 Create `apps/web/src/lib/config/footer.ts` exporting `SITE_FOOTER_CONTENT` as `Readonly<SiteFooterProps>`: tagline "Innovación tecnológica en la gestión de fluidos desde 1979.", social links via `getSocialLinks(getContactInfo())`, SERVICIOS column (Instalación de Medidores, Control de Agua Caliente, Puesta en Marcha Industrial, Obras Civiles Hidráulicas — all `href="#"`), EMPRESA column (Nuestra Historia, Representaciones, Proyectos de Éxito, Contacto Directo — all `href="#"`), schedule (Lunes a Jueves 09:00 a 18:00, Viernes 09:00 a 17:00), `scheduleNote: 'Soporte 24/7 disponible'`, `logoAlt: 'Riff'` — plus the standalone constants `FOOTER_COPYRIGHT` ("© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.") and `FOOTER_LOCATION` ("SANTIAGO, CHILE"). The brand logo image (`logo-web.webp`) is NOT part of the config: the props contract has no image field (spec "Component is presentational"), so `Footer.astro` imports it directly from `@/assets/img/` exactly like `Header.astro` does (design.md § Decision 3)
- [x] 2.2 Create the config tests in `apps/web/src/lib/config/__tests__/footer.test.ts` validating: tagline value, exactly 2 columns with titles SERVICIOS and EMPRESA, 4 links per column, every link `href="#"`, 2 schedule entries, copyright/location constant texts (if exported) and `logoAlt` fallback

## 3. Component

- [x] 3.1 Create `apps/web/src/components/Footer.astro` as a dumb presentational component (props-only, no logic beyond destructuring) rendering: `<footer class="bg-secondary-dark">` full-bleed with `<div class="container py-16 md:py-24">` and a grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10`
- [x] 3.2 Implement the brand column: `astro:assets` `<Image>` with `logo-web.webp`, `alt` from props (fallback "Riff"), `loading="lazy"`; tagline `<p>` with `text-muted`; social links reusing the `SocialLink` icon map from `TopHeader` (`lucide:facebook|twitter|instagram|linkedin`), `aria-label` per network, `target="_blank"` + `rel="noopener noreferrer"`, only configured URLs render
- [x] 3.3 Implement SERVICIOS and EMPRESA columns via `columns.map`: column title as `<p>` with `font-heading text-primary uppercase` (NOT a heading — preserves per-page heading outline) and `<a href="#">` links with `text-white/80 hover:text-white transition-colors`
- [x] 3.4 Implement the HORARIO TÉCNICO column: title `<p>` styled as the other columns; schedule entries as `<dl>` with `<dt>` (day range, `text-white font-semibold`) / `<dd>` (hours, `text-muted`); 24/7 note with `lucide:clock` icon (`aria-hidden="true"`) and `text-primary` text
- [x] 3.5 Implement the bottom bar: divider `<div class="border-t border-white/10">`, copyright (`text-muted uppercase`) + location (`text-muted uppercase`) + scroll-to-top `<button type="button" data-scroll-top aria-label="Volver arriba" class="bg-primary text-white">` with `lucide:arrow-up` icon
- [x] 3.6 Add the inline `<script is:inline>` wiring `[data-scroll-top]` buttons to `window.scrollTo({ top: 0, behavior: 'smooth' })` (same pattern as `Header.astro`)
- [x] 3.7 Create the component tests in `apps/web/src/components/__tests__/Footer.test.ts` + `helpers/footer-test-utils.ts` covering: `<footer>` outermost with `bg-secondary-dark`, container + `py-16 md:py-24`, responsive grid classes, brand column (lazy logo image, tagline, social links filtered by URL), SERVICIOS/EMPRESA titles and 4 links each with `href="#"`, schedule `<dl>` rows, 24/7 note, copyright/location texts, scroll button (`data-scroll-top`, `bg-primary`, `aria-label`), no `rounded*`/`shadow*` classes, no `h2`/`h3` in output
- [x] 3.8 Add a snapshot test for the stable footer markup (consistent with other sections)

## 4. Integration

- [x] 4.1 Update `apps/web/src/layouts/Layout.astro`: import `Footer` + `SITE_FOOTER_CONTENT` and render `<Footer {...SITE_FOOTER_CONTENT} />` immediately after the `<slot />` (inside the existing flex-col shell so the footer sits at the document end)
- [x] 4.2 Run the full `apps/web` suite (unit + typecheck + lint + build) and confirm all tests pass, including `no-brand-classes.test.ts` and the Layout suite