# Proposal

## Why

Una ronda de pulido de contenido y UX del sitio público (`apps/web`): el titular de la sección de soluciones del home ya no refleja la oferta actual (son productos, no soluciones a medida), el botón de WhatsApp pasa desapercibido por su tamaño y falta de movimento, los logos de marcas representadas no enlazan a los fabricantes (pérdida de valor de la página de representaciones), el footer sigue usando enlaces placeholder `href="#"` aunque todas las páginas destino ya existen, y la historia institucional de `/nosotros` necesita actualizarse al relato oficial aprobado por el cliente.

## What Changes

- **Home (/)**: renombrar el titular de la sección de soluciones de "Nuestras Soluciones" a "Nuestros Productos" (config `SOLUTION_SECTION_CONTENT`; no afecta al titular "Nuestras Soluciones — Portafolio Técnico" de `/servicios`).
- **Botón flotante de WhatsApp (layout global)**: aumentar ligeramente su tamaño (48px → 56px, icono 24px → 28px) y añadir una animación de atención en CSS puro (pulso sutil infinito de escala), desactivada con `prefers-reduced-motion: reduce`.
- **Página Representaciones (/representaciones)**: añadir el campo opcional `url` al modelo de datos de marcas y distribuidores, y envolver el logo en un `<a target="_blank" rel="noopener noreferrer">` cuando existe `url`. GL Flow queda sin enlace (sin `<a>`). Mapeo: Apator → https://www.apator.com/en; RIFF Flow Metering → https://riffmeters.com/; Nitto Seiko → https://global.nittoseiko.com/; ILMAP → https://ilmap.com/es/; PIUSI → https://www.piusi.com/es/; SENSUS → https://www.sensus-international.com/en.
- **Footer (layout global)**: reemplazar los enlaces placeholder por rutas reales: SERVICIOS → anclas `#<slug>` de `/servicios` (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`); EMPRESA → "Nuestra Historia" `/nosotros#historia`, "Representaciones" `/representaciones`, "Contacto Directo" `/contacto`. El enlace "Proyectos de Éxito" se elimina (sin página destino; decisión del usuario, 2026-10-24). Los enlaces sociales externos ya son válidos y no cambian.
- **Nosotros (/nosotros) — timeline**: reemplazo total del set de hitos: de 5 hitos (1979, 2012, 2013, 2018, Dic-2024) a 4 hitos con los textos verbatim aprobados (1979 "Nuestro Origen", 2013 "Nace Aguapur Medición", 2018 "El Nacimiento de RIFF", Dic-2024 "La Evolución hacia RIFF"). El hito 2024 termina en "expandimos nuestra oferta para incluir:" seguido de una lista de 2 ítems con viñetas; el párrafo "En RIFF, contamos con…" se reubica en la sección de propuesta de valor. Sin cambios de diseño salvo esa lista; las notas laterales existentes se conservan en los hitos sobrevivientes y la nota de 2012 desaparece junto al hito.
- **Nosotros (/nosotros) — propuesta de valor**: la sección se renombra a "¿Qué nos define?" (antes "Nuestra Propuesta de Valor") y su párrafo introductorio pasa a ser el texto "En RIFF, contamos con…" (reemplaza al intro "Más de tres décadas acumuladas de know-how…").

## Capabilities

### New Capabilities

_(ninguna — todos los ajustes modifican capacidades existentes)_

### Modified Capabilities

- `solution-section`: el titular del encabezado de la sección pasa a ser "Nuestros Productos" (copy del config; sigue viniendo de `SOLUTION_SECTION_CONTENT`).
- `whatsapp-float-button`: nueva talla del FAB y nueva requirement de animación de atención en CSS puro con respeto a `prefers-reduced-motion`.
- `site-footer`: las columnas SERVICIOS y EMPRESA pasan de `href="#"` a rutas internas reales; la columna EMPRESA tiene 3 enlaces (se elimina "Proyectos de Éxito").
- `representaciones-page`: los logos de marcas y distribuidores son clickeables cuando el dato tiene `url` (nuevo campo opcional tipado, `target="_blank"` + `rel="noopener noreferrer"`); GL Flow se renderiza sin enlace.
- `nosotros-page`: el timeline pasa a 4 hitos con el copy verbatim nuevo (elimina el hito 2012 y actualiza títulos, párrafos y resaltado del hito 2024, que cierra con una lista de 2 ítems); la sección de propuesta de valor se renombra a "¿Qué nos define?" con el párrafo "En RIFF, contamos…" como intro.

## Impact

- **Código** (`apps/web`): `lib/config/solution-section.ts`; `components/WhatsAppButton.astro` (+ estilos scoped); `lib/types/representaciones-page.ts`, `lib/config/representaciones-page.ts`, `components/RepresentacionBrandCard.astro`, `components/DistribuidorCard.astro`; `lib/config/footer.ts`; `lib/config/nosotros-page.ts`.
- **Tests**: `lib/config/__tests__/solution-section.test.ts`, snapshot de `SolutionSection.test.ts`, tests de config `footer`/`representaciones-page`/`nosotros-page` y tests de componentes afectados.
- **Sin impacto**: API/BFF, Firestore, admin; sin assets binarios nuevos; sin dependencias nuevas (animación en CSS puro).
- **Decisiones confirmadas con el usuario (2026-10-24)**: eliminar "Proyectos de Éxito" del footer; reemplazo total del timeline a 4 hitos.
