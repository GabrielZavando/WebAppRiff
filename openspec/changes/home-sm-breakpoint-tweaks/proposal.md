## Why

En el breakpoint `sm` (≥ 640px, tablet pequeña o móvil en horizontal) la página de Inicio (`/`) presenta tres desajustes de composición pendientes: el botón del buscador sigue mostrando el texto "BUSCAR" y consume un ancho excesivo en una fila de controles que ya es ajustada; las tarjetas de "Servicios especializados" se muestran en horizontal (imagen a la izquierda), lo que comprime el texto de la descripción en columnas de 640–768px; y el texto superpuesto sobre las fotos de "Liderazgo & Experiencia" ocupa demasiado espacio sobre la imagen, restándole protagonismo al equipo. Ajustar estos tres puntos en `sm` completa la ronda de tweaks responsive del home (base, `sm` y escritorio) sin alterar el diseño móvil base ya validado.

## What Changes

- **Buscador (`SearchForm.astro`)**: desde `sm` el botón submit muestra únicamente el ícono de la lupa (el texto "BUSCAR" deja de ser visible), con ancho máximo de 60px (`sm:max-w-[60px]`) y padding horizontal compacto. El `<select>` de categorías y el `<input>` de texto dejan de usar anchos fijos/asimétricos y se reparten el espacio restante de forma equitativa (`sm:flex-1 sm:min-w-0` en ambos). El nombre accesible del botón se conserva siempre como "BUSCAR" mediante `aria-label`.
- **Sección "Servicios especializados" (`ServicesSection.astro`)**: desde `sm` las 4 tarjetas adoptan un layout estrictamente vertical, con el orden imagen (proporción 5:4) → título → descripción → CTA; se elimina la variante horizontal con imagen a `w-2/5`. La grilla de 2 columnas desde `sm` y la比例 5:4 se mantienen.
- **Sección "Liderazgo & Experiencia" (`NosotrosTeamSection.astro`)**: desde `sm` el nombre superpuesto sobre la foto reduce su tamaño de fuente (`text-xl` → `sm:text-lg`) y el cargo reduce el suyo (`text-xs` → `sm:text-[0.625rem]`), dejando más espacio visual a la fotografía. El breakpoint base (`< 640px`) conserva los tamaños actuales.
- **Cobertura de tests**: se actualizan los unit tests y snapshots del buscador y de "Servicios especializados" (afectados por el markup), y se ajustan los e2e que asertan el layout horizontal de las tarjetas, la clase `sm:px-8` del botón y la presencia del `<span>` de la etiqueta.
- **Copy del buscador**: el placeholder por defecto del `<input>` de búsqueda pasa de "¿Qué productos estás buscando?" a "¿Qué estás buscando?" en todas las páginas que renderizan el buscador global (Inicio, Productos, Servicios, Cotización y detalle de producto).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `search-form`: el botón submit pasa a ser solo-ícono con ancho máximo de 60px desde `sm`, select e input se reparten el ancho restante de forma equitativa desde `sm`, y el placeholder por defecto del input pasa a "¿Qué estás buscando?".
- `services-section`: la tarjeta deja de ser horizontal en `sm` y pasa a un layout vertical estricto (imagen → título → descripción → CTA).
- `team-section`: el texto superpuesto sobre la foto (nombre y cargo) reduce su tamaño de fuente desde `sm`.

## Impact

- Componentes: `apps/web/src/components/SearchForm.astro`, `apps/web/src/components/ServicesSection.astro`, `apps/web/src/components/NosotrosTeamSection.astro`.
- Configuración: `apps/web/src/lib/config/search-form.ts` (placeholder por defecto) y `apps/web/src/lib/types/search-form.ts` (doc del tipo); `apps/web/.env.example` (valor de ejemplo de `SEARCH_PLACEHOLDER`).
- Tests: unit tests y snapshots de `SearchForm` y `ServicesSection`; unit tests de `lib/config/search-form` y `lib/types/search-form`; e2e `search-form.spec.ts`, `services-section.spec.ts` y `responsive-layout.spec.ts`.
- El breakpoint base (`< 640px`) no cambia en comportamiento observable; los requisitos existentes que fijaban el ancho fijo del select (`sm:w-64`) y el texto visible del botón desde `sm` quedan supersedidos por este change.
- Sin cambios de API, backend, Firestore, dependencias, variables de entorno ni infraestructura.
