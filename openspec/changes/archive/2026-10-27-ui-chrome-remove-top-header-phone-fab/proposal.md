# Proposal

## Why

La barra superior (`TopHeader`) duplica datos de contacto, añade 32 px de chrome no sticky y deja el teléfono sin una acción directa en mobile. Además, el logo del sitio debe pasar al nuevo PNG entregado y el icono de WhatsApp hereda el color azul marino en vez de blanco, lo que reduce legibilidad y consistencia visual.

## What Changes

- **BREAKING**: retirar la capability `top-header` y eliminar `TopHeader.astro`, su test, su snapshot y su render en `Layout.astro`.
- Conservar `getContactInfo()` como fuente única del teléfono, WhatsApp y redes; mover `ContactInfo`, `SocialLink`, `SocialNetworkName` y `getSocialLinks` a un módulo de contacto sin nombre de componente.
- Añadir `PhoneFab.astro`, botón flotante global de llamada con enlace `tel:+56229079067`, color de acento, icono Lucide y animación pulse.
- Ubicar el FAB de teléfono en `bottom-24 right-6` para quedar 16 px encima del FAB de WhatsApp, ambos con `56×56` y `z-20`.
- Aplicar `text-white` al icono de WhatsApp.
- Reemplazar el import de `logo-web.webp` por `logo-web.png` en Header y Footer, ajustando las dimensiones intrínsecas —1080×542, ratio ≈1.99:1— y los topes visuales para conservar el alto percibido. **No** se elimina ni se sobrescribe `logo-web.png`; el WebP anterior queda en disco sin uso.
- Actualizar las specs dependientes que fijaban el DOM de `TopHeader`, el orden de cabeceras, la lista de componentes base, el test E2E de la barra superior y las dimensiones del logo.
- Actualizar tests unitarios, snapshots y E2E; añadir cobertura del FAB de teléfono, el color del icono de WhatsApp, la ausencia de `TopHeader` y el nuevo logo.

## Capabilities

### New Capabilities

- `phone-fab`: botón flotante global de llamada telefónica, apilado sobre WhatsApp, con enlace `tel:`, accesibilidad y pulso CSS.

### Modified Capabilities

- `top-header`: retiro completo de la capability y de sus 11 requisitos.
- `whatsapp-float-button`: el icono del FAB pasa a blanco.
- `site-header`: logo PNG con dimensiones y topes nuevos; se elimina la referencia a `TopHeader` del contrato de accesibilidad.
- `site-footer`: logo PNG, tipo `SocialLink` reubicado y retiro de la sincronización de iconos con `TopHeader`.
- `search-form`: el orden del layout deja de incluir `TopHeader`.
- `home-hero-shell`: el shell hero contiene `Header`, `SearchForm` y slot; sin `TopHeader`.
- `hero-banner`: el orden DOM de la home deja de incluir `TopHeader`.
- `panel-home`: el orden DOM de la home deja de incluir `TopHeader`.
- `solution-section`: el orden DOM de la home deja de incluir `TopHeader`.
- `services-section`: el orden DOM de la home deja de incluir `TopHeader`.
- `site-header-scroll`: ya no existe una barra de contacto que desaparezca con el scroll; el logo compacto usa el nuevo ratio.
- `design-tokens`: `TopHeader` sale de la lista de componentes base sin radio ni sombra.
- `configure-social-links`: las redes se renderizan solo en Footer y ContactBar.
- `contact-page`: ContactBar comparte la fuente de contacto con Footer y las acciones flotantes.
- `representaciones-page`: el chrome de la página lista `Header`, Footer, SiteCredits, PhoneFab y WhatsApp.
- `astro-upgrade`: se retiran los escenarios de regresión de `TopHeader`.
- `web-e2e-critical-flows`: la suite landing deja de incluir `top-header` y suma la cobertura del FAB de teléfono.

## Impact

- **Componentes**: `Layout.astro`, `Header.astro`, `Footer.astro`, `TopHeader.astro` (eliminado), `WhatsAppButton.astro`, `PhoneFab.astro` (nuevo), `ContactBar.astro`.
- **Tipos y configuración**: `lib/types/top-header.ts` (eliminado/movido), `lib/types/contact.ts` (nuevo), `lib/config/contact.ts`, `lib/config/footer.ts`, `lib/types/footer.ts`, `lib/types/contact-form.ts`.
- **Estilos**: `header-scroll.css` (comentarios y ratio del logo compacto).
- **Assets**: `apps/web/src/assets/img/logo-web.png` se consume tal cual; `logo-web.webp` permanece sin uso.
- **Tests**: `TopHeader.test.ts` y su snapshot se eliminan; se actualizan `Header.test.ts`, `Footer.test.ts`, `ContactBar.test.ts`, `contacto.test.ts`, `tokens.test.ts`, `icon-catalog.test.ts`, `no-brand-classes.test.ts`, `Layout.test.ts`; E2E de header, scroll, home y orden DOM; nuevo `phone-fab.spec.ts`.
- **Specs**: 1 capability nueva, 16 modificadas y 1 retirada; el archivado elimina `openspec/specs/top-header/` mediante `retire_capabilities: true`.
- **Sin cambios**: backend, admin, API, dependencias de runtime y el binario del nuevo logo.
