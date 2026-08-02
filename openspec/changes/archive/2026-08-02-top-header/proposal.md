## Why

El sitio público del catálogo digital necesita una barra superior (utility bar) que muestre el teléfono de contacto principal y enlaces a las 4 redes sociales corporativas (Facebook, X, Instagram, LinkedIn). Esta barra aparece globalmente en todas las páginas del sitio, encima del header principal, y se oculta completamente en dispositivos móviles (<640px) para maximizar el espacio de contenido.

## What Changes

- Nuevo componente `TopHeader.astro` en `src/components/`
- Integración del componente en `Layout.astro` (global, encima del slot)
- Configuración de contactos vía variables de entorno (`.env`)
- Tipos TypeScript para la configuración de contactos
- Tests unitarios (Vitest) y tests visuales (snapshot)

## Capabilities

### New Capabilities

- `top-header`: Utility bar global con teléfono y redes sociales
  - Renderiza teléfono primario desde `PRIMARY_PHONE`
  - Renderiza hasta 4 enlaces sociales (Facebook, X, Instagram, LinkedIn) solo si tienen URL configurada
  - Oculta completamente en mobile (<640px) con `hidden sm:flex`
  - Accesible: `aria-label` en nav y links, `target="_blank" rel="noopener noreferrer"`

### Modified Capabilities

- (ninguna — no hay capacidades existentes que modifiquen requisitos)

## Impact

- `apps/web/src/components/TopHeader.astro` — nuevo componente presentacional
- `apps/web/src/lib/config/contact.ts` — configuración tipada desde `.env`
- `apps/web/src/lib/types/top-header.ts` — interfaces TypeScript
- `apps/web/src/layouts/Layout.astro` — integra `<TopHeader />`
- `apps/web/.env.example` — ya existe con variables requeridas