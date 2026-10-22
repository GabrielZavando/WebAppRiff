## Context

`/nosotros` se compone de seis secciones presentacionales (`NosotrosHero`, `NosotrosTimeline`, `NosotrosValueProp`, `NosotrosIdentity`, `NosotrosTeamGrid`, `NosotrosClients`) alimentadas por `NOSOTROS_PAGE_CONTENT`. El hero usa hoy un degradado `from-secondary via-bg to-secondary` con opacidad 90 % y una rejilla SVG sólo de escritorio; `/representaciones` usa en cambio `bg-secondary` con la clase `rep-grid` (rejilla CSS basada en `color-mix` sobre `--color-primary`). La timeline alterna el fondo de sus marcadores (pares `bg-primary-deep`, impares `bg-bg` con borde) y dibuja una línea vertical central absoluta. Las secciones de propuesta de valor y equipo usan `bg-white` como fondo, por lo que sus tarjetas no se distinguen del fondo de página.

## Goals / Non-Goals

**Goals:**

- Que el hero de `/nosotros` comparta color y patrón técnico con el de `/representaciones` sin duplicar CSS.
- Que los cuatro marcadores numéricos de la timeline tengan un único fondo y que desaparezca la línea vertical central (incluida la que cruzaría la estrella).
- Que el fondo base de las secciones claras de `/nosotros` sea `bg-surface-muted` y que las tarjetas de contenido queden en `bg-white`.
- Mantener intactos copy, rutas, jerarquía de encabezados, accesibilidad, responsive y flat design.

**Non-Goals:**

- No se rediseña el contenido ni el layout de ninguna sección.
- No se crean tokens nuevos ni se modifica `openspec/specs/design-tokens/spec.md`.
- No se toca la banda oscura de clientes ni el footer/header compartidos.
- No se corrige la sección `NosotrosTeamSection` (no se renderiza en esta página).

## Decisions

### D1. Extraer el patrón de rejilla a una utility global compartida

La rejilla de `/representaciones` vive en un `<style>` scoped de `RepresentacionesHero.astro` (clase `.rep-grid`). Para garantizar que `/nosotros` use **exactamente** el mismo patrón, se mueve la regla a `apps/web/src/styles/globals.css` como utility global (p. ej. `.technical-grid` con los dos `repeating-linear-gradient` y `color-mix(in srgb, var(--color-primary) 50%, transparent)`), y ambos heroes la consumen. Alternativas descartadas: duplicar el bloque CSS en `NosotrosHero` (riesgo de divergencia futura) y usar un SVG inline (ya es el patrón que se quiere abandonar).

### D2. Hero de `/nosotros` = `bg-secondary` + rejilla compartida

Se elimina el div de degradado `from-secondary via-bg to-secondary` y el bloque SVG ad-hoc. `NosotrosHero` queda con `section.bg-secondary` y un `<div aria-hidden="true">` con la utility de rejilla (opacidad ~10 %, igual que `/representaciones`). El contenido, CTAs e imagen no cambian.

### D3. Marcador numérico único

Los cuatro marcadores 01–04 usan `bg-primary-deep text-white` (el tono que ya usaban los pares), eliminando la rama impar `border border-border bg-bg text-text`. Se documenta como supuesto: el usuario no especificó el color exacto, y `bg-primary-deep` es el tono de marca ya presente en los marcadores y en el resto de la timeline.

### D4. Eliminar la línea central, no sólo ocultarla

Se elimina del DOM el `<div class="absolute left-1/2 ... bg-border/40">`. Con ello desaparece también la línea que atravesaba la estrella del hito 2024. La estrella conserva su contenedor `bg-accent text-white` y su icono Lucide. No se reemplaza por otro separador.

### D5. Fondo de página `bg-surface-muted` y tarjetas `bg-white`

- Nuevo token neutro `--color-surface-muted: #E9EEF3` en `apps/web/src/styles/globals.css` y en su espejo `apps/admin/src/styles/globals.css`, documentado en `docs/design/style-guide/README.md`. Se elige un gris más profundo que `--color-bg` (#F6F8FA) para que el contraste con las tarjetas blancas sea perceptible sin dejar de ser sutil.
- `apps/web/src/pages/nosotros.astro`: `<main>` recibe `bg-surface-muted`.
- `NosotrosTimeline` y `NosotrosIdentity` pasan de `bg-bg` a `bg-surface-muted`.
- `NosotrosValueProp`: la `<section>` pasa de `bg-white` a `bg-surface-muted`; las tarjetas de pilar pasan de `bg-bg` a `bg-white` para conservar contraste; las tarjetas de sector ya son `bg-white`.
- `NosotrosTeamGrid`: la `<section>` pasa de `bg-white` a `bg-surface-muted`; las tarjetas pasan de `bg-bg` a `bg-white`; el badge del encabezado pasa de `bg-bg` a `bg-white`.
- `NosotrosClients` conserva `bg-secondary` (banda oscura de marca).

### D6. TDD: actualizar los contratos de test antes del código

Se actualizan primero los tests existentes que hoy fijan el comportamiento contrario:

- `NosotrosHero.test.ts`: la rejilla deja de ser un `<svg>` y pasa a ser un contenedor con la utility compartida; se elimina la expectativa del degradado/SVG y se añade la del patrón compartido.
- `NosotrosTimeline.test.ts`: se invierte la expectativa de la línea central (ya no debe existir) y se añade la uniformidad de los cuatro marcadores.
- `nosotros.test.ts`: se añade la verificación de que el `<main>` y las secciones claras usan `bg-surface-muted` y las tarjetas `bg-white`.
- `tokens.test.ts`: se añade `--color-surface-muted` a la lista de neutros esperados en `@theme` (web y espejo admin).

## Risks / Trade-offs

- **La utility global afecta a `/representaciones`** → el cambio es sólo de ubicación de la regla; se mantiene el mismo nombre de clase o se actualiza el consumidor, y los tests/smoke de `/representaciones` deben seguir pasando.
- **Cambiar el fondo de las tarjetas de pilar/equipo puede alterar el hover** → se conserva el hover existente (`hover:bg-primary-100` / `hover:shadow-2`) y se revisa visualmente que el contraste siga siendo correcto.
- **La timeline sin línea central puede perder lectura de continuidad** → se mantiene el orden cronológico, la numeración 01–04 y el espaciado vertical; el requisito de responsive y jerarquía no cambia.
- **Tests acoplados a markup** → las nuevas aserciones se hacen sobre clases/tokens y presencia/ausencia de elementos, no sobre snapshots.

## Migration Plan

No aplica migración de datos. Despliegue normal del sitio estático; rollback = revertir el commit del change.

## Open Questions

- Ninguna bloqueante. Supuesto registrado en D3: el color unificado de los marcadores es `bg-primary-deep`.
