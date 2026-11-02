## Context

La home de `apps/web` se compone con Astro y Tailwind v4. El rango `sm` (640–1023px) quedó cubierto solo parcialmente por los changes `mobile-first-header-search-hero` y `responsive-web-design-fixes`. Al revisar el sitio a 640px se observan seis defectos concretos:

- El header mide 112px en la práctica porque el logo de 240px se desborda de una barra de 64px y arranca desde el borde superior.
- El buscador reparte `sm:w-56` (224px) para el select y deja el resto al input, pero el select puede encogerse y su texto se trunca.
- El hero deja el texto a merced de los FABs fijos (`whatsapp-fab`, `phone-fab`) y su CTA secundario es transparente con texto blanco sobre una imagen clara.
- `ServicesSection` usa `md:grid-cols-2` y `NosotrosTeamSection` usa `md:grid-cols-2 lg:grid-cols-3`, por lo que a 640px siguen apilados.
- `SolutionSection` y `DestacadosSection` ya declaran `sm:grid-cols-2`; no requieren cambio de requisito, solo cobertura a 640px.
- El grid de estadísticas de `PanelHome` dibuja sus divisores con `gap-px` sobre un wrapper con fondo primario; a 640px el redondeo subpíxel produce líneas de 0/2px que se ven superpuestas.

Restricciones: artefactos en español, código en inglés, TDD, Tailwind v4, tests unitarios con `AstroContainer`, snapshots y e2e con Playwright. La home es SSG: los cambios de clases se validan en build.

## Goals / Non-Goals

**Goals:**

- Corregir la composición de la home en `sm` sin alterar la base móvil (< 640px) ni el contrato de escritorio (`lg`/`xl`).
- Dejar contratos testables por clase y por medición e2e en `640×360` y `640×800`.
- Actualizar specs, unit tests, snapshots y e2e en el mismo change.
- Corregir las variantes arbitrarias mal formadas `[@media(max-height:400px):h-12]` del header, que hoy no generan CSS.

**Non-Goals:**

- Rediseñar el header de escritorio, la navegación o el menú móvil.
- Cambiar los FABs globales (`whatsapp-float-button`, `phone-fab`) más allá de la holgura del hero.
- Cambiar copy, contenido, API, backend, Firestore o variables de entorno.
- Reescribir `SolutionSection` o `DestacadosSection`: ya cumplen `sm:grid-cols-2`.
- Corregir el drift preexistente del e2e de `SolutionSection` (espera "Nuestras Soluciones" mientras el contenido dice "Nuestros Productos"); se reporta, no se mezcla.

## Decisions

### 1. Header: barra más alta en `sm`, logo contenido y centrado

Se sube la barra interna de `sm` a `sm:h-24` (96px) y se mantiene `py-2` (8px arriba/abajo), totalizando 112px en tablet. El logo conserva `sm:max-w-[240px]` pero pierde `sm:max-h-none`: con `max-h-full` y `sm:w-auto` su altura queda contenida en los 96px de la barra y su ancho efectivo ronda los 191px (mayor que el cap móvil de 160px) sin desbordar ni deformarse. Desde `lg` se restaura `lg:h-20` + `lg:max-h-none`, preservando el overflow 2× aceptado en desktop.

El enlace del logo pasa a `sm:flex sm:items-center` (y `lg:block`) para centrarlo verticalmente en tablet sin cambiar el alineado superior de escritorio. La hamburguesa fija se recentra con `sm:top-9` y conserva `lg:top-6`; en altura corta se añade `[@media(max-height:400px)]:top-1`.

También se corrigen las dos clases mal formadas `[@media(max-height:400px):h-12]` (barra interna y enlace del logo) a `[@media(max-height:400px)]:h-12`, para que el modo compacto de landscape realmente aplique.

**Alternativas descartadas:** centrar el logo con `flex` en todos los breakpoints (desplazaría el overflow de desktop hacia arriba); dejar la barra en 64px y reducir el logo a 160px (no resuelve el pedido de tamaño).

### 2. Buscador: ancho fijo del select, input flexible

En `sm` el select pasa de `sm:w-56` a `sm:w-64` (256px) con `sm:shrink-0`, y el input conserva `sm:flex-1 min-w-0`. El select no puede comprimirse ni ceder ancho al input, y "Todas las categorías" se muestra completo. El botón mantiene `shrink-0` y su layout actual. A 640px la fila queda aproximadamente 256px (select) + input flexible + botón (~136px), sin overflow.

**Alternativas descartadas:** `sm:w-auto` en el select (el ancho intrínseco de un `<select>` no es fiable entre navegadores); `grid-cols` en `sm` (el flex actual ya resuelve la fila y evita reestructurar el DOM).

### 3. Hero: CTA secundario sólido y holgura para los FABs

El CTA secundario pasa de `border-2 border-white text-white` (sin relleno) a `bg-white text-secondary border-2 border-white hover:bg-secondary hover:text-white`. El borde se conserva para mantener la silueta plana; el relleno blanco garantiza contraste WCAG AA sobre cualquier imagen del hero.

El wrapper interno de contenido añade `sm:pr-24` para que el texto no entre en la columna de los FABs (que ocupan ~24–80px desde el borde derecho) y `sm:pb-32` para dar aire inferior antes del `PanelHome`. El padding vive en un div interno porque `.container` está en la misma capa de utilidades y ganaría a un override sobre el elemento externo. No se tocan las posiciones globales de los FABs.

**Alternativas descartadas:** mover los FABs solo en la home (rompe la consistencia global); usar `bg-secondary/90` en el CTA (se confunde con el overlay del hero); ocultar los FABs en `sm` (pierde el contacto rápido).

### 4. Grillas de productos: dos columnas desde `sm`

`ServicesSection` cambia `grid-cols-1 md:grid-cols-2` a `grid-cols-1 sm:grid-cols-2`. `SolutionSection` y `DestacadosSection` ya declaran `sm:grid-cols-2`; se añade e2e a 640px para blindar el comportamiento y detectar regresiones, sin delta de spec.

**Riesgo asumido:** a 640px la tarjeta horizontal de servicios (imagen 2/5 + contenido) queda estrecha (~296px por tarjeta). Se valida que el título/descripción/CTA no desborden; si la legibilidad no alcanza, el fallback es mantener 2 columnas solo desde `md` y documentarlo.

### 5. Equipo: tres columnas desde `sm`

`NosotrosTeamSection` pasa de `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` a `grid-cols-1 sm:grid-cols-3`. La tarjeta central conserva `lg:translate-y-8` (solo desktop). Con el gap actual, a 640px cada tarjeta mide ~186px de ancho y ~246px de alto; el overlay con `p-6` deja ~138px útiles, por lo que nombres largos pueden envolver.

**Riesgo asumido:** a 640px la tarjeta puede verse apretada. Se valida que nombre/rol no desborden la tarjeta y que el texto siga legible. Si no cumple, el fallback es `sm:grid-cols-2 md:grid-cols-3`, que se decidirá con revisión visual antes de aplicar.

### 6. Estadísticas: bordes CSS deterministas en lugar de `gap-px`

Se reemplaza el grid `grid-cols-2 grid-rows-2 gap-px` sobre fondo primario por:

```text
stats-grid-wrap (relative flex-1)
  grid grid-rows-2 h-full w-full border border-primary divide-y divide-primary
    fila 1: grid grid-cols-2 divide-x divide-primary  -> cell 0 | cell 1
    fila 2: grid grid-cols-2 divide-x divide-primary  -> cell 2 | cell 3
```

Cada celda mantiene `bg-white p-4 md:p-8 lg:p-12 flex flex-col justify-center min-w-0`. `divide-x` en una fila de dos celdas aplica borde izquierdo solo a la segunda; `divide-y` en el contenedor de dos filas aplica borde superior solo a la segunda; el `border` exterior cierra el marco. Así los tres trazos son siempre de 1px y no dependen del redondeo de gaps.

Se conserva la clase `stats-grid-wrap` (locators y requisitos de estiramiento) pero se retira su `background-color: var(--color-primary)`, que ya no dibuja nada. Se actualizan el unit test y el e2e que hoy buscan `div.grid-cols-2` (pasarán a haber dos filas) usando `data-stats-row` o `.first()`.

**Alternativas descartadas:** `divide-x divide-y` directamente en el grid 2×2 (añade bordes incorrectos en la celda superior derecha e inferior izquierda); mantener `gap-px` con `border` exterior (no corrige el grosor irregular); separadores como elementos DOM (añade nodos y ruido accesible).

### 7. Matriz responsive con 640px

Se agregan `640×360` y `640×800` a la matriz de `responsive-layout` y a `apps/web/e2e/responsive-layout.spec.ts`. `640×360` es el caso más exigente (altura corta + ancho sm) y `640×800` valida el layout de tablet en portrait.

### 8. Orden TDD y actualización de artefactos

Primero se escriben/ajustan los tests fallidos (unit + e2e) contra los nuevos contratos, luego se cambian las clases y la estructura. Los snapshots se regeneran al final. Cualquier ajuste que aparezca durante la implementación se refleja primero en estas specs.

### 9. Modo compacto de altura acotado a anchos móviles

Revisión post-apply a `640×375` (teléfono grande rotado): las variantes `[@media(max-height:400px)]` se aplicaban también a anchos `>= 640px` y anulaban los contratos de `sm` — el header volvía a 48px con logo de 95×48 y el select bajaba a 176px truncando "Todas las categorías". Se acotan las variantes compactas del header (`py-0`, `h-12`, cap de logo de 100px, `top-1` de la hamburguesa) y el ancho compacto del select con el variant `max-sm:` combinado con la media query de altura. Resultado: en 640×375 el header es el tablet de 112px con logo ~191×96 y el select vuelve a 256px; en 568×320 (ancho `< 640px`) el modo compacto se conserva. El padding vertical compacto de la búsqueda sigue aplicando en todas las alturas cortas, así el grupo sticky a 640×375 queda en ~164px (44% de 375), por debajo del presupuesto del 50%.

### 10. Breakpoints declarados en `px` (root font-size independiente)

Tailwind v4 resuelve `sm:` a `--breakpoint-sm`, cuyo valor por defecto es `40rem`. Como `rem` en media queries se resuelve contra el `font-size` del elemento raíz, un navegador con root font-size 18px (común en accesibilidad) hace que `sm = 40rem × 18px = 720px`, desplazando todos los contratos de `sm` (header 112px, select 256px, grillas 2/3 columnas) a 720px CSS en vez de 640px. Eso fue exactamente lo que reportó el cliente: el cambio de columnas se veía "desde 720px".

Se declaran los breakpoints en `px` en el `@theme` de `apps/web/src/styles/globals.css` y su espejo `apps/admin/src/styles/globals.css`:

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

Así `sm` es siempre 640px CSS sin importar el tamaño de fuente del navegador. Con root 16px no hay cambio de comportamiento; con 18px (o cualquier otro) los breakpoints permanecen en sus anchos CSS nominales.

## Risks / Trade-offs

- **[Header de 112px en tablet reduce el espacio del sticky shell]** → A 640×360 el grupo sticky queda cerca del presupuesto del 50% (180px). Con la búsqueda compacta (`py-2`, controles de 36px) el grupo mide ~164px y cumple; el modo `max-height:400px` solo compacta el header por debajo de `sm` (568×320).
- **[Tres columnas de equipo a 640px aprietan el texto]** → Validar nombre/rol sin desborde; fallback documentado `sm:grid-cols-2 md:grid-cols-3` si la revisión visual lo exige.
- **[Dos columnas de servicios a 640px dejan tarjetas horizontales estrechas]** → Validar que el contenido no desborde; fallback a `md` si no cumple.
- **[Los FABs son `fixed` al viewport, no al hero]** → `sm:pr-24` evita el solapamiento horizontal; si en una altura muy corta el texto llega al borde inferior, se valida con el e2e de solapamiento y se ajusta el padding o el ancho del contenido.
- **[Cambios de estructura en `PanelHome` rompen locators y snapshots]** → Actualizar unit test, snapshot y e2e en el mismo commit; añadir `data-stats-row` para locators estables.
- **[Drift preexistente en e2e de `SolutionSection`]** → Se reporta como hallazgo separado; no se corrige en este change.
- **[Cambios de clase rompen snapshots de 6 componentes]** → Regenerar snapshots después de que los unit tests de contrato pasen.

## Migration Plan

1. Ajustar specs y tests unitarios/e2e (fase roja).
2. Implementar las clases/Estructura en los seis componentes y corregir las variantes arbitrarias del header.
3. Regenerar snapshots.
4. Verificar: `make lint`, `make typecheck`, `make test`, e2e de `site-header`, `search-form`, `hero-banner`, `panel-home`, `services-section`, `solution-section` y `responsive-layout`.
5. `npx openspec validate --all --strict`.
6. Despliegue estático habitual; sin migración de datos. Rollback: revertir clases/estructura y restaurar snapshots.

## Open Questions

Resueltas antes de `/opsx-apply`:

- **Header en tablet**: confirmado. Se aumenta la barra a 112px (`sm:h-24` + `py-2`) para dar aire al logo.
- **Servicios**: confirmado. Se prueban 2 columnas desde `sm`; si la revisión visual a 640px resulta ilegible, se aplica el fallback `md:grid-cols-2`.
- **Equipo**: confirmado. Se usa `sm:grid-cols-3` como se solicitó; si queda apretado, se aplica el fallback `sm:grid-cols-2 md:grid-cols-3` en la revisión visual.
- **Drift de `SolutionSection`**: se deja documentado como hallazgo para un change futuro; no se corrige en este change.
