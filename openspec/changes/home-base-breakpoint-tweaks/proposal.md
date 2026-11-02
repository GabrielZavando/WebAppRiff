## Why

Ajustar elementos de UI/UX en la página de inicio para mejorar la visualización, legibilidad y jerarquía de información en dispositivos móviles (< 640px).

## What Changes

- **HeroBanner.astro**:
  - Reducir el tamaño de fuente del subtítulo.
  - Ocultar el párrafo explicativo en el breakpoint base para mejorar el acceso a los botones CTA sin scroll.
- **ServicesSection.astro**:
  - Ajustar la relación de aspecto de las imágenes de las tarjetas a 5:4.
- **DestacadosSection.astro**:
  - Ajustar la relación de aspecto de las imágenes de las tarjetas a 5:4.
- **NosotrosTeamSection.astro**:
  - En móviles, mostrar únicamente Nombre y Cargo en las tarjetas del equipo, ocultando la descripción larga.

## Capabilities

### New Capabilities
- `home-page-mobile-tweaks`: Ajustes visuales y de contenido en la página de inicio para móviles.

### Modified Capabilities

## Impact

Modificación de estilos y estructura de renderizado en componentes Astro de la página de inicio (`/`). No afecta API, dependencias ni sistemas externos.
