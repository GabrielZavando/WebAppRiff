## Context

La página de inicio (`/`) presenta problemas de UX en el breakpoint base (< 640px):
- El subtítulo del Hero Banner es demasiado grande, empuja los CTAs fuera del viewport inicial.
- El párrafo descriptivo del Hero Banner oculta los botones CTA sin scroll.
- Las imágenes de tarjetas en ServicesSection y DestacadosSection usan `aspect-square` (1:1), pero el diseño requiere 5:4.
- En NosotrosTeamSection, las tarjetas muestran la descripción completa en móviles, creando tarjetas muy altas y desbalanceadas.

## Goals / Non-Goals

**Goals:**
- Reducir el tamaño del subtítulo del Hero Banner solo en móviles.
- Ocultar el párrafo descriptivo del Hero Banner solo en móviles (visible desde `sm:`).
- Cambiar aspect ratio de imágenes en ServicesSection y DestacadosSection a 5:4 en todos los breakpoints.
- En NosotrosTeamSection, ocultar la descripción larga en móviles (mostrar solo Nombre + Cargo).

**Non-Goals:**
- Cambiar el diseño en breakpoints `sm:` (>= 640px) en adelante.
- Modificar la lógica de negocio, props o tipos.
- Afectar otras páginas o componentes no listados.

## Decisions

### 1. HeroBanner.astro — Headline, Subtitle y Description
- **Headline (h1)**: Cambiar `text-4xl sm:text-5xl md:text-7xl` → `text-3xl sm:text-4xl md:text-6xl` (reducción en todos los breakpoints, POST-APPLY ajuste pedido por el cliente).
- **Subtitle (h2)**: Cambiar `text-xl md:text-2xl` → `text-base md:text-lg lg:text-xl` (POST-APPLY ajuste: el subtítulo debía quedar "un poco más pequeño" también en tablet y desktop, no solo en móvil).
- **Description (p)**: Agregar `hidden sm:block` para ocultar en base y mostrar desde `sm:` (640px).
- Rationale: Mínimo cambio en clases Tailwind existentes; preserva jerarquía tipográfica y responsive.

### 2. ServicesSection.astro — Imágenes 5:4
- **Ubicación**: Línea 79, clase `aspect-square` → `aspect-[5/4]`.
- **Rationale**: `aspect-[5/4]` es nativo en Tailwind v4 con arbitrary values; funciona en todos los breakpoints sin media queries adicionales.

### 3. DestacadosSection.astro — Imágenes 5:4
- **Ubicación**: Línea 74, clase `aspect-square` → `aspect-[5/4]`.
- **Rationale**: Igual que ServicesSection; consistencia visual entre secciones de catálogo.

### 4. NosotrosTeamSection.astro — Overlay: solo Nombre y Cargo
- **Cambio (POST-APPLY)**: el párrafo de descripción (líneas 106-108) se ELIMINA del overlay en TODOS los breakpoints (decisión del cliente: "sólo deben ser visibles el nombre y el cargo").
- **Rationale**: El overlay queda limpio y legible en todos los tamaños. La descripción larga no se pierde para el usuario: `NosotrosTeamGrid.astro` (página "Nosotros") sigue renderizando `member.description` en las tarjetas del roster.
- **Consecuencia**: El prop `description` de cada miembro deja de consumirse en este componente; el tipo `NosotrosTeamSectionProps` se mantiene intacto porque el roster es compartido con `NosotrosTeamGrid`.

## Risks / Trade-offs

- **Hero description hidden**: El copy descriptivo no será indexado en móvil si se usa `hidden` (display: none). Si el SEO lo requiere, considerar `sr-only` o mantener en DOM con `opacity-0 pointer-events-none`. Decisión: `hidden sm:block` por simplicidad y cumplimiento del requisito "eliminado del DOM u oculto".
- **Aspect ratio 5:4 en imágenes existentes**: Las imágenes actuales pueden haber sido recortadas/compuestas para 1:1. El cambio de aspect ratio puede mostrar áreas no intencionadas o dejar espacio vacío. Mitigación: Validar visualmente con imágenes reales; `object-cover` en ServicesSection y `object-contain` en DestacadosSection ya manejan el recorte/ajuste.
- **NosotrosTeamSection description removed**: La descripción ya no se renderiza en el overlay de la home en ningún breakpoint. El contenido no se pierde: `NosotrosTeamGrid.astro` (página "Nosotros") sigue mostrando la descripción completa de cada miembro.

## Migration Plan

1. Aplicar cambios de clases Tailwind en los 4 componentes.
2. Validar visualmente en Chrome DevTools device toolbar (iPhone SE, iPhone 12 Pro, Galaxy S8+).
3. Verificar que no hay regresiones en `sm:`, `md:`, `lg:`, `xl:`.
4. Deploy a preview (Cloud Run) para revisión de cliente.
5. Rollback: revertir commits individuales por componente si hay feedback negativo.

## Open Questions

- ¿El párrafo del Hero Banner debe eliminarse del DOM completamente (`{description && false && <p>...}`) o basta `hidden sm:block`? El requisito dice "eliminado del DOM (o al menos oculto con hidden en base)". Se asume `hidden sm:block` como implementación más segura y reversible.
- ¿La descripción de NosotrosTeamSection debe mantenerse accesible en móvil para screen readers? Si sí, cambiar `hidden` por `sr-only sm:not-sr-only`.