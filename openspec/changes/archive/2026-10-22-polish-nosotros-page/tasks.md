## 1. Tests primero (TDD)

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/NosotrosHero.test.ts`: el hero debe usar `bg-secondary` + la utility de rejilla compartida (`aria-hidden="true"`) y NO debe renderizar el degradado `from-secondary via-bg to-secondary` ni el `<svg>` inline ad-hoc; ejecutar el test y confirmar que falla antes de tocar el componente.
- [x] 1.2 Actualizar `apps/web/src/components/__tests__/NosotrosTimeline.test.ts`: eliminar la expectativa de existencia de la línea central y añadir aserciones de que NO existe ningún contenedor de línea vertical; verificar que los cuatro marcadores 01–04 comparten `bg-primary-deep` y que la estrella conserva `bg-accent` con `aria-hidden="true"`; confirmar el fallo inicial.
- [x] 1.3 Actualizar `apps/web/src/pages/__tests__/nosotros.test.ts`: el `<main>` debe declarar `bg-bg`, las secciones claras (`#historia`, propuesta de valor, identidad y equipo) deben usar `bg-bg` como fondo de sección y las tarjetas de contenido deben conservar `bg-white`; confirmar el fallo inicial.
- [x] 1.4 Revisar los tests de `RepresentacionesHero` y ejecutarlos para fijar la línea base antes de extraer la rejilla compartida.

## 2. Utility de rejilla compartida

- [x] 2.1 Extraer el patrón técnico de `RepresentacionesHero.astro` a `apps/web/src/styles/globals.css` como utility global (`.technical-grid`) con los dos `repeating-linear-gradient` y `color-mix(in srgb, var(--color-primary) 50%, transparent)`, sin hex literales.
- [x] 2.2 Actualizar `apps/web/src/components/RepresentacionesHero.astro` para consumir `.technical-grid` y eliminar su `<style>` scoped con `.rep-grid`, verificando que el markup y el aspecto se mantienen.

## 3. Hero de `/nosotros`

- [x] 3.1 En `apps/web/src/components/NosotrosHero.astro`, eliminar el div de degradado `from-secondary via-bg to-secondary` y el bloque SVG de rejilla.
- [x] 3.2 Añadir al hero un contenedor decorativo `aria-hidden="true"` con la utility `.technical-grid` y opacidad equivalente a `/representaciones` (`opacity-10`), manteniendo `bg-secondary`, el copy, los CTAs y la imagen sin cambios.

## 4. Timeline de `/nosotros`

- [x] 4.1 En `apps/web/src/components/NosotrosTimeline.astro`, unificar el fondo de los cuatro marcadores numéricos en `bg-primary-deep text-white`, eliminando la rama alterna `border border-border bg-bg text-text`.
- [x] 4.2 Eliminar del DOM el `<div>` absoluto que dibuja la línea vertical central (`left-1/2 ... bg-border/40`), sin reemplazarlo por otro separador.
- [x] 4.3 Confirmar que el marcador de estrella del último hito conserva `bg-accent text-white`, su icono Lucide y `aria-hidden="true"`, y que ya no queda ninguna línea que lo atraviese.

## 5. Fondo global de la página

- [x] 5.1 En `apps/web/src/pages/nosotros.astro`, añadir `bg-bg` al `<main aria-label="Contenido de Nosotros">`.
- [x] 5.2 En `apps/web/src/components/NosotrosValueProp.astro`, cambiar la `<section>` de `bg-white` a `bg-bg` y las tarjetas de pilar de `bg-bg` a `bg-white`, conservando su hover y sus sombras.
- [x] 5.3 En `apps/web/src/components/NosotrosTeamGrid.astro`, cambiar la `<section>` de `bg-white` a `bg-bg`, las tarjetas de `bg-bg` a `bg-white` y el badge del encabezado de `bg-bg` a `bg-white`.
- [x] 5.4 Verificar que `NosotrosTimeline` y `NosotrosIdentity` ya usan `bg-bg` y que `NosotrosClients` conserva `bg-secondary`.

## 6. Verificación

- [x] 6.1 Ejecutar los tests web afectados (`npm run test --workspace=apps/web -- NosotrosHero NosotrosTimeline nosotros`) y confirmar que pasan.
- [x] 6.2 Ejecutar `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`.
- [x] 6.3 Ejecutar `npx openspec validate --all --strict`.
- [x] 6.4 Ejecutar el gate completo `make ci` y confirmar que pasa.
- [x] 6.5 Revisar visualmente `/nosotros` y `/representaciones` en viewport móvil y escritorio: mismo patrón de hero, timeline sin línea central, fondo grisáceo con tarjetas blancas y sin scroll horizontal.

## 7. Corrección post-apply — contraste del fondo

- [x] 7.1 Actualizar `apps/web/src/styles/__tests__/tokens.test.ts` para esperar `--color-surface-muted: #E9EEF3` y `apps/web/src/pages/__tests__/nosotros.test.ts` para esperar `bg-surface-muted` en `<main>` y en las cuatro secciones claras; confirmar el fallo inicial.
- [x] 7.2 Declarar `--color-surface-muted: #E9EEF3` en `apps/web/src/styles/globals.css` y en `apps/admin/src/styles/globals.css`, y añadir la fila a la tabla de neutros de `docs/design/style-guide/README.md`.
- [x] 7.3 Aplicar `bg-surface-muted` al `<main>`, `NosotrosTimeline`, `NosotrosIdentity`, `NosotrosValueProp` y `NosotrosTeamGrid`, manteniendo las tarjetas de contenido en `bg-white`.
- [x] 7.4 Ejecutar los tests web afectados, `npm run lint --workspace=apps/web` y `npm run typecheck --workspace=apps/web`.
- [x] 7.5 Ejecutar `npx openspec validate --all --strict` y `make ci`.
- [x] 7.6 Revisar visualmente en desktop y móvil que el fondo grisáceo se distingue de las tarjetas blancas y que no hay scroll horizontal.
