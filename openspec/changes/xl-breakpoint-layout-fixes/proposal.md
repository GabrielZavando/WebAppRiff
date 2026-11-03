## Why

En el breakpoint `xl:` (>= 1280px) del sitio público (`apps/web`, Astro SSG) faltan ajustes de layout que ya se aplicaron en `lg:`: el botón "Scroll to Top" del footer queda a la izquierda de "SANTIAGO, CHILE" en vez de a su derecha, el bloque flotante de estadísticas del home se desplaza hacia abajo (`lg:mt-20`) en lugar de superponerse al banner, y varias tarjetas de sección se quedan en 2 columnas (`lg:grid-cols-2`) cuando en pantallas anchas caben 4 (o 3 en marcas de representaciones). Este change lleva esos ajustes al breakpoint `xl:` para que el sitio aproveche el ancho de escritorio grande sin romper los breakpoints menores.

## What Changes

- **Footer (`Footer.astro`)**: el botón `[data-scroll-top]` se renderiza a la derecha del texto "SANTIAGO, CHILE" en la barra inferior (`xl:`), invirtiendo el orden actual (botón primero, ubicación segunda) a ubicación primero, botón segundo.
- **Panel home (`PanelHome.astro`)**: la caja flotante de estadísticas se mueve hacia arriba al menos 5rem en `xl:` (`xl:-mt-20`) para superponerse al banner principal, manteniendo `lg:mt-20` en `lg:`.
- **Página de Inicio**: las secciones "Nuestros Productos" (`SolutionSection`), "Servicios especializados" (`ServicesSection`) y "Soluciones Destacadas" (`DestacadosSection`) pasan a 4 columnas en `xl:` (`xl:grid-cols-4`, sobre su `lg:grid-cols-2` actual).
- **Página de Nosotros (`NosotrosValueProp.astro`)**: las 4 tarjetas de pilares bajo "¿Qué nos define?" y las 4 tarjetas de sectores bajo "Presencia Sólida en Industrias Críticas" pasan a 4 columnas en `xl:` (`xl:grid-cols-4`, sobre `lg:grid-cols-2`).
- **Página de Servicios (`servicios.astro`)**: las 2 secciones (Portafolio de Productos / `ServiciosPortafolioSection` y Servicios Especializados / `ServiciosTerrenoSection`) muestran sus tarjetas en 4 columnas en `xl:` (`xl:grid-cols-4`; la sección 1 deja su lista vertical para convertirse en grid).
- **Página de Representaciones (`representaciones.astro`)**: la sección "Marcas de Representación Exclusiva" pasa a 3 columnas en `xl:` (`xl:grid-cols-3`, sobre su apilamiento actual en columna) y la sección "¿Por qué adquirir a través del representante oficial en Chile?" (`ValuePropCard`) pasa a 4 columnas en `xl:` (`xl:grid-cols-4`, sobre `lg:grid-cols-2`).
- **Tests y snapshots**: se actualizan las afirmaciones de orden botón/ubicación del footer, la afirmación de offset `lg:mt-20`/`-mt-2` del panel home, y los snapshots de marcado afectados (footer, panel-home, destacados, solución, servicios).

## Capabilities

### New Capabilities
- `xl-breakpoint-layout`: ajustes de layout exclusivos del breakpoint `xl:` (>= 1280px) en el frontend público (footer, home, nosotros, servicios, representaciones). Crea `openspec/specs/xl-breakpoint-layout/spec.md` como delta de requerimientos.

### Modified Capabilities
- (ninguno: los ajustes son de detalle de layout dentro de la nueva capacidad `xl-breakpoint-layout`, no cambian requisitos de capacidades existentes aparte de este delta)

## Impact

- Código afectado: `apps/web/src/components/Footer.astro`, `PanelHome.astro`, `SolutionSection.astro`, `ServicesSection.astro`, `DestacadosSection.astro`, `NosotrosValueProp.astro`, `ServiciosPortafolioSection.astro`, `ServiciosTerrenoSection.astro`, `apps/web/src/pages/representaciones.astro`.
- Tests afectados: `apps/web/src/components/__tests__/Footer.test.ts`, `PanelHome.test.ts` y snapshots asociados (`Footer.test.ts.snap`, `PanelHome.test.ts.snap`, `DestacadosSection.test.ts.snap`, `SolutionSection.test.ts.snap`, `ServicesSection.test.ts.snap`).
- No hay cambios de API, dependencias ni contratos de datos; solo clases de utilidad de Tailwind y orden de nodos en el DOM.
