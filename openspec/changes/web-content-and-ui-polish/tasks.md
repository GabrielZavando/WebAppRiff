# Tasks

## 1. Home — titular "Nuestros Productos" (`solution-section`)

- [x] 1.1 (TDD) Actualizar `apps/web/src/lib/config/__tests__/solution-section.test.ts` para esperar `headline === "Nuestros Productos"` (escenario "SOLUTION_SECTION_CONTENT pins the renamed headline") y verificar que el test FALLA con el config actual
- [x] 1.2 Cambiar `SOLUTION_SECTION_CONTENT.headline` a "Nuestros Productos" en `apps/web/src/lib/config/solution-section.ts` (sin tocar `eyebrow`, `description` ni el titular de `/servicios`) y verificar que el test del paso 1.1 PASA
- [x] 1.3 Actualizar el fixture del snapshot `apps/web/src/components/__tests__/__snapshots__/SolutionSection.test.ts.snap` (regenerar con Vitest `-u`) y cualquier aserción del test de `SolutionSection.test.ts` que fije "Nuestras Soluciones"; verificar con `npm run test -- workspace web`

## 2. Botón WhatsApp — tamaño y pulso CSS (`whatsapp-float-button`)

- [x] 2.1 (TDD) Añadir a `apps/web/src/components/__tests__/WhatsAppButton.test.ts` los escenarios SC-009 (talla `h-14 w-14`, icono `h-7 w-7`, sin `h-12`/`h-6`) y del pulso (clase/animación presente, sin `<script>` de animación) y verificar que FALLA
- [x] 2.2 Actualizar `apps/web/src/components/WhatsAppButton.astro`: `h-14 w-14` en el `<a>`, `h-7 w-7` en el `<Icon>`, `<style>` scoped con `@keyframes` de pulso sutil (solo `transform`/`opacity`, `infinite`) y `@media (prefers-reduced-motion: reduce) { animation: none }`; verificar que los tests del paso 2.1 PASAN y que el documento del componente refleja la nueva talla
- [x] 2.3 Verificar accesibilidad del botón: `aria-label`, focus visible y z-index/posición sin cambios (`fixed bottom-6 right-6 z-20`) en el test existente (SC-008/SC-007 siguen pasando)

## 3. Representaciones — logos clickeables con `url` (`representaciones-page`)

- [x] 3.1 (TDD) Añadir a `apps/web/src/lib/config/__tests__/representaciones-page.test.ts` el escenario "Brand and distributor contracts expose the optional url field" (6 entradas con `url`, GL Flow `gl-sanitaria` sin `url`) y verificar que FALLA
- [x] 3.2 Añadir `readonly url?: string` a `RepresentacionBrand` y `Distribuidor` en `apps/web/src/lib/types/representaciones-page.ts` y mapear las urls en `apps/web/src/lib/config/representaciones-page.ts` (Apator `https://www.apator.com/en`, RIFF Flow Metering `https://riffmeters.com/`, Nitto Seiko `https://global.nittoseiko.com/`, ILMAP `https://ilmap.com/es/`, PIUSI `https://www.piusi.com/es/`, SENSUS `https://www.sensus-international.com/en`); verificar que el test del paso 3.1 PASA
- [x] 3.3 (TDD) Añadir a `apps/web/src/components/__tests__/RepresentacionBrandCard.test.ts` y `DistribuidorCard.test.ts` los escenarios de logo enlazado (`<a target="_blank" rel="noopener noreferrer">` envolviendo solo el `<img>` dentro de `data-brand-logo`), GL Sanitaria sin `<a>`, y estructura de tarjeta sin cambios; verificar que FALLAN
- [x] 3.4 Implementar el `<a>` condicional alrededor del `<Image>` en `apps/web/src/components/RepresentacionBrandCard.astro` y `DistribuidorCard.astro` (solo si `url` está definida; chip/`<h3>`/categoría/descripción fuera del enlace); verificar que los tests del paso 3.3 PASAN

## 4. Footer — rutas internas reales (`site-footer`)

- [x] 4.1 (TDD) Actualizar `apps/web/src/lib/config/__tests__/footer.test.ts` para los escenarios "SERVICIOS column deep-links to the four field-service anchors" y "EMPRESA column renders its three real internal links" (4 hrefs a `/servicios#<slug>`, 3 hrefs EMPRESA, sin `href="#"`, sin "Proyectos de Éxito") y verificar que FALLA
- [x] 4.2 Actualizar `SITE_FOOTER_CONTENT` en `apps/web/src/lib/config/footer.ts` con las rutas reales y la columna EMPRESA de 3 enlaces; verificar que el test del paso 4.1 PASA
- [x] 4.3 Actualizar `apps/web/src/components/__tests__/Footer.test.ts` y `apps/web/src/lib/types/__tests__/footer.test.ts` donde fijen `href="#"` o 4 enlaces por columna, manteniendo intactas las aserciones de estilo/labels; verificar que pasan

## 5. Nosotros — timeline con 4 hitos aprobados (`nosotros-page`)

- [x] 5.1 (TDD) Actualizar `apps/web/src/lib/config/__tests__/nosotros-page.test.ts` (bloque SC-203) para exactamente 4 hitos: badges "AÑO 1979"/"AÑO 2013"/"AÑO 2018"/"DICIEMBRE 2024", títulos "Nuestro Origen"/"Nace Aguapur Medición"/"El Nacimiento de RIFF"/"La Evolución hacia RIFF", tones `primary`/`primary`/`accent`/`dark`, copy verbatim (substrings clave: "Aguas Purificadas Ltda., fundada por el Sr. Patricio Barrientos Morales", "Ruby Barrientos Periale", "línea de negocio dentro de Aguapur Medición", "transformación de Aguapur Medición en RIFF"), notas laterales preservadas y `highlight === "RIFF"`; verificar que FALLA
- [x] 5.2 Reemplazar el array `milestones` de `NOSOTROS_PAGE_CONTENT.timeline` en `apps/web/src/lib/config/nosotros-page.ts` con los 4 hitos verbatim aprobados (sin cambiar `eyebrow`, `title`, `description` de la sección ni los demás bloques del config); verificar que el test del paso 5.1 PASA
- [x] 5.3 Actualizar `apps/web/src/components/__tests__/NosotrosTimeline.test.ts` (fixtures/snapshots que asuman 5 hitos o "RIFF SpA") sin alterar las aserciones de diseño (tonos, marcadores 01..03 + ★, alternancia por índice); verificar que pasan

## 6. Integración y gate de CI

- [x] 6.1 Ejecutar el suite completo del workspace web (lint + typecheck + test + build de Astro) y verificar que todo pasa: `npm run lint && npm run typecheck && npm run test -- workspace web` según los targets del `Makefile`
- [x] 6.2 Smoke visual del build (`astro preview` o build local): home muestra "Nuestros Productos"; el FAB de WhatsApp pulsa y queda estático con `prefers-reduced-motion`; los 6 logos con url abren en pestaña nueva y GL Flow no es clickeable; los enlaces del footer navegan a las secciones correctas; `/nosotros#historia` muestra los 4 hitos nuevos
- [x] 6.3 Ejecutar `npx openspec validate --all --strict` y `make ci` como gate final, dejando el change listo para `/opsx-apply` → `/opsx-archive`

## 7. Corrección post-apply — lista en el hito 2024 y sección "¿Qué nos define?" (feedback del cliente, 2026-10-24)

- [x] 7.1 (TDD) Actualizar `apps/web/src/lib/config/__tests__/nosotros-page.test.ts` (descripción 2024 verbatim terminando en "expandimos nuestra oferta para incluir:" + `items` con 2 ítems; título de la sección de valor "¿Qué nos define?" y nuevo intro "En RIFF, contamos…"), `NosotrosTimeline.test.ts` (lista `<ul>` con 2 `<li>` en la tarjeta oscura, sin el párrafo "En RIFF, contamos…"), `NosotrosValueProp.test.ts` (nuevo `<h2>` e intro) y verificar que FALLAN
- [x] 7.2 Añadir `readonly items?: readonly string[]` a `TimelineMilestone` en `apps/web/src/lib/types/nosotros-page.ts`, recortar la descripción 2024 y añadir los 2 ítems en `lib/config/nosotros-page.ts`, renombrar la sección de valor a "¿Qué nos define?" con el párrafo reubicado como intro (mismo config), y renderizar la lista condicional en `components/NosotrosTimeline.astro`; verificar que los tests del paso 7.1 PASAN
- [x] 7.3 Re-ejecutar el suite web completo, el build, `npx openspec validate --all --strict` y `make ci` para confirmar que todo sigue en verde
