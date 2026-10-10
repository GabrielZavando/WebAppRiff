# Tasks

> TDD: cada tarea de implementación escribe primero el test fallido (RED) y
> luego el código que lo hace pasar (GREEN). Referencias: specs delta de
> `nosotros-page` (contrato, SC-201…SC-212) y `navigation-menu` (SC-006
> ajustado) + design.md D1–D16 (cómo).

## 1. Contratos: tipos y config de contenido

- [x] 1.1 RED: crear `apps/web/src/lib/types/__tests__/nosotros-page.test.ts` (patrón `pilares-section.test.ts`): unions cerradas de iconos (nombres Lucide verificados en D5) y shapes de `TimelineMilestone`, `ValuePillar`, `SectorCard`, `TeamMember`, `ClientCard`, `NosotrosCta` y `NosotrosPageContent`; smoke runtime de construcción + `expectTypeOf`; caso `@ts-expect-error` para un icono inválido. Verificar que falla (el módulo no existe).
- [x] 1.2 GREEN: implementar `apps/web/src/lib/types/nosotros-page.ts` con los tipos anteriores (arrays `readonly`, iconos como unión cerrada, imágenes `ImageMetadata`). Verificar: `npm run typecheck -w @riff/web` y el test 1.1 en verde.
- [x] 1.3 Verificar cada nombre Lucide de la tabla D5 contra `node_modules/@iconify-json/lucide` (p. ej. inspeccionando `icons.json`); si falta alguno, aplicar el fallback previsto en D5 y dejarlo anotado en design.md D5. Salida: lista final de iconos fijada en la config (task 1.5).
- [x] 1.4 RED: crear `apps/web/src/lib/config/__tests__/nosotros-page.test.ts`: `NOSOTROS_PAGE_CONTENT` tiene las 6 secciones; 5 hitos con sus años (1979/2012/2013/2018/Diciembre 2024) y copy verbatim; 4 pilares; 4 sectores; 4 miembros (Steven Marks, Lara Smith, John Doe, Felipe Román) con roles/cargos verbatim; 8 clientes con sus bajadas; CTAs de asesoría con `href === '/contacto'` (y ningún `'#contacto'`); ancla `#historia`; teléfono resuelto desde `getContactInfo()` (`tel:+56229079067`, texto "+56 2 29079067"); todos los `alt` no vacíos; las imágenes provienen de imports de `@/assets/img/` (placeholders de D6). Verificar que falla.
- [x] 1.5 GREEN: implementar `apps/web/src/lib/config/nosotros-page.ts` (`NOSOTROS_PAGE_CONTENT`, copy verbatim de la referencia según D13, imports de assets `medicion-fluidos.webp`, `f-1.jpg`, `f-2.jpg`, `f-3.jpg`, `control-accesorios.webp`, teléfono desde `getContactInfo()`). Verificar: test 1.4 en verde.

## 2. Hero institucional (SC-201, SC-202)

- [x] 2.1 RED: crear `apps/web/src/components/__tests__/NosotrosHero.test.ts` (AstroContainer + `stripComments`): `<h1>` con "SOMOS" y "RIFF" (resaltado con token `text-primary`), subtítulo verbatim, párrafo verbatim, eyebrow "IDENTIDAD & TRAYECTORIA CORPORATIVA", CTA "SOLICITAR ASESORÍA TÉCNICA" con `href="/contacto"` e icono `lucide:arrow-right` `aria-hidden`, CTA "CONOCER NUESTRA HISTORIA" con `href="#historia"`, imagen con `alt` no vacío, fondo oscuro con token (`bg-secondary`), sin hex ni `rounded*`, SVG decorativo `aria-hidden`. Verificar que falla (el componente no existe).
- [x] 2.2 GREEN: implementar `apps/web/src/components/NosotrosHero.astro` (dumb, props desde config; tokens de D4; SVG decorativo `hidden lg:block` D14; iconos Lucide D5). Verificar: test 2.1 en verde.

## 3. Línea de tiempo (SC-203)

- [x] 3.1 RED: crear `apps/web/src/components/__tests__/NosotrosTimeline.test.ts`: elemento con `id="historia"`; los 5 hitos con años y títulos verbatim; la nota lateral "Hito Clave" (hito 1979); encabezado "Nuestra Historia — De una Tradición Familiar a la Excelencia Industrial"; línea central y badges numéricos ocultos fuera de desktop (`hidden lg:`); sin hex ni `rounded*`. Verificar que falla.
- [x] 3.2 GREEN: implementar `apps/web/src/components/NosotrosTimeline.astro` (grid 12-col en `lg` con alternado `order-*`, base apilado, `shadow-1/2` de tarjetas por D11). Verificar: test 3.1 en verde.

## 4. Propuesta de valor (SC-204)

- [x] 4.1 RED: crear `apps/web/src/components/__tests__/NosotrosValueProp.test.ts`: título "Nuestra Propuesta de Valor"; los 4 pilares con títulos y descripciones verbatim e icono `lucide:` decorativo; las 4 tarjetas de sector con "SECTOR 01"…"SECTOR 04", títulos y copy verbatim; grid responsive declarado; sin hex ni `rounded*`. Verificar que falla.
- [x] 4.2 GREEN: implementar `apps/web/src/components/NosotrosValueProp.astro`. Verificar: test 4.1 en verde.

## 5. Misión & Visión (SC-205)

- [x] 5.1 RED: crear `apps/web/src/components/__tests__/NosotrosIdentity.test.ts`: encabezados "MISIÓN" y "VISIÓN"; eyebrows "PRINCIPIO FUNDAMENTAL" y "PROYECCIÓN DE FUTURO"; citas verbatim; notas finales verbatim; un bloque claro (`bg-white`) y uno oscuro (`bg-secondary`); iconos Lucide decorativos; sin hex ni `rounded*`. Verificar que falla.
- [x] 5.2 GREEN: implementar `apps/web/src/components/NosotrosIdentity.astro` (`grid-cols-1 lg:grid-cols-2`). Verificar: test 5.1 en verde.

## 6. Equipo (SC-206)

- [x] 6.1 RED: crear `apps/web/src/components/__tests__/NosotrosTeamGrid.test.ts`: encabezado "Equipo RIFF — Liderazgo & Experiencia" + badge "+100 años de experiencia combinada en terreno"; exactamente 4 tarjetas (Steven Marks, Lara Smith, John Doe, Felipe Román) con cargo, descripción verbatim, área ("Dirección"/"Ingeniería"/"Comercial"/"Operaciones") y pie con icono ("Gestión Corporativa"/"Cálculo & Comisionamiento"/"Alianzas Globales"/"Metrología & Faena"); imágenes con `alt` no vacío; grid responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`); sin hex ni `rounded*`. Verificar que falla.
- [x] 6.2 GREEN: implementar `apps/web/src/components/NosotrosTeamGrid.astro` (nombre evita la colisión con `NosotrosTeamSection.astro` de la home). Verificar: test 6.1 en verde.

## 7. Clientes y CTA final (SC-207)

- [x] 7.1 RED: crear `apps/web/src/components/__tests__/NosotrosClients.test.ts`: título "Quienes Han Confiado en Nosotros"; exactamente 8 clientes con sus bajadas verbatim; banner con "¿Listo para optimizar la medición y el flujo de su operación?"; CTA "SOLICITAR ASESORÍA TÉCNICA" con `href="/contacto"`; enlace `tel:+56229079067` con texto "+56 2 29079067"; sin hex ni `rounded*`; sin `shadow*` en los botones (D11). Verificar que falla.
- [x] 7.2 GREEN: implementar `apps/web/src/components/NosotrosClients.astro` (grid `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8`, banner `bg-primary-deep`/`bg-primary` con tokens). Verificar: test 7.1 en verde.

## 8. Composición de la página /nosotros (SC-108, SC-109, SC-208, SC-209, SC-210, SC-211, SC-212)

- [x] 8.1 RED: reescribir `apps/web/src/pages/__tests__/nosotros.test.ts`: conservar SC-108 (1 `<header>`, `<footer>`, nav) y las aserciones de chrome (`sin banner_home`, `sin role="search"`); reemplazar la aserción de `<main>` vacío por: `<main aria-label="Contenido de Nosotros">` contiene las 6 secciones (h1 "SOMOS RIFF", `id="historia"` con los 5 años, "MISIÓN"/"VISIÓN", 4 miembros del equipo, 8 clientes, banner CTA), ningún `href="#contacto"`, CTAs con `href="/contacto"`, `lucide:` presente y `material-symbols` ausente, todas las `<img>` con `alt` no vacío, exactamente un `<h1>`, sin hex literales en `class`, sin `rounded`, sin `<script>` propio de smooth scroll. Verificar que falla (hoy el test afirma lo contrario).
- [x] 8.2 GREEN: implementar la composición en `apps/web/src/pages/nosotros.astro`: mantener `title`, `description`, `hero={false}`, `showSearch={false}` y `<main aria-label="Contenido de Nosotros">`; componer los 6 componentes con `NOSOTROS_PAGE_CONTENT` (patrón `contacto.astro`); actualizar el comentario de cabecera (ya no está vacía; remitir a los specs SC-201…SC-212). Sin offset `pt-44` (D9). Verificar: test 8.1 en verde + `npm run typecheck -w @riff/web`.
- [x] 8.3 Verificación visual manual contra `docs/design/components/nosotros/reference.jpg` (dev server, viewports mobile/tablet/desktop): colapsos responsive (D10), solape con el header sticky (D9 — si hubiera solape, aplicar el padding coherente con el hero de la home `pt-4 md:pt-8 lg:pt-24`, nunca `pt-44`), contraste de los textos claros sobre navy (D4). Registrar cualquier desvío y ajustar markup/config (no specs) si el cliente lo pide.

## 9. Documentación y verificación final

- [x] 9.1 Añadir los iconos nuevos usados por esta página a la tabla del catálogo en `docs/design/style-guide/README.md` (sección "Catálogo completo") y verificar con `npx vitest run src/styles/__tests__/icon-catalog.test.ts` en `apps/web` (no debe romperse; los 5 componentes base no cambian).
- [x] 9.2 Ejecutar en `apps/web`: `npm run lint`, `npm run typecheck`, `npm test` — todo en verde, sin warnings nuevos de astro-icon en el build de los componentes.
- [x] 9.3 Ejecutar `npx openspec validate --all --strict` y verificar que los deltas de `nosotros-page` y `navigation-menu` son válidos sin errores ni warnings. Nota: el requirement original "Page renders with only the shared header and footer chrome" se reemplaza vía REMOVED+ADDED (no MODIFIED) porque el `<main>` pasa de vacío a 6 secciones y OpenSpec 1.14 exige conservar los nombres de escenario preexistentes en un MODIFIED.
- [x] 9.4 Ejecutar `make ci` (gate completo: openspec-validate + lint + typecheck + build + test-ci + audit) y verificar que pasa.
