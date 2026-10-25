# Design

## Context

Sitio Astro SSG (`apps/web`) con contenido centralizado en configs tipados (`lib/config/*.ts`) y componentes presentacionales ("dumb") que reciben props. Los cinco ajustes son cambios de copy/config más dos cambios de contrato de datos/estilo: el campo `url` de representaciones y la animación CSS del botón de WhatsApp. Ver `proposal.md` para la motivación. Restricciones relevantes: diseño plano (sin `rounded*`/`shadow*`), tokens de diseño únicos, set Lucide de iconos, tests con Vitest + `astro-container`, y el patrón ya establecido de animación CSS scoped con `prefers-reduced-motion` (`NosotrosClientsCarousel.astro`).

## Goals / Non-Goals

**Goals:**
- Aplicar los 5 ajustes sin cambiar la arquitectura del sitio (configs + componentes dumb).
- Mantener los contratos tipados al día (`SolutionSectionProps`, `RepresentacionBrand`/`Distribuidor`, `SiteFooterProps`, `NosotrosPageContent`).
- Animación de WhatsApp accesible y barata (CSS puro, GPU-friendly, reducible).

**Non-Goals:**
- No se toca el titular "Nuestras Soluciones — Portafolio Técnico" de `/servicios` (otra sección, otra página).
- No se crean páginas nuevas ni se cambian rutas del header/nav.
- No se añaden dependencias ni assets binarios nuevos.
- No se modifica el BFF, Firestore ni el admin.

## Decisions

- **D1 — Reutilizar capacidades existentes en vez de crear specs nuevas.** La propuesta original mencionaba `home-featured-products` y `layout`, pero el inventario real de specs ya cubre esas áreas con límites más precisos: `solution-section` (home), `whatsapp-float-button` + `site-footer` (chrome global), `representaciones-page` y `nosotros-page`. Se reusan sus paths exactos para evitar near-duplicates y para que los deltas se integren en la spec correcta al archivar.
- **D2 — Talla del FAB: 56×56 px (`h-14 w-14`), icono 28 px (`h-7 w-7`).** "Ligeramente más grande" desde 48 px; 64 px (`h-16`) se descartó por dominar la esquina en mobile. Posición (`bottom-6 right-6`) y z-index (`z-20`) no cambian.
- **D3 — Animación: pulso de escala en CSS puro, no ripple.** Ambas opciones eran válidas para el cliente; el pulso (escala sutil 1 → ~1.08 con opacidad, `infinite`) gana por simplicidad: solo `transform`/`opacity` (GPU), sin pseudo-elemento extra con sombra (que chocaría con el diseño plano). Se implementa con `<style>` scoped en `WhatsAppButton.astro` + `@media (prefers-reduced-motion: reduce) { animation: none }`, replicando el patrón del carrusel de `/nosotros`. Sin JS.
- **D4 — `url` opcional en ambos contratos y enlace solo alrededor del logo.** `readonly url?: string` en `RepresentacionBrand` y `Distribuidor`; en el template, el `<Image>` se envuelve en `<a href={url} target="_blank" rel="noopener noreferrer">` solo si `url` está definida (render condicional de Astro). GL Flow omite `url` → sin `<a>`, mismo `<img>`. Enlazar solo el logo (no la tarjeta completa) evita anidar interacciones sobre el `<h3>`/descripción y mantiene el layout del panel `data-brand-logo`.
- **D5 — Footer: rutas reales mapeadas a los slugs existentes.** SERVICIOS → `/servicios#<slug>` con los 4 slugs de `SERVICIOS_FIELD_SECTION` (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`), que ya coinciden 1:1 con los labels actuales. EMPRESA: "Nuestra Historia" → `/nosotros#historia` (el ancla `id="historia"` existe en `NosotrosTimeline.astro` y es el destino semántico del label), "Representaciones" → `/representaciones`, "Contacto Directo" → `/contacto`. "Proyectos de Éxito" se elimina (decisión del usuario). Sociales: sin cambios (X ya se suprime por URL vacía).
- **D6 — Timeline: reemplazo total a 4 hitos con copy verbatim.** Se sustituye el array `milestones` completo; los hitos sobrevivientes conservan su `tone` (1979 `primary`, 2013 `primary`, 2018 `accent`, Dic-2024 `dark`), badges ("AÑO 1979", "AÑO 2013", "AÑO 2018", "DICIEMBRE 2024") y notas laterales actuales. El `highlight` del hito 2024 pasa de "RIFF SpA" a "RIFF" (la subcadena existe en el nuevo texto, así `splitHeadline` produce el `<strong>`; el texto nunca cambia). La alternativa de conservar el hito 2012 con su texto viejo se descartó porque el pedido fue "reemplazar los textos" (decisión confirmada).
- **D7 — Headline del home: cambio solo de config + tests.** `SOLUTION_SECTION_CONTENT.headline` pasa a "Nuestros Productos". Como la prueba de config y el snapshot fijan el string, se actualizan junto con el config (los fixtures de `lib/types/__tests__` usan el string solo como dato de prueba y no es necesario cambiarlos si no aserten el config real; se revisa en implementación).

## Risks / Trade-offs

- [Tests que fijan copy/snapshots se quedan viejos] → Las tareas enumeran explícitamente cada test afectado (config solution-section, snapshot de SolutionSection, footer, representaciones-page, nosotros-page) y `make test` es parte del gate.
- [El pulso puede distraer o parecer "parpadeo"] → Escala sutil y ciclo lento (~2 s); se desactiva con `prefers-reduced-motion`. Si el cliente lo percibe fuerte, solo se ajusta la amplitud en el `<style>`.
- [`splitHeadline` depende de la subcadena exacta "RIFF"] → Test de config que aserta el `<strong>` sobre "RIFF" en el hito 2024; si el copy vuelve a cambiar, el test lo detecta.
- [Enlace `/nosotros#historia` depende del `id` de la sección] → El id existe hoy y está fijado en la spec de `nosotros-page`; un cambio futuro de ese id rompería el footer de forma visible (riesgo aceptado, cubierto por specs).
- [Dos hitos consecutivos con tone `primary` (1979, 2013)] → Es el tono que ya tenían; no es un cambio de diseño. La alternancia de posiciones sigue siendo por índice, no por tono.

## Migration Plan

Sin migración de datos ni despliegue especial: el sitio es SSG, basta el rebuild normal de `apps/web`. Rollback = revertir el commit del change (todos los cambios son front-end estático).

## Open Questions

Ninguna. Las dos ambigüedades de alcance ("Proyectos de Éxito" y el hito 2012) se resolvieron con el usuario el 2026-10-24 y están fijadas en las specs delta.
