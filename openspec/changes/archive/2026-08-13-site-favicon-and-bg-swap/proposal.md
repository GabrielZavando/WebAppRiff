## Why

Dos ajustes solicitados por el cliente sobre el sitio público Astro (`apps/web`):

1. El sitio debe mostrar un favicon con la marca real (`logo_riff.png`) en lugar del placeholder SVG actual. El archivo ya está disponible pero Astro no lo inyecta automáticamente porque no se llama `favicon.ico`/`favicon.svg` (los nombres auto-detectados por Astro 7); hace falta una etiqueta `<link rel="icon">` explícita en el `<head>` del `Layout.astro`.

2. En el home, el cliente quiere invertir los colores de fondo de dos secciones hermanas para invertir la jerarquía visual: `ServicesSection` debe pasar a usar el verde azulado profundo (`bg-primary-deep`, `#006874`) y `DestacadosSection` debe pasar a usar el azul marino oscuro (`bg-secondary-dark`, `#16202E`). Ambos tokens ya existen en `apps/web/src/styles/globals.css`.

## What Changes

- **Favicon**: añadir el archivo `apps/web/public/logo_riff.png` (entregado por el cliente) y registrarlo en `apps/web/src/layouts/Layout.astro` con una etiqueta explícita `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />` en el `<head>`. La SVG placeholder actual (`favicon.svg`) se conserva para compatibilidad con navegadores que aún consulten `/favicon.svg`, pero Astro priorizará el PNG al detectar la etiqueta `<link rel="icon">` explícita.
- **ServicesSection**: cambiar la clase del `<section>` raíz de `bg-secondary-dark` a `bg-primary-deep` (1 línea de markup + 1 línea en el bloque de comentarios descriptivos).
- **DestacadosSection**: cambiar la clase del `<section>` raíz de `bg-primary-deep` a `bg-secondary-dark` (1 línea de markup + 1 línea en el bloque de comentarios descriptivos).
- **Tests**: actualizar las aserciones de fondo en `ServicesSection.test.ts` y `DestacadosSection.test.ts` para reflejar el intercambio, y regenerar los snapshots de Vitest.
- **Specs**: la spec `image-assets` debe admitir la nueva excepción del favicon PNG en `public/` (justificada por requisito técnico: los navegadores consultan `/favicon.ico`/`/favicon.png` directamente en la raíz del sitio, no se puede servir desde `src/assets/img/`). Las specs `services-section` y `destacados-section` deben actualizar sus requisitos de color de fondo (clases intercambiadas).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `image-assets`: modificar el requisito "The Open Graph image is the only public/ asset exception" para añadir una segunda excepción técnica — el favicon personalizado (`logo_riff.png`) puede vivir en `apps/web/public/` porque los navegadores lo resuelven directamente contra la raíz del sitio y no se beneficia del pipeline `astro:assets`. Se actualiza el escenario correspondiente.
- `services-section`: modificar el requisito "ServicesSection renders as a flat dark section with vertical padding" para sustituir el token de fondo `bg-secondary-dark` por `bg-primary-deep`. Se actualiza el escenario "Section uses the dark navy background token" para reflejar el nuevo color (verde azulado profundo en lugar de azul marino oscuro).
- `destacados-section`: modificar el requisito "DestacadosSection renders as a flat dark teal section with vertical padding" para sustituir el token de fondo `bg-primary-deep` por `bg-secondary-dark`. Se actualiza el escenario "Section uses the deep teal background token" para reflejar el nuevo color (azul marino oscuro en lugar de verde azulado profundo). También se actualiza la frase de transición de color del requisito (ServicesSection arriba ya no es `bg-bg`; es `bg-primary-deep` después del swap).

## Impact

- Archivos afectados:
  - `apps/web/public/logo_riff.png` (nuevo, entregado por el cliente)
  - `apps/web/src/layouts/Layout.astro` (1 nueva línea `<link rel="icon">` en el `<head>`)
  - `apps/web/src/components/ServicesSection.astro` (cambio de clase `bg-secondary-dark` → `bg-primary-deep` + actualización de comentario)
  - `apps/web/src/components/DestacadosSection.astro` (cambio de clase `bg-primary-deep` → `bg-secondary-dark` + actualización de comentario)
- Tests afectados (TDD — deben actualizarse antes de codear):
  - `apps/web/src/components/__tests__/ServicesSection.test.ts` (líneas 31-36: aserción y descripción de fondo)
  - `apps/web/src/components/__tests__/DestacadosSection.test.ts` (líneas 31-37: aserción y descripción de fondo)
  - Snapshots: `ServicesSection.test.ts.snap`, `DestacadosSection.test.ts.snap` (regenerar con `vitest -u` después del cambio de markup)
- Specs afectados:
  - `openspec/specs/services-section/spec.md` (requisito + escenario de color de fondo)
  - `openspec/specs/destacados-section/spec.md` (requisito + escenario de color de fondo, frase de transición)
  - `openspec/specs/image-assets/spec.md` (excepción para `logo_riff.png` en `public/`)
- No hay cambios en API, modelo de datos, ni dependencias.
- No hay cambios en el color real del DOM fuera del home page (ambos tokens ya existían).
- No se requieren migraciones ni rebuilds especiales.
