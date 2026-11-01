## Context

El sitio público de Astro ya tiene resuelto el comportamiento sticky y el cambio de fondo del grupo Header + SearchForm mediante el wrapper `div.sticky.top-0.z-30.header-scroll-shell` de `Layout.astro` y el atributo `data-scrolled` toggled por `createHeaderScrollState.ts`. Lo que falla es la composición mobile-first: el header usa `pb-4` (16px solo abajo) y deja el logo pegado arriba; `header-scroll.css` encoge el logo al scrollear; el buscador apila select, input y botón en tres filas; y los CTAs del hero se estiran al 100% por el `align-items: stretch` de `flex-col`.

Restricciones del proyecto: Tailwind v4, Astro 7, componentes presentacionales, tests unitarios con `AstroContainer`, e2e con Playwright y snapshots de componente. Los artefactos OpenSpec van en español; el código en inglés.

## Goals / Non-Goals

**Goals:**

- Composición mobile-first limpia por debajo de `sm` (640px): logo alineado a la izquierda y centrado verticalmente, buscador con input + botón pegados y CTAs del hero al 50% apilados a la izquierda.
- Mantener intactos el sticky, el cambio de color por scroll, la sombra del shell y la lógica de View Transitions.
- Restaurar el comportamiento actual de tablet/desktop desde `sm`, salvo el tamaño fijo del logo.
- Actualizar specs, tests unitarios, snapshots y e2e afectados.

**Non-Goals:**

- Rediseñar el header desktop ni mover el nav de escritorio.
- Cambiar la API, backend, Firestore o variables de entorno.
- Reescribir la lógica de scroll existente.
- Modificar la navegación, el menú móvil o el overlay.

## Decisions

### 1. Header: redistribuir el padding, no solo eliminarlo

Se elimina `pb-4` del `<header>` y se aplica `py-2` (8px arriba/abajo) en la base. La barra interna conserva `h-16` en móvil y `lg:h-20` en desktop. Para no alterar el header desktop, se usa `lg:pt-0 lg:pb-2`: móvil totaliza 80px (64 + 16) y desktop 88px (80 + 8), equivalente al contrato actual de desktop.

El logo queda alineado a la izquierda mediante el `justify-between` existente y centrado verticalmente por `items-center`. No se introduce un centrado horizontal del logo, evitando el conflicto de superposición con el nav de escritorio en `xl`.

La hamburguesa mantiene `position: fixed` y `z-50` (necesario para quedar sobre el overlay), pero se recentra con `top-5` (20px) en móvil y `lg:top-6` (24px) en el rango 1024–1279px, donde el header mide 8px más.

**Alternativas descartadas:** centrar el logo con `justify-center xl:justify-between` (el cliente aclaró que debe quedar a la izquierda); agrandar el logo para llenar el header (volvería a quedar pegado al borde).

### 2. Logo de tamaño fijo: solo CSS

Se eliminan de `header-scroll.css` el bloque `body[data-scrolled='true'] .site-logo { max-width: 150px; }` y el bloque `@media (min-width: 640px)` que fija `height: 100px` al scrollear. También se retira `.site-logo` de las transiciones y del bloque `prefers-reduced-motion`, porque ya no participa del estado compacto.

**Alternativa descartada:** mantener el shrink solo en desktop. El cliente confirmó tamaño fijo en todos los tamaños.

### 3. Buscador: grilla de dos columnas sin reestructurar el DOM

Se reemplaza el layout móvil `flex flex-col` por una grilla con `grid-cols-[minmax(0,1fr)_auto]` y `gap-y-3`, manteniendo el select, el input y el botón como hijos directos del `<form>`:

- select con `col-span-2` (fila completa);
- contenedor del input con `min-w-0`;
- botón con `shrink-0` y sin ancho completo.

Así el botón queda pegado al borde derecho del input sin gap horizontal, sin envolver controles en un contenedor extra y sin alterar el orden de tabulación. Desde `sm` el form vuelve a `sm:flex-row` con `sm:gap-px`, restaurando la fila única de tablet/desktop. El breakpoint del componente pasa de `md` a `sm`, consistente con el enfoque mobile-first solicitado.

**Alternativa descartada:** envolver input + botón en un `<div>` con `md:contents`; funciona, pero añade un nodo y complica las aserciones estructurales existentes.

### 4. Botón del buscador: solo ícono con nombre accesible explícito

En móvil se oculta el texto con `hidden sm:inline` y se añade `aria-label="BUSCAR"` al `<button>`. El ícono se mantiene `aria-hidden="true"` con `h-4 w-4`. Desde `sm` el texto vuelve a mostrarse y se restauran `gap-2` y `px-8`; en móvil se usa padding horizontal compacto para que el botón no domine la fila.

**Alternativa descartada:** depender del texto oculto con `sr-only` sin `aria-label`; válido, pero el `aria-label` explícito hace el contrato más claro y testable.

### 5. Hero: CTAs al 50% solo en la base móvil

El contenedor pasa a `flex flex-col items-start gap-3 sm:flex-row` y cada CTA recibe `w-1/2 sm:w-auto`. Se reduce el padding horizontal móvil (`px-4 sm:px-8`) para que el texto quepa dentro del 50% a 320px. Desde `sm` se restaura el layout horizontal actual con ancho automático.

**Alternativa descartada:** dos botones lado a lado al 50% en móvil; descartada por el cliente, que pidió apilados y alineados a la izquierda.

### 6. Lógica de scroll intacta, pero sticky desbloqueado

`createHeaderScrollState.ts`, el wrapper sticky, `.site-header::after`, `.site-search` y `.header-scroll-shell` se mantienen sin modificar. El estado compacto seguirá cambiando fondo y sombra; solo deja de afectar al logo.

### 7. Recorte horizontal con `clip` para no romper el sticky

El `<html>` traía `style="overflow-x:hidden"` y el `<body>` la utilidad `overflow-x-hidden`. Cuando un eje queda en `hidden`, CSS computa el otro eje a `auto`, convirtiendo ese elemento en un ancestro con mecanismo de scroll; `position: sticky` se resuelve contra ese ancestro y deja de fijarse al viewport en navegadores como Safari. Se reemplaza por `overflow-x: clip` (`overflow-x-clip` en Tailwind v4) en `<html>` y `<body>`: recorta igual el desborde horizontal sin crear un contenedor de scroll, por lo que el wrapper sticky sigue anclado a `top: 0`.

**Alternativa descartada:** mover el `overflow-x-hidden` a un wrapper interno. Recorta, pero cualquier wrapper que envuelva al sticky vuelve a crear el mismo problema; además obliga a duplicar el recorte en todas las páginas.

**Alternativa descartada:** `position: fixed` en el grupo header + buscador. Garantiza el anclaje, pero exige un espaciador dinámico para evitar saltos de layout y complica el presupuesto de altura y las View Transitions.

### 8. Menú móvil re-inicializado en `astro:page-load`

El script inline de `Header.astro` enlazaba el listener del botón hamburguesa una sola vez. Con `ClientRouter`, la navegación reemplaza el `<body>` (y con él el `<button data-menu-toggle>`), pero el script no se re-ejecuta y el nuevo botón queda sin listener. Se extrae un initializer idempotente que corre al cargar y en cada `astro:page-load`:

- el botón se marca con `data-menu-initialized` para no enlazar dos veces el mismo nodo;
- el listener global de `astro:page-load` se registra una sola vez con una bandera en `window`;
- la lógica del click (aria, `data-menu-open`, scroll lock, swap de íconos) se mantiene idéntica.

**Alternativa descartada:** delegación de eventos desde `document`. También sobrevive al swap y es robusta, pero no cumple el requisito explícito de re-inicializar en `astro:page-load` y haría menos evidente el contrato del ciclo de vida de Astro.

## Risks / Trade-offs

- **[El texto del CTA desborda dentro del 50% a 320px]** → Reducir el padding horizontal móvil y mantener `whitespace-nowrap`; validar con e2e en 320×568 y 375×667.
- **[El cambio de breakpoint del buscador (`md` → `sm`) altera el rango 640–767px]** → Es intencional para mobile-first; actualizar los e2e y verificar que el grupo sticky siga bajo el presupuesto de altura.
- **[El header desktop deja de encoger el logo y mantiene el overflow 2×]** → Aceptado explícitamente por el cliente; verificar que no tape el buscador ni genere scroll horizontal.
- **[La hamburguesa fija puede quedar descentrada si cambia el alto del header]** → Ajustar `top-5`/`lg:top-6` y cubrir con test de posición/visibilidad.
- **[Snapshots y e2e desactualizados bloquean el gate]** → Actualizar snapshots de `Header`, `SearchForm` y `HeroBanner` y los e2e de scroll, buscador y hero en la misma implementación.
- **[Drift previo en specs y tests]** → `site-header` tenía valores de padding obsoletos y `site-header.spec.ts` lista cinco ítems de navegación; este change corrige solo lo que toca. Cualquier fallo preexistente ajeno al alcance se reporta, no se mezcla.
- **[`overflow-x: clip` en navegadores antiguos]** → Safari/Chrome modernos lo soportan; si un navegador no lo reconoce, cae a `visible` y podría aparecer scroll horizontal, pero nunca rompe el sticky. Se valida con e2e de overflow horizontal en la matriz de viewports.

## Migration Plan

1. Cambios de clases y CSS en los tres componentes y `header-scroll.css`.
2. Actualización de unit tests, snapshots y e2e en el mismo commit de implementación.
3. Verificación: `make test`, `make lint`, `make typecheck` y e2e de los specs afectados.
4. Despliegue estático habitual (Astro SSG); sin migración de datos.
5. Rollback: revertir los cambios de clases/CSS y restaurar los snapshots, sin afectar datos ni infraestructura.

## Open Questions

Ninguna pendiente. Las ambigüedades de alineación del logo, alcance del tamaño fijo y distribución de los CTAs fueron resueltas con el cliente antes de proponer el change.
