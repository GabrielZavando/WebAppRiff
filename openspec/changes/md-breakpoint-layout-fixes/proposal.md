## Why

En el rango de tablet (`md`, 768px) el buscador del header queda limitado a 760px y deja márgenes laterales desproporcionados, el botón de volver arriba del footer compite con los FABs flotantes de WhatsApp/Teléfono y `/servicios` mantiene un titular desalineado con el home. Además, las tarjetas de "Servicios especializados en terreno" conservan un layout horizontal en `md` que estira la imagen lateral y apiña el texto. Estos detalles rompen la consistencia visual en tablet y en la barra inferior del sitio.

## What Changes

- **Buscador en `md`–`<xl`**: el contenedor interno del buscador se centra y ocupa exactamente el 90% del ancho del viewport entre 768px y 1279px; desde `xl` (1280px) recupera el ancho máximo actual de 760px.
- **Scroll-to-Top del footer**: el botón se reordena para quedar inmediatamente a la izquierda del texto "SANTIAGO, CHILE" en la misma fila, con espacio reservado a la derecha para que los FABs de WhatsApp y Teléfono no lo tapen.
- **Titular de `/servicios`**: el título de la primera sección cambia de "Nuestras Soluciones — Portafolio Técnico" a "Nuestros Productos — Portafolio Técnico", en línea con el home.
- **Tarjetas de servicios en terreno en `md+`**: pasan de un layout horizontal (imagen lateral) a una columna vertical con el orden índice/sector, título, imagen, descripción, características y CTA. La imagen ocupa el 100% del ancho con proporción 16:9 y el CTA reserva espacio para los FABs.
- Se actualizan las specs afectadas para eliminar la contradicción que prohibía modificar el titular de `/servicios` y para reemplazar la alternancia de imagen por el nuevo orden vertical.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `search-form`: el layout responsivo del buscador cambia en `md`–`<xl` (90% del viewport, centrado) y se restaura el ancho máximo de 760px desde `xl`.
- `site-footer`: la barra inferior reordena el botón scroll-to-top a la izquierda de la ubicación y reserva espacio para los FABs.
- `services-page`: el headline de la Sección 1 pasa a "Nuestros Productos — Portafolio Técnico" y las tarjetas de la Sección 2 adoptan un layout vertical en `md+` con imagen a ancho completo y CTA despejado de los FABs.
- `solution-section`: se elimina la nota que declaraba intocable el titular de `/servicios`.

## Impact

- `apps/web/src/components/SearchForm.astro` (contenedor interno y clases responsivas).
- `apps/web/src/components/Footer.astro` (barra inferior, orden y padding).
- `apps/web/src/components/ServicioTerrenoCard.astro` y `ServiciosTerrenoSection.astro` (layout vertical en `md+` y orden de elementos).
- `apps/web/src/lib/types/services-page.ts` (eliminación de `imagePosition`).
- `apps/web/src/lib/config/services-page.ts` (headline de `SERVICIOS_PORTFOLIO_SECTION`).
- Tests existentes de `search-form`, `Footer`, `services-page`, `ServicioTerrenoCard` y snapshots que fijan el copy o el layout anterior.
- Nuevo e2e de las tarjetas de terreno en `/servicios`.
- Sin cambios de API, dependencias ni infraestructura.
