## Context

Tres piezas del sitio público (`apps/web`, Astro SSG) se ven inconsistentes en el rango tablet y en el pie de página:

- `SearchForm.astro` vive bajo el header en el grupo sticky. Su contenedor interno usa `max-w-[760px] mx-auto px-4 md:px-0`; a 768px eso deja márgenes laterales grandes porque el tope de 760px es menor que el 90% del viewport de tablet.
- `Footer.astro` renderiza el botón `[data-scroll-top]` después del texto de ubicación, dentro del grupo alineado a la derecha de la barra inferior. Los FABs fijos `WhatsAppButton` (`fixed bottom-6 right-6`) y `PhoneFab` (`fixed bottom-24 right-6`) ocupan esa esquina y pueden taparlo.
- `services-page.ts` fija el headline de la Sección 1 como "Nuestras Soluciones — Portafolio Técnico", mientras el home usa "Nuestros Productos". La spec `solution-section` incluso declaraba intocable ese titular, contradicción que este change resuelve.
- `ServicioTerrenoCard.astro` mantiene en `md+` un grid de 12 columnas con la imagen en 5 columnas y el texto en 7. La imagen lateral se estira verticalmente (`md:h-auto`) y el texto queda apiñado; el cliente pide una columna vertical con la imagen a ancho completo.

Restricciones: sitio SSG sin runtime de layout; el diseño es plano (sin `rounded*`/`shadow*`); el header y los FABs no cambian de estructura, solo la posición/ancho de los elementos afectados. El proyecto exige TDD y specs como fuente de verdad.

## Goals / Non-Goals

**Goals:**

- Buscador centrado y con ancho exacto del 90% del viewport entre `md` (768px) y `< xl` (1280px), restaurando el tope de 760px desde `xl`.
- Botón scroll-to-top inmediatamente a la izquierda de "SANTIAGO, CHILE" en la misma fila, sin intersección con los FABs en `md` y superiores.
- Titular de `/servicios` alineado con el home: "Nuestros Productos — Portafolio Técnico".
- Tarjetas de "Servicios especializados en terreno" en columna vertical desde `md`, con orden índice/sector → título → imagen → descripción → características → CTA, imagen 16:9 a ancho completo y CTA libre de los FABs.

**Non-Goals:**

- No se rediseña el header ni la navegación.
- No se cambian los FABs, su tamaño, su z-index ni su posición fija.
- No se modifica el layout de controles del buscador (select/input/botón) ni sus breakpoints `sm`.
- No se toca el copy del home ni de otras secciones.
- No se cambia el copy ni los datos de las tarjetas de servicios en terreno; solo su composición visual.

## Decisions

### D1 — Buscador: 90% del viewport con tope restaurado en `xl`

El contenedor interno del formulario mantiene la base móvil (`w-full max-w-[760px] mx-auto px-4`) y añade `md:w-[90%] md:max-w-none md:px-0` para el rango 768–1279px, más `xl:max-w-[760px]` para volver al ancho aceptado en escritorio. Se mide contra el ancho del viewport porque el wrapper `role="search"` ocupa el 100% del ancho y el requisito del cliente habla de "ancho disponible" de la ventana.

- **Alternativa descartada**: usar `md:w-[90vw]`. `vw` incluye el ancho de la barra de scroll y puede desbordar 1–15px; `w-[90%]` sobre el wrapper full-width es equivalente y no depende del scrollbar.
- **Alternativa descartada**: mantener `max-w-[760px]` y solo aumentar el máximo. A 768px el 90% (691px) es menor que 760px, así que el tope no tendría efecto; es necesario `md:max-w-none` para que el 90% mande.
- **Por qué `< xl` y no `< lg`**: el header cambia a su layout de escritorio en `xl` (nav visible desde 1280px). Alinear el ancho del buscador con ese cambio evita un salto intermedio en `lg`.

### D2 — Footer: reordenar el botón y reservar la columna de FABs

El grupo derecho de la barra inferior pasa a renderizar primero el `<button data-scroll-top>` y después el `<span>` de ubicación. La barra inferior añade `sm:pr-24` (96px) para que el grupo no llegue al borde derecho, donde los FABs ocupan 24–80px desde el borde. En móvil (`< sm`) el grupo permanece centrado y el botón queda a la izquierda de la ubicación, fuera de la esquina de los FABs.

- **Alternativa descartada**: mover el botón a una fila superior solo en móvil. Duplicaría la lógica de layout y rompería la lectura "justo antes" del texto.
- **Alternativa descartada**: cambiar la posición de los FABs. Están especificados por `whatsapp-float-button` y `phone-fab`; tocarlos amplía el alcance innecesariamente.
- **Por qué `pr-24`**: 96px supera el ancho combinado del FAB (56px) más su separación del borde (24px) = 80px, con 16px de holgura.

### D3 — Servicios: cambio de copy en la configuración, no en el componente

El headline se cambia en `SERVICIOS_PORTFOLIO_SECTION.headline` (`lib/config/services-page.ts`). `ServiciosPortafolioSection.astro` y `ServiciosSectionHeading.astro` son presentacionales y no contienen el literal. Se actualizan los tests que fijan el copy anterior y la spec `solution-section` deja de declarar intocable el titular de `/servicios`.

- **Alternativa descartada**: renombrar también el eyebrow o la introducción. El cliente solo pidió el título; el resto del copy se conserva.

### D4 — Tarjetas de terreno: columna vertical en `md+` con imagen 16:9

El componente se reestructura en tres bloques hermanos dentro de un `<article>` `flex flex-col`: cabecera (índice/sector + título), imagen y cuerpo (descripción + variante + CTA). En móvil se conserva el orden actual mediante utilidades `order-*` (imagen `order-1`, cabecera `order-2`, cuerpo `order-3`); desde `md` se reordena a cabecera `md:order-1`, imagen `md:order-2`, cuerpo `md:order-3`. La imagen pasa a `w-full md:aspect-video` con `object-cover` en el `<img>`, de modo que ocupa el 100% del ancho sin deformarse. El CTA queda al final del cuerpo con `md:pr-24` para reservar la columna de los FABs. Se elimina la prop `imagePosition` porque ya no hay alternancia izquierda/derecha.

- **Alternativa descartada**: mantener `md:grid-cols-12` y reordenar con `order-*`. La imagen no puede ocupar las 12 columnas y convivir con cabecera/cuerpo sin filas adicionales; el grid añade complejidad sin beneficio.
- **Alternativa descartada**: fijar una altura en `md` (`h-72` o similar). Reproduce el estiramiento/recorte desproporcionado que el cliente reportó; la proporción intrínseca es más estable.
- **Alternativa descartada**: usar 5:4. Es horizontal pero demasiado alta a 768px (~560px); 16:9 mantiene la tarjeta compacta y prioriza el texto.
- **Por qué `md:pr-24`**: 96px cubre el FAB de 56px más su separación de 24px del borde, con holgura para el pulso.

## Risks / Trade-offs

- **El 90% depende del ancho del wrapper**: si en el futuro el wrapper deja de ser full-width, el porcentaje cambiaría de base. → Mitigación: la spec fija la medición contra el viewport y el test verifica el ancho renderizado a 768/1024/1204px.
- **El padding derecho del footer reduce el espacio útil del copyright en tablets estrechas**: a 640–767px el copyright y el grupo comparten fila. → Mitigación: `pr-24` aplica desde `sm`; si el texto envuelve, la barra crece verticalmente sin desbordar horizontalmente.
- **Tests de copy existentes fallarán a propósito**: `services-page.test.ts`, `servicios.test.ts` y `ServiciosSectionHeading.test.ts` fijan "Nuestras Soluciones — Portafolio Técnico". → Mitigación: actualizarlos en la misma tarea TDD antes de dar por cerrado el change.
- **FABs con animación de pulso**: el `boundingBox` puede variar ±8% por `transform: scale`. → Mitigación: el margen de 16px de `pr-24` absorbe el pulso máximo (56px × 1.08 ≈ 60.5px).
- **Reordenar con `order-*` separa cabecera y cuerpo en el DOM**: los lectores de pantalla siguen el DOM (cabecera → imagen → cuerpo), que coincide con el orden visual en `md+`; en móvil el orden visual es imagen → cabecera → cuerpo y el DOM difiere. → Mitigación: el orden móvil conserva el comportamiento actual y el orden `md+` (el que pidió el cliente) coincide con el DOM.
- **La proporción 16:9 recorta la foto**: `object-cover` recorta los bordes en lugar de deformar. → Mitigación: las imágenes actuales son horizontales y el caption queda sobre el borde inferior; se valida con el e2e de proporción.

## Open Questions

Ninguna: el breakpoint superior (`< xl`), la posición del botón (izquierda, misma fila) y la base de medición (viewport) fueron confirmados por el cliente. Para las tarjetas de terreno se adopta 16:9 por ser la proporción horizontal más compacta de las dos sugeridas.
