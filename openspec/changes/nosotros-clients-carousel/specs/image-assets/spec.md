# image-assets Specification (delta)

## ADDED Requirements

### Requirement: Client logo carousel assets are served as build-time WebP via astro:assets

Los logos de clientes de `apps/web/src/assets/img/slider/` SHALL gestionarse bajo la convención `image-assets`: SHALL importarse desde `@/assets/img/slider/...` (nunca desde `public/`) y renderizarse vía `<Image>` de `astro:assets`, de modo que sharp re-encodee cada logo a WebP en build time (sitio `output: 'static'`). Las variantes recortadas al contenido (`slider/trimmed/`, con el margen interno eliminado) SHALL ser las importadas por la configuración. El `alt` de cada logo SHALL provenir de un mapa explícito en configuración (archivo → nombre de empresa), SHALL ser no vacío y no SHALL derivarse automáticamente del nombre de archivo. Las imágenes SHALL servirse con `loading="lazy"` porque la sección está bajo el fold.

#### Scenario: Logos procesados por astro:assets y servidos como WebP

- **WHEN** el sitio se construye y renderiza `/nosotros`
- **THEN** cada logo de cliente tiene un `src` generado por el pipeline de astro:assets (ruta optimizada/hash, no la ruta cruda del asset)
- **AND** el formato de salida es WebP generado en build time
- **AND** ninguna imagen de logo se sirve desde `apps/web/public/`

#### Scenario: Alt explícito y lazy loading

- **WHEN** el carrusel renderiza sus logos
- **THEN** cada `<img>` tiene `alt` no vacío tomado del mapa de configuración
- **AND** cada `<img>` declara `loading="lazy"`
