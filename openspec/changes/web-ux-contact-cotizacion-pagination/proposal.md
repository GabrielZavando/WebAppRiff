## Why

El sitio público captura leads por dos formularios (contacto y cotización), pero
hoy ningún mensaje llega por correo a la casilla `contacto@somosriff.cl`: el
formulario de contacto postea a un endpoint inexistente (`POST /api/v1/contacts`)
y el de cotización solo persiste en Firestore. Además, la CTA "CONTACTAR ASESOR"
de la ficha de producto abre el cliente de correo (mailto) en lugar de llevar al
usuario al flujo de contacto, y al paginar el catálogo la ventana conserva el
scroll donde estaba, desorientando al usuario. El cambio cierra la conversión de
los dos formularios con notificación por email y corrige dos fricciones de UX.

## What Changes

- **Backend**: nuevo endpoint público `POST /api/v1/contacts` (valida, aplica
  honeypot y notifica; la persistencia de contactos queda diferida a un cambio
  post-MVP) con rate limiting estricto. `POST /api/v1/quotes` pasa a notificar
  por correo además de persistir.
- **Email**: nuevo port `IEmailNotifier` con adaptador HTTP (proveedor Resend),
  no-op en dev/test con log, y fake en tests. Nunca se disparan correos reales
  en CI. Nuevas variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL`.
- **Anti-spam**: protección básica en el formulario de contacto (honeypot) y
  rate limiting vía throttler (5 req/min).
- **Frontend**: ambos formularios pasan a enviarse con `fetch` (JS): en éxito,
  confirmación y formulario limpio; en error, mensaje claro y campos intactos.
- **Producto**: la CTA "CONTACTAR ASESOR" en `apps/web/src/pages/productos/[slug].astro`
  pasa de `mailto:contacto@somosriff.cl` a navegar a `/contacto`.
- **Catálogo**: al cambiar de página en el listado de productos, `window.scrollTo(0,0)`
  tras el re-render (filtros ya se preservan; sin parpadeo).

## Capabilities

### New Capabilities

- `contacts-api`: endpoint público `POST /api/v1/contacts` con validación,
  rate limiting estricto, honeypot anti-spam y notificación por correo
  a `contacto@somosriff.cl`.
- `email-notifications`: port `IEmailNotifier` con adaptador HTTP (Resend) y
  no-op en dev/test; contrato de variables de entorno y comportamiento de la
  notificación para formularios de contacto y cotización.

### Modified Capabilities

- `contact-page`: el formulario de contacto pasa de submit nativo a envío con
  `fetch` contra `POST /api/v1/contacts` (endpoint ya real), con mensajes de
  éxito/error inline, limpieza en éxito y conservación de campos en error.
- `cotizacion-page`: el formulario de cotización pasa a envío con `fetch`
  contra `POST /api/v1/quotes`, con mensajes de éxito/error inline, limpieza en
  éxito y conservación de campos en error.
- `quotes-api`: `POST /api/v1/quotes` notifica por correo a
  `contacto@somosriff.cl` tras persistir la cotización (comportamiento
  complementario, no reemplaza la persistencia).
- `product-detail-page`: la CTA "CONTACTAR ASESOR" navega a `/contacto` en
  lugar de abrir `mailto:contacto@somosriff.cl`.
- `products-catalog-page`: al cambiar de página, el scroll de la ventana vuelve
  al top; los filtros activos se mantienen.

## Impact

- **Backend** (`apps/backend/src`): nuevo módulo `contacts` (controller, DTO,
  service, repository), port `IEmailNotifier` + adaptador HTTP (Resend) y
  no-op; actualización de `cotizacion.service.ts` y `app.module.ts`; nuevas
  variables en `.env.example` (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`);
  dependencia mínima para la llamada HTTP o `fetch` nativo.
- **Frontend** (`apps/web/src`): `ContactForm.astro` y `CotizacionForm.astro`
  (envío JS + estados), nuevo script de cliente compartido si aplica,
  `catalogClient.ts` (scroll al top) y `productos/[slug].astro` (href de la CTA).
- **Specs OpenSpec**: deltas en `contacts-api`, `email-notifications`,
  `contact-page`, `cotizacion-page`, `quotes-api`, `product-detail-page` y
  `products-catalog-page`.
- **Docs**: `docs/api/api-spec.yml` (nuevo endpoint `/contacts`), `.env.example`
  y documentación de verificación del dominio `somosriff.cl` en Resend.
- **Fuera de alcance**: panel admin (Angular), diseño visual de formularios y
  tarjetas, lógica de filtros, API de productos existente.