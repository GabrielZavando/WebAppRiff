## Why

El home del catálogo digital de Riff termina actualmente con la sección de productos destacados, sin un cierre institucional. El cliente quiere una sección de "pilares de excelencia" que comunique su propuesta de valor (sostenibilidad, cumplimiento de plazos, tecnología y soporte técnico) junto con un llamado a conversar sobre proyectos. El mockup entregado (`docs/design/components/PilaresSection.png`) muestra un diseño de dos columnas full-bleed con fondos fotográficos y overlays oscuros — un patrón visual nuevo en el sitio.

## What Changes

- Nuevo componente dumb `PilaresSection.astro` con layout de dos columnas 50/50 full-bleed (sin container centrado)
- Columna izquierda (fondo `sostenibilidad-edificios.jpg` + overlay oscuro): eyebrow accent, `<h2>` headline, descripción, CTA accent "HABLEMOS DE TU PROYECTO" → `/contacto`
- Columna derecha (fondo `planta-tratamiento-ecologica.webp` + overlay oscuro): `<h3>` "Nuestros Pilares de Excelencia", descripción, lista de 4 pilares con iconos Lucide
- Nuevo tipo `PilarIconName` (closed union: `'recycle' | 'clock' | 'monitor' | 'headphones'`) siguiendo el patrón `SolutionIconName`
- Config hardcodeada `PILARES_SECTION_CONTENT` en `lib/config/pilares-section.ts`
- Integración en `index.astro` como última sección del home (después de `DestacadosSection`)
- 2 assets nuevos: `sostenibilidad-edificios.jpg` y `planta-tratamiento-ecologica.webp`
- E2E existentes actualizados: outline de la home pasa de 1/2/3/12 a 1/3/4/12

## Capabilities

### New Capabilities
- `pilares-section`: Sección de pilares de excelencia del home — layout dos columnas full-bleed con background images, overlays oscuros (`bg-secondary-dark/80`), eyebrow + headline + descripción + CTA en la columna izquierda, headline + descripción + lista de pilares con iconos Lucide en la derecha. Contenido hardcodeado en config, componente dumb presentacional.

### Modified Capabilities
- (ninguna — capability nueva; los e2e de `solution-section`/`services-section` se actualizan como parte del impacto del outline, pero no cambian requirements de esas capabilities)

## Impact

- **Frontend (apps/web)**:
  - Nuevo: `src/components/PilaresSection.astro`, `src/lib/types/pilares-section.ts`, `src/lib/config/pilares-section.ts` + sus tests
  - Modificado: `src/pages/index.astro` (integración), `e2e/solution-section.spec.ts` y `e2e/services-section.spec.ts` (outline counts)
  - Nuevos assets: `src/assets/img/sostenibilidad-edificios.jpg`, `src/assets/img/planta-tratamiento-ecologica.webp`
- **Home page outline**: 1 h1, 2 h2, 3 h3, 12 h4 → 1 h1, 3 h2, 4 h3, 12 h4 (PilaresSection añade un `<h2>` en la columna izquierda y un `<h3>` en la derecha)
- **OpenSpec**: change `pilares-section` (proposal, design, spec, tasks) → se archivará al completar
- **Sin impacto en API** (`docs/api-spec.yml`) ni en data model (`docs/data-model.md`)
- **Sin nuevas dependencias**: `astro-icon` (Lucide) y `astro:assets` (sharp) ya están en el proyecto