# UI chrome polish: header, buscador, panel home, menú Nosotros y botón flotante de WhatsApp

**Ticket**: UI-FIX1
**Tag**: [frontend] (explícito, confirmado por el usuario — todo el trabajo vive en apps/web)
**Branch**: feature/ui-fix1-ui-chrome-polish

## Why

El cliente reporta cinco ajustes visuales post-review. El padding-bottom del header fue editado a mano a `pb-10 lg:pb-4` (sin commit): tests, snapshot, comentario interno y la spec `site-header` siguen en `lg:pb-12`, así que la suite falla hoy. El buscador global (`.site-search`) muestra fondos inconsistentes: gradiente `from-secondary to-secondary-light` en /productos y una variante blanca sin uso en ninguna página; el cliente exige transparente o `var(--color-secondary)` sólido, uniforme en todas las páginas con buscador (referencia: Inicio). La card elevada del PanelHome queda demasiado abajo en desktop. La página /nosotros existe (chrome vacío) pero no es alcanzable: falta el enlace en el menú. El sitio no tiene un acceso flotante de WhatsApp (+56 9 3752 6162).

## What Changes

- Formalizar el padding-bottom del header `pb-10 lg:pb-4`: alinear assertion de `Header.test.ts`, snapshot y comentario interno; actualizar la spec `site-header` (el cliente acepta el overflow leve del logo 2× en desktop).
- Reducir el wrapper `role="search"` a dos estados de reposo: `bg-transparent` (hero) | `bg-secondary` sólido (resto, color uniforme como Inicio); eliminar la variante gradiente, la variante blanca sin uso y el plumbing `secondaryBg`/`searchSecondary` (prop, passthrough de Layout, tipo `SearchFormProps`, páginas que lo pasan).
- Preservar el estado compacto de scroll de `.site-search` (transición a `var(--color-secondary)`), sin cambios en `header-scroll.css`.
- Subir la card elevada del PanelHome 16px en desktop: sección de `-mt-2 md:-mt-2 lg:mt-2` a `-mt-2` uniforme (desktop pasa de +8px a −8px); móvil/tablet intactos.
- Añadir el enlace "Nosotros" a `NAVIGATION_ITEMS` (desktop y móvil renderizan desde la misma lista).
- Nuevo `WhatsAppButton.astro`: botón flotante fijo abajo-derecha, solo icono, enlaza a `https://wa.me/56937526162`; tokens nuevos `--color-whatsapp` / `--color-whatsapp-dark` declarados en los `globals.css` de ambas apps (paridad design-tokens); icono `simple-icons:whatsapp` (segunda excepción documentada, precedente X).

Fuera de alcance: contenido de /nosotros (la página queda vacía), widget oficial de WhatsApp, elevación del panel en móvil.

## Capabilities

### New Capabilities
- `whatsapp-float-button`: CTA global fijo (esquina inferior derecha) de contacto WhatsApp, solo icono, en todas las páginas del sitio.
- `navigation-menu`: enlace "Nosotros" en el menú principal (desktop + móvil) con estado activo.

### Modified Capabilities
- `site-header`: requirement "Header box contains the full logo height" actualizado a `pb-10 lg:pb-4` (decisión del cliente; overflow leve del logo 2× aceptado en desktop).
- `search-form`: requirements modificados ("supports a transparent mode", "integrates into the global layout") y eliminado ("background supports a secondary (navy) variant"); estados de reposo reducidos a transparente | secondary sólido; plumbing `secondaryBg` eliminado.
- `panel-home`: requirement "sits 8px below the HeroBanner on desktop" reemplazado por elevación uniforme `-mt-2` (desktop +8px → −8px, 16px más arriba).

## Impact

- `apps/web/src/components/Header.astro` (+ `__tests__/Header.test.ts`, snapshot)
- `apps/web/src/components/SearchForm.astro` (+ `__tests__/SearchForm.test.ts`, snapshot)
- `apps/web/src/components/WhatsAppButton.astro` (nuevo) (+ `__tests__/WhatsAppButton.test.ts`)
- `apps/web/src/components/PanelHome.astro` (+ `__tests__/PanelHome.test.ts`, snapshot)
- `apps/web/src/layouts/Layout.astro`
- `apps/web/src/lib/config/navigation.ts` (+ tests)
- `apps/web/src/lib/types/search-form.ts`
- `apps/web/src/pages/productos/index.astro`, `apps/web/src/pages/productos/[slug].astro`
- `apps/web/src/styles/globals.css`, `apps/admin/src/styles/globals.css` (paridad de tokens)
- `docs/design/style-guide/README.md` (catálogo de iconos: segunda excepción; tabla de tokens)
