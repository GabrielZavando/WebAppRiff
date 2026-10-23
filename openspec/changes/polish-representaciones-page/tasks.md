## 1. Tests (TDD — escribir primero, deben fallar)

- [x] 1.1 Actualizar `apps/web/src/components/__tests__/RepresentacionBrandCard.test.ts` para exigir un `<img>` de `astro:assets` con `alt` de la marca dentro de `data-brand-logo`, y eliminar las aserciones de wordmark de texto.
- [x] 1.2 Actualizar `apps/web/src/components/__tests__/DistribuidorCard.test.ts` para exigir el logo de PIUSI/SENSUS dentro de `data-brand-logo`, conservando badge, título, bullets y garantía.
- [x] 1.3 Actualizar `apps/web/src/lib/config/__tests__/representaciones-page.test.ts` para validar que cada marca y distribuidor expone un `logo` con `src` de asset y que ya no existen campos `wordmark`.
- [x] 1.4 Actualizar `apps/web/src/pages/__tests__/representaciones.test.ts` para verificar siete `<img>` de logo (5 marcas + 2 distribuidores), contenedores `.container`, ausencia de `max-w-[1280px]` y fondos `bg-surface-muted` en las secciones de marcas y propuesta de valor.
- [x] 1.5 Actualizar los tests de `NosotrosTeamSection`, `IndustrialApplications`, `SolutionSection` y `ServiciosPortafolioSection` para esperar `bg-surface-muted` en la superficie de sección.
- [x] 1.6 Agregar una verificación en los tests de layout de que `Layout.astro` declara `bg-surface-muted` en el `body`.
- [x] 1.7 Ejecutar `npm test --workspace @riff/web` y confirmar que los tests nuevos fallan por los motivos esperados antes de implementar.

## 2. Logos reales en `/representaciones`

- [x] 2.1 En `apps/web/src/lib/types/representaciones-page.ts`, reemplazar `WordmarkSegment`/`wordmark` por `logo: ImageMetadata` en `RepresentacionBrand` y `Distribuidor`, y retirar el campo `note` si solo existía para el placeholder.
- [x] 2.2 En `apps/web/src/lib/config/representaciones-page.ts`, importar los siete assets de `@/assets/img/representaciones/` y asignarlos a Apator, RIFF, Nitto Seiko, GL, ILMAP, PIUSI y SENSUS.
- [x] 2.3 En `RepresentacionBrandCard.astro`, importar `Image` de `astro:assets` y renderizar el logo con `widths`, `sizes`, `loading="lazy"`, `object-contain` y `alt` derivado de `title`, dentro del panel `data-brand-logo`.
- [x] 2.4 En `DistribuidorCard.astro`, importar `Image` de `astro:assets` y renderizar el logo de PIUSI/SENSUS con `widths`, `sizes`, `loading="lazy"`, `object-contain` y `alt` derivado del nombre de la marca, dentro de `data-brand-logo`.
- [x] 2.5 Verificar que no se agregaron binarios nuevos y que los siete archivos originales siguen en `apps/web/src/assets/img/representaciones/`.

## 3. Alineación con el `Header`

- [x] 3.1 En `RepresentacionesHero.astro`, reemplazar `mx-auto max-w-[1280px] px-6` por el utility `container` en el contenedor interno del hero.
- [x] 3.2 En `apps/web/src/pages/representaciones.astro`, reemplazar los tres contenedores `mx-auto max-w-[1280px] px-6` de las secciones de marcas, distribuidores y propuesta de valor por `container`.
- [x] 3.3 Confirmar que no quedan usos de `max-w-[1280px]` en `/representaciones` y que las grillas internas conservan sus gaps y columnas.

## 4. Fondo base global `bg-surface-muted`

- [x] 4.1 En `Layout.astro`, agregar `bg-surface-muted` a la lista de clases del `<body>` sin alterar las clases condicionales de hero.
- [x] 4.2 Migrar de `bg-bg` a `bg-surface-muted` la superficie de sección de `SolutionSection.astro`.
- [x] 4.3 Migrar de `bg-bg` a `bg-surface-muted` la superficie de sección de `NosotrosTeamSection.astro`.
- [x] 4.4 Migrar de `bg-bg` a `bg-surface-muted` la Sección 1 de `/servicios` en `ServiciosPortafolioSection.astro` y actualizar el comentario de transición de `ServicesSection.astro`.
- [x] 4.5 Migrar de `bg-bg` a `bg-surface-muted` el fondo de `IndustrialApplications.astro`.
- [x] 4.6 Migrar de `bg-bg` a `bg-surface-muted` el `<main>` de `apps/web/src/pages/cotizacion.astro`.
- [x] 4.7 Migrar de `bg-bg` a `bg-surface-muted` las dos secciones de `apps/web/src/pages/productos/[slug].astro`.
- [x] 4.8 Migrar de `bg-bg` a `bg-surface-muted` las secciones de marcas y propuesta de valor de `apps/web/src/pages/representaciones.astro`.
- [x] 4.9 Revisar que todos los `bg-bg` restantes sean mats/controles anidados (tarjetas, badges, inputs, chips) y que las tarjetas/paneles/formularios de contenido sigan en `bg-white`.
- [x] 4.10 Actualizar la tabla/rol semántico de `bg-surface-muted` y `bg-bg` en `docs/design/style-guide/README.md` si la documentación actual no refleja el nuevo uso como fondo base.

## 5. Verificación final

- [x] 5.1 Ejecutar `make lint` y corregir cualquier infracción de estilo o tokens.
- [x] 5.2 Ejecutar `make typecheck` y confirmar que los tipos `ImageMetadata` y los props de los componentes compilan sin `any`.
- [x] 5.3 Ejecutar `make test` y confirmar que toda la suite web (incluidos los tests actualizados) pasa.
- [x] 5.4 Ejecutar `npx openspec validate --all --strict` y confirmar que el change valida sin errores.
- [x] 5.5 Ejecutar `make ci` como gate completo antes de archivar el change.
