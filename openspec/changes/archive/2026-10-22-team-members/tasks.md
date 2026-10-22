## 1. Roster compartido (datos y tipos)

- [x] 1.1 Escribir los tests fallidos de `src/lib/config/__tests__/team.test.ts`: 8 integrantes en orden canónico, ids únicos, cargos y descripciones exactos, exactamente 3 destacados (Ruby, Felipe, Patricio), mapeo de archivos de imagen y `imageAlt` no vacíos.
- [x] 1.2 Escribir los tests fallidos de tipos de `src/lib/types/__tests__/team.test.ts`: `TeamMember` readonly con `id`, `name`, `role` (string), `description`, `image` (`ImageMetadata`), `imageAlt` e `isFeatured` (boolean), sin `any`.
- [x] 1.3 Crear `src/lib/types/team.ts` con la interfaz `TeamMember`.
- [x] 1.4 Crear `src/lib/config/team.ts` con los imports de las 8 fotos de `@/assets/img/nosotros/`, `TEAM_MEMBERS` y `FEATURED_TEAM_MEMBERS` derivado por `isFeatured`.
- [x] 1.5 Ejecutar los tests de roster y tipos; corregir hasta que pasen.

## 2. Configuración y tipos de la Home

- [x] 2.1 Actualizar los tests de `src/lib/config/__tests__/nosotros-team-section.test.ts` y `src/lib/types/__tests__/nosotros-team-section.test.ts`: `members` es `FEATURED_TEAM_MEMBERS`, los 3 nombres reales, cargos como texto visible y descripciones presentes; eliminar expectativas de `TeamMemberRole`, `getTeamMemberRoleLabel` y `f-1.jpg`…`f-3.jpg`.
- [x] 2.2 Modificar `src/lib/types/nosotros-team-section.ts` para importar y usar el `TeamMember` compartido; eliminar `TeamMemberRole` y los campos duplicados.
- [x] 2.3 Modificar `src/lib/config/nosotros-team-section.ts` para importar `FEATURED_TEAM_MEMBERS` y asignarlo a `members`; eliminar `TEAM_MEMBERS` local, `getTeamMemberRoleLabel` y los literales de integrantes.
- [x] 2.4 Ejecutar los tests de config/tipos de la Home; corregir hasta que pasen.

## 3. Componente de equipo de la Home

- [x] 3.1 Actualizar los tests de `NosotrosTeamSection.test.ts` y su helper: 3 tarjetas con Ruby, Felipe y Patricio; `member.role` renderizado directo; descripción completa dentro del overlay con `font-body text-xs leading-relaxed text-white/90`; sin truncation; imágenes reales con `alt`.
- [x] 3.2 Modificar `src/components/NosotrosTeamSection.astro`: renderizar `member.role` sin helper y añadir `<p>` con `member.description` bajo el cargo dentro del overlay.
- [x] 3.3 Verificar que el overlay, el hover grayscale → color, el `scale3d`, el offset de la tarjeta central y el bloque `prefers-reduced-motion` permanecen sin cambios.
- [x] 3.4 Ejecutar los tests del componente de la Home; corregir hasta que pasen.

## 4. Configuración y tipos de `/nosotros`

- [x] 4.1 Actualizar los tests de `src/lib/config/__tests__/nosotros-page.test.ts` y `src/lib/types/__tests__/nosotros-page.test.ts`: `team.members` es `TEAM_MEMBERS` (8), sin `area`, `areaTone`, `footerLabel` ni `footerIcon`, y con descripciones.
- [x] 4.2 Modificar `src/lib/types/nosotros-page.ts`: importar el `TeamMember` compartido, eliminar `TeamAreaTone` y la interfaz local `TeamMember`, y actualizar `NosotrosTeamGridProps`.
- [x] 4.3 Modificar `src/lib/config/nosotros-page.ts`: reemplazar los 4 literales de `team.members` por `TEAM_MEMBERS`; conservar header, subtítulo y badge de la sección.
- [x] 4.4 Ejecutar los tests de config/tipos de `/nosotros`; corregir hasta que pasen.

## 5. Componente de equipo de `/nosotros`

- [x] 5.1 Actualizar `NosotrosTeamGrid.test.ts`: 8 tarjetas, nombres/cargos en orden, descripciones, sin badge de área ni pie, foto `aspect-[3/4]`, header y badge conservados, grid `1 -> 2 -> 4`.
- [x] 5.2 Modificar `src/components/NosotrosTeamGrid.astro`: eliminar `AREA_TONES`, el badge de área y el pie con icono; renderizar `member.role` directo; añadir la descripción; cambiar la foto a `aspect-[3/4]`.
- [x] 5.3 Actualizar `src/pages/__tests__/nosotros.test.ts` si alguna aserción depende del equipo ficticio o de los pies de tarjeta.
- [x] 5.4 Ejecutar los tests del componente y de la página; corregir hasta que pasen.

## 6. Assets y limpieza

- [x] 6.1 Verificar que las 8 fotos de `src/assets/img/nosotros/` están versionadas en git y que cada import apunta al archivo correcto.
- [x] 6.2 Verificar que `f-1.jpg`, `f-2.jpg` y `f-3.jpg` ya no se usan; eliminarlos si no tienen otros consumidores.
- [x] 6.3 Construir `apps/web` y confirmar que `astro:assets` genera las imágenes en WebP (o el formato configurado) sin errores.

## 7. Validación estricta

- [x] 7.1 Ejecutar `npx openspec validate --all --strict` y corregir cualquier error.
- [x] 7.2 Ejecutar `make lint`, `make test` y `make typecheck`; corregir hasta que pasen.
- [x] 7.3 Verificar visualmente Home y `/nosotros`: 3 vs 8 tarjetas, descripciones legibles, fotos 3:4, sin recortes raros, sin desborde horizontal y hover/reduced motion correctos.
- [x] 7.4 Ejecutar `make ci` como gate final antes de archivar.

## 8. Fix post-apply: fotos a color en `/nosotros`

- [x] 8.1 Actualizar spec y design para exigir las fotos del equipo de `/nosotros` en color natural, sin `grayscale`.
- [x] 8.2 Añadir el test del componente que falla si la foto declara `grayscale`.
- [x] 8.3 Quitar la clase `grayscale` de la foto en `src/components/NosotrosTeamGrid.astro` y verificar el test.
