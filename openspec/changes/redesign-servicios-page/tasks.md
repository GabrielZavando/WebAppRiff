## 1. Tests RED (TDD)

- [x] 1.1 Actualizar `apps/web/src/lib/config/__tests__/services-page.test.ts` con las nuevas secciones: longitudes (4 soluciones, 4 servicios), campos obligatorios, iconos `lucide:*`, slugs y una sola variante `body` por servicio.
- [x] 1.2 Añadir `apps/web/src/components/__tests__/ServiciosSectionHeading.test.ts` con escenarios de `h2`, eyebrow, marcador `primary`/`accent`, intro y ausencia de `rounded*`/`shadow*`.
- [x] 1.3 Añadir `apps/web/src/components/__tests__/SolucionPortafolioCard.test.ts` con icono, categoría, título, descripción, ancla, panel de especificaciones, chips, CTA a `/contacto` y casos sin specs/tags.
- [x] 1.4 Añadir `apps/web/src/components/__tests__/ServicioTerrenoCard.test.ts` con imagen/caption, índice, sector, título, descripción, alternancia de imagen, las tres variantes de `body`, CTA y ancla con `scroll-mt-*`.
- [x] 1.5 Actualizar `apps/web/src/pages/__tests__/servicios.test.ts`: dos `<h2>`, ocho `<article>`, fondos `bg-bg`/`bg-primary-100`, cuatro imágenes de la Sección 2, hero actual y las ocho anclas.
- [x] 1.6 Ampliar `apps/web/src/styles/__tests__/icon-catalog.test.ts` (o el test correspondiente) para exigir las entradas `flask-conical`, `settings-2` y `square-check` en el catálogo.
- [x] 1.7 Ejecutar `npm run test` en `apps/web` y confirmar que los tests nuevos fallan por ausencia de implementación.

## 2. Tipos y configuración

- [x] 2.1 Extender `apps/web/src/lib/types/services-page.ts` con `SolucionPortafolio`, `ServiciosPortafolioSectionProps`, `ServicioTerreno`, `ServicioTerrenoBody` (unión discriminada), `ServiciosTerrenoSectionProps` y el nuevo `ServicesPageProps`.
- [x] 2.2 Mantener `ServicesHeroProps` sin cambios y actualizar los comentarios que referencian `ServiceCard`/`SERVICIOS_PAGE_SERVICES`.
- [x] 2.3 Reescribir `apps/web/src/lib/config/services-page.ts` con el copy textual del `modelo.html`: hero sin cambios, `SERVICIOS_PORTFOLIO_SECTION` con 4 soluciones, `SERVICIOS_FIELD_SECTION` con 4 servicios y `SERVICIOS_PAGE_CONTENT` cableando las tres partes.
- [x] 2.4 Importar las cuatro imágenes existentes de `@/assets/img/` en el orden del mockup: `edificios.jpg`, `medidores-de-agua.webp`, `planta-tratamiento.webp`, `osmosis-inversa.jpg`.
- [x] 2.5 Definir los IDs de la Sección 1 (`solucion-medicion-fluidos`, `solucion-tratamiento-agua`, `solucion-productos-quimicos`, `solucion-control-accesorios`) y conservar los slugs de la Sección 2.

## 3. Componentes

- [x] 3.1 Crear `apps/web/src/components/ServiciosSectionHeading.astro` con marcador `primary`/`accent`, eyebrow, `h2`, intro, borde inferior y flat design.
- [x] 3.2 Crear `apps/web/src/components/SolucionPortafolioCard.astro` con fila responsive, icono Lucide, panel de especificaciones, chips y CTA a `/contacto`.
- [x] 3.3 Crear `apps/web/src/components/ServicioTerrenoCard.astro` con imagen `astro:assets`, caption superpuesto, índice/sector, las tres variantes de cuerpo, alternancia de imagen, CTA y ancla con `scroll-mt-*`.
- [x] 3.4 Crear `apps/web/src/components/ServiciosPortafolioSection.astro` (`bg-bg`) y `apps/web/src/components/ServiciosTerrenoSection.astro` (`bg-primary-100 border-y border-border`) componiendo heading + tarjetas.
- [x] 3.5 Verificar que ningún componente nuevo usa `brand-*`, hex, `text-slate-*`, `rounded*`, `shadow*` estático ni iconos fuera de `lucide:`.
- [x] 3.6 Ejecutar los tests de componentes y confirmar que pasan.

## 4. Composición de la página

- [x] 4.1 Actualizar `apps/web/src/pages/servicios.astro` para renderizar `ServicesHero`, `ServiciosPortafolioSection` y `ServiciosTerrenoSection` desde `SERVICIOS_PAGE_CONTENT`, manteniendo `Layout` con `hero` y `heroImage={tratamientoAgua}`.
- [x] 4.2 Eliminar `apps/web/src/components/ServiceCard.astro`, `apps/web/src/components/__tests__/ServiceCard.test.ts` y `apps/web/src/components/__tests__/__snapshots__/ServiceCard.test.ts.snap` una vez que la página ya no los importe.
- [x] 4.3 Ejecutar `npm run test` y confirmar que la suite de la página y config pasa completa.

## 5. Documentación

- [x] 5.1 Añadir al catálogo de `docs/design/style-guide/README.md` los mapeos `flask-conical` → `lucide:flask-conical`, `settings-2` → `lucide:settings-2` y `square-check` → `lucide:square-check`.
- [x] 5.2 Revisar que los comentarios de `lib/config/services-page.ts`, `lib/types/services-page.ts` y `ServicesHero.astro` ya no describan el patrón `ServiceCard` retirado.

## 6. Verificación final

- [x] 6.1 Ejecutar `npm run lint` en `apps/web`.
- [x] 6.2 Ejecutar `npm run typecheck` en `apps/web`.
- [x] 6.3 Ejecutar `npm run test` en `apps/web`.
- [ ] 6.4 Verificar manualmente `/servicios`, `/servicios#medicion-en-edificios` y `/servicios#solucion-medicion-fluidos` (render, responsive y scroll bajo el header sticky).
- [x] 6.5 Ejecutar `npx openspec validate redesign-servicios-page --strict`.

## 7. Deep links del home al portafolio

- [x] 7.1 Actualizar el delta `specs/solution-section/spec.md` para reemplazar el `href` genérico `/soluciones` por las cuatro anclas `#solucion-*`.
- [x] 7.2 Actualizar los tests de `lib/config/solution-section` y de `SolutionSection` para exigir los cuatro deep links (fallando primero).
- [x] 7.3 Actualizar `SOLUTIONS_DATA[*].href` y los comentarios de `lib/config/solution-section.ts` y `lib/types/solution-section.ts`.
- [x] 7.4 Ejecutar `npm run test`, `npm run lint` y `npm run typecheck` en `apps/web`.
- [x] 7.5 Ejecutar `npm run build` y confirmar que el HTML del home enlaza a las cuatro anclas.

## 8. Hero y paridad del banner

- [x] 8.1 Actualizar el delta `specs/services-page/spec.md` y `design.md` con el nuevo copy del Hero y el requisito de paridad del overlay.
- [x] 8.2 Actualizar los tests de `SERVICIOS_PAGE_HERO`, `ServicesHero` y la página para el nuevo título y `text-primary` (fallando primero), y añadir el test de paridad del overlay Inicio/Servicios.
- [x] 8.3 Reemplazar `headline` por "Portafolio industrial de soluciones & Servicios Industriales" y `highlightedWord` por "Servicios Industriales".
- [x] 8.4 Cambiar el color del span destacado de `ServicesHero` a `text-primary` y actualizar sus comentarios.
- [x] 8.5 Ejecutar `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` y `npx openspec validate redesign-servicios-page --strict`.

## 9. Mayúsculas en los títulos principales

- [x] 9.1 Crear el delta `specs/page-headings/spec.md` y documentar la decisión en `design.md`.
- [x] 9.2 Añadir tests que exijan `uppercase` en el `<h1>` de Inicio, Nosotros, Productos, Servicios, Representaciones y Contacto (fallando primero donde falte).
- [x] 9.3 Añadir la utilidad `uppercase` a los `<h1>` de `HeroBanner`, `ProductsPageHeader`, `ServicesHero` y `ContactHero`; verificar que `NosotrosHero` y `RepresentacionesHero` ya la tienen.
- [x] 9.4 Actualizar snapshots y ejecutar `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build` y `npx openspec validate redesign-servicios-page --strict`.
