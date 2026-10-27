# Tasks

## 1. Preparación y pruebas rojas

- [x] 1.1 Verificar que `apps/web/src/assets/img/logo-web.png` existe y mide 1080×542; no modificarlo, moverlo ni sobrescribirlo.
- [x] 1.2 Añadir `apps/web/src/components/__tests__/PhoneFab.test.ts` con casos fallidos: `href="tel:+56229079067"` desde `phone`, normalización de espacios, ausencia de número hardcodeado, `fixed bottom-24 right-6 z-20`, `h-14 w-14`, `bg-accent`, `text-white`, `lucide:phone h-7 w-7`, `aria-label="Llamar a Riff"`, `aria-hidden`, pulso infinito, `prefers-reduced-motion` y render vacío sin teléfono.
- [x] 1.3 Extender `apps/web/src/components/__tests__/WhatsAppButton.test.ts` con un caso fallido que exija `text-white` en el icono `simple-icons:whatsapp`.
- [x] 1.4 Actualizar los tests de Header (`Header.test.ts`) para exigir `logo-web.png`, `width=330`, `height=166` y los topes `max-w-[160px] sm:max-w-[240px]`.
- [x] 1.5 Actualizar los tests de Footer (`Footer.test.ts`) y `lib/types/__tests__/footer.test.ts` para exigir `logo-web.png`, `width=165`, `height=83` y `SocialLink` importado desde `lib/types/contact`.
- [x] 1.6 Actualizar `Layout.test.ts`, `HomeOrder.test.ts`, `pages/__tests__/index.test.ts` y `pages/__tests__/representaciones.test.ts` para exigir un único `<header>`, ausencia de `aria-label="Barra de contacto"`, presencia de `PhoneFab` y el orden DOM sin `TopHeader`.
- [x] 1.7 Añadir `apps/web/e2e/phone-fab.spec.ts` con: enlace `tel:`, posición sobre WhatsApp, etiqueta accesible, visibilidad en home y `/representaciones`.
- [x] 1.8 Ajustar `apps/web/e2e/site-header.spec.ts`, `site-header-scroll.spec.ts`, `hero-banner.spec.ts` y `search-form.spec.ts` para el orden DOM sin `TopHeader` y para el logo PNG.
- [x] 1.9 Ejecutar los tests nuevos/actualizados y confirmar que fallan por la implementación ausente, no por errores de sintaxis.

## 2. Tipos de contacto

- [x] 2.1 Crear `apps/web/src/lib/types/contact.ts` con `SocialNetworkName`, `SocialLink`, `ContactInfo` y `getSocialLinks()` movidos desde `lib/types/top-header.ts`.
- [x] 2.2 Actualizar imports en `lib/config/contact.ts`, `lib/config/footer.ts`, `lib/types/footer.ts`, `lib/types/contact-form.ts`, `ContactBar.astro`, `Footer.astro` y sus tests.
- [x] 2.3 Eliminar `apps/web/src/lib/types/top-header.ts` y verificar que no quedan imports.
- [x] 2.4 Ejecutar `npm run test --workspace=apps/web -- contact` y `npm run typecheck --workspace=apps/web`.

## 3. Retirar TopHeader e integrar PhoneFab

- [x] 3.1 Crear `apps/web/src/components/PhoneFab.astro` con el contrato de `phone-fab`: normalización `tel:`, `fixed bottom-24 right-6 z-20 h-14 w-14 bg-accent text-white hover:bg-accent-dark`, `lucide:phone h-7 w-7`, `aria-label="Llamar a Riff"`, foco visible, pulso CSS de 2 s y `prefers-reduced-motion`.
- [x] 3.2 Integrar `<PhoneFab phone={contact.phone} />` una sola vez en `Layout.astro`, fuera del stack sticky y antes/después de `WhatsAppButton` de forma estable.
- [x] 3.3 Quitar el import y el render de `<TopHeader />` en `Layout.astro`.
- [x] 3.4 Eliminar `apps/web/src/components/TopHeader.astro`, `components/__tests__/TopHeader.test.ts`, `components/__tests__/__snapshots__/TopHeader.test.ts.snap` y `e2e/top-header.spec.ts`.
- [x] 3.5 Confirmar que `grep -R "TopHeader" apps/web/src apps/web/e2e` no devuelve referencias de runtime ni tests.
- [x] 3.6 Ejecutar `PhoneFab.test.ts` y `Layout.test.ts` en verde.

## 4. WhatsApp e logo

- [x] 4.1 Añadir `text-white` al `<Icon name="simple-icons:whatsapp">` sin tocar href, talla, posición ni animación.
- [x] 4.2 En `Header.astro`, cambiar el import a `logo-web.png`, usar `<Image width={330} height={166}>`, `max-w-[160px] sm:max-w-[240px]` y conservar `loading="eager"`, `logoAlt`, `overflow-visible` y `pb-10 lg:pb-4`.
- [x] 4.3 En `Footer.astro`, cambiar el import a `logo-web.png` y usar `<Image width={165} height={83}>` con `loading="lazy"`.
- [x] 4.4 Actualizar los comentarios y el ratio documentado en `apps/web/src/styles/header-scroll.css` (asset 1080×542; compacto 100 px de alto ≈199 px de ancho); no cambiar la lógica de scroll.
- [x] 4.5 Confirmar que `grep -R "logo-web.webp" apps/web/src` no devuelve referencias.
- [x] 4.6 Ejecutar `Header.test.ts`, `Footer.test.ts` y `WhatsAppButton.test.ts`; regenerar snapshots de Header/Footer solo tras validar el render.

## 5. Specs, snapshots y E2E

- [x] 5.1 Actualizar `ContactBar.test.ts` y `contacto.test.ts` para el tipo neutral y la ausencia de `TopHeader`.
- [x] 5.2 Actualizar `tokens.test.ts`, `icon-catalog.test.ts` y `no-brand-classes.test.ts` para el logo PNG, el icono blanco y la lista de componentes base sin `TopHeader`.
- [x] 5.3 Revisar y actualizar `SearchForm.test.ts`, `HeroBanner.test.ts`, `PanelHome.test.ts`, `SolutionSection.test.ts`, `ServicesSection.test.ts` y `HomeOrder.test.ts` por el orden DOM sin `TopHeader`.
- [x] 5.4 Ejecutar `npm run test --workspace=apps/web` y actualizar snapshots con `vitest -u` solo para los cambios esperados.
- [x] 5.5 Ejecutar `npm run test:smoke --workspace=apps/web` con el stub API y corregir las aserciones de orden DOM/logo.
- [x] 5.6 Ejecutar `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`.

## 6. Validación final

- [x] 6.1 Ejecutar `./node_modules/.bin/openspec validate ui-chrome-remove-top-header-phone-fab --strict`.
- [x] 6.2 Ejecutar `./node_modules/.bin/openspec validate --all --strict`.
- [x] 6.3 Ejecutar `make ci` o, si no está disponible, los targets equivalentes de lint, typecheck, test y audit.
- [x] 6.4 Verificar visualmente en `npm run dev --workspace=apps/web`: logo sin distorsión en Header/Footer, FAB de teléfono 16 px sobre WhatsApp, icono de WhatsApp blanco y ausencia de la barra superior.
- [x] 6.5 Asegurar que `logo-web.png` queda incluido en el commit (hoy está sin trackear) sin borrar `logo-web.webp`; no commitear hasta que el usuario lo pida.
- [x] 6.6 Archivar el change para eliminar `openspec/specs/top-header/` y consolidar los deltas.
