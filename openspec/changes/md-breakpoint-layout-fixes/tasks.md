## 1. Tests first (TDD)

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/SearchForm.test.ts` para exigir `md:w-[90%]`, `md:max-w-none`, `md:px-0` y `xl:max-w-[760px]` en el contenedor interno, y confirmar que la base móvil conserva `max-w-[760px] px-4`.
- [x] 1.2 Ampliar `apps/web/e2e/search-form.spec.ts` con escenarios de ancho renderizado: 90% del viewport (±1px) y centrado en `768×1024`, `1024×768` y `1204×800`; máximo 760px (±1px) en `1280×800`.
- [x] 1.3 Actualizar `apps/web/src/components/__tests__/Footer.test.ts` para exigir que el `<button data-scroll-top>` preceda al texto "SANTIAGO, CHILE" en el DOM y que la barra inferior lleve `sm:pr-24`.
- [x] 1.4 Añadir un e2e (en `apps/web/e2e/responsive-layout.spec.ts` o un `footer.spec.ts` nuevo) que verifique que el `boundingBox` del botón scroll-to-top no intersecta los FABs de WhatsApp/Teléfono en `768×1024`, `1024×768` y `1280×800`.
- [x] 1.5 Actualizar `apps/web/src/lib/config/__tests__/services-page.test.ts`, `apps/web/src/pages/__tests__/servicios.test.ts` y `apps/web/src/components/__tests__/ServiciosSectionHeading.test.ts` para fijar "Nuestros Productos — Portafolio Técnico" y rechazar "Nuestras Soluciones — Portafolio Técnico".
- [x] 1.6 Ejecutar `npm run test --workspace=apps/web` y confirmar que los tests nuevos fallan por el comportamiento actual (rojo esperado).

## 2. Buscador (SearchForm)

- [x] 2.1 En `apps/web/src/components/SearchForm.astro`, añadir `md:w-[90%] md:max-w-none md:px-0` y `xl:max-w-[760px]` al contenedor interno, conservando `mx-auto`, `w-full`, `max-w-[760px]` y `px-4` en la base móvil.
- [x] 2.2 Verificar que el wrapper `role="search"` sigue full-width y que no se introducen `px-6`/`px-8` ni overflow horizontal.
- [x] 2.3 Re-ejecutar los tests unitarios de SearchForm y el e2e de `search-form` hasta verde.

## 3. Footer (Scroll-to-Top)

- [x] 3.1 En `apps/web/src/components/Footer.astro`, reordenar la barra inferior para que el `<button data-scroll-top>` se renderice antes del `<span>` de "SANTIAGO, CHILE" dentro del mismo grupo flex.
- [x] 3.2 Añadir `sm:pr-24` a la barra inferior para reservar la columna de los FABs, manteniendo `py-6`, `flex-col`, `items-center` y `sm:flex-row`.
- [x] 3.3 Conservar intactos `data-scroll-top`, `aria-label="Volver arriba"`, `bg-primary`, `text-white`, `lucide:arrow-up` y el binding delegado de `createScrollTopButton`.
- [x] 3.4 Re-ejecutar los tests unitarios de Footer y el e2e de no-intersección con FABs hasta verde.

## 4. Servicios (Copy)

- [x] 4.1 Cambiar `SERVICIOS_PORTFOLIO_SECTION.headline` a "Nuestros Productos — Portafolio Técnico" en `apps/web/src/lib/config/services-page.ts` y actualizar el comentario JSDoc de la sección.
- [x] 4.2 Actualizar cualquier literal/docstring de `apps/web/src/lib/types/services-page.ts` y `apps/web/src/components/SolucionPortafolioCard.astro` que mencione "Nuestras Soluciones — Portafolio Técnico".
- [x] 4.3 Re-ejecutar los tests de `services-page`, `servicios` y `ServiciosSectionHeading` hasta verde.

## 5. Validación final

- [x] 5.1 Ejecutar `npx openspec validate --all --strict` y corregir cualquier error de specs/change.
- [x] 5.2 Ejecutar `npm run test --workspace=apps/web`.
- [x] 5.3 Ejecutar `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`.
- [x] 5.4 Revisar que no queden referencias a "Nuestras Soluciones — Portafolio Técnico" en el código de `/servicios`.

## 6. Refinamiento post-apply — tarjetas de terreno en `md+`

- [x] 6.1 Actualizar los artefactos OpenSpec (spec delta de `services-page`, `proposal.md` y `design.md`) con el layout vertical, el orden estricto, la imagen 16:9 y el CTA despejado de los FABs.
- [x] 6.2 Actualizar `apps/web/src/components/__tests__/ServicioTerrenoCard.test.ts` para exigir columna vertical en `md+`, orden cabecera → imagen → cuerpo, imagen a ancho completo 16:9 y CTA con `md:pr-24`; confirmar rojo antes de implementar.
- [x] 6.3 Añadir `apps/web/e2e/field-services.spec.ts` con orden visual, proporción 16:9 y no-intersección CTA/FABs en `768×1024`, `1024×768` y `1280×800`.
- [x] 6.4 Reestructurar `ServicioTerrenoCard.astro` en cabecera/imagen/cuerpo con `flex flex-col` y `order-*`, imagen `w-full md:aspect-video` con `object-cover`, CTA `md:pr-24`; eliminar `imagePosition` de `types/services-page.ts` y `ServiciosTerrenoSection.astro`.
- [x] 6.5 Re-ejecutar tests unitarios y e2e afectados hasta verde; actualizar snapshots si alguno cambia.
- [x] 6.6 Ejecutar `make ci` completo y reportar el resultado.
