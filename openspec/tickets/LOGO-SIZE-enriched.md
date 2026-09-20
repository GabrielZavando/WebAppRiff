# Enriched Ticket — LOGO-SIZE

## User Story enriched: LOGO-SIZE

**As a** visitante del sitio web de Riff (catalogo.riff.cl)
**I want** que el logo del header no se achique tanto al hacer scroll, manteniendo un alto mínimo de 100px en desktop
**So that** la marca siga siendo visible y reconocible mientras navego la página.

**Capas afectadas**: `frontend` (apps/web — Astro + CSS)

### Context

El header del sitio (`apps/web/src/components/Header.astro`) entra en un estado "compacto" al hacer scroll: `createHeaderScrollState.ts` (lib/scroll) togglea `data-scrolled="true"` en `document.body` (threshold = 0, estado binario) y `apps/web/src/styles/header-scroll.css` aplica las transiciones. El shrink del logo es **100% CSS**: `.site-logo` transiciona su `max-width` de 300px → 200px en desktop (≥640px) y de 200px → 150px en mobile. La altura resulta de `h-auto` según el aspect ratio del asset (`logo-web.webp`, 330×134 ≈ 2.46:1), por lo que hoy el logo reducido queda ~81px de alto en desktop (200px de ancho), valor percibido como demasiado pequeño.

Evidencia del comportamiento actual:
- `apps/web/src/styles/header-scroll.css` líneas 55–68 (reglas de shrink).
- Tests E2E afectados: `apps/web/e2e/site-header-scroll.spec.ts` (asserts `max-width: 200px` desktop, `150px` mobile).

El resto del estado compacto (fondo navy `--color-secondary`, sombra del sticky shell) NO cambia.

### Diseño de Clases/Componentes

- `.site-logo` (regla CSS en `header-scroll.css`): responsabilidad única = "limitar el encogimiento del logo en estado compacto garantizando altura ≥ 100px en desktop con ancho automático"
  - Depende de: tokens/variables del design system y clases utilitarias, NO de valores mágicos hardcodeados sin comentario
  - Capa: dumb (presentacional, CSS puro)
- `createHeaderScrollState` (lib/scroll): **sin cambios** — el estado compacto es binario y solo togglea el atributo; el ajuste es exclusivamente de CSS.
  - Depende de: abstracciones `ScrollStateHost`/`ScrollStateTarget` inyectables (ya existentes, SSR-safe)
  - Capa: application (frontend)

### Acceptance Criteria

#### SC-001: Desktop — logo reducido no baja de 100px de alto
- Given el header en la parte superior de la página en viewport desktop (ancho ≥ 640px)
- When el usuario hace scroll hacia abajo (estado compacto, `data-scrolled="true"`)
- Then el logo se reduce pero su alto renderizado es ≥ 100px y su ancho es automático (mantiene el aspect ratio del asset)

#### SC-002: Volver al tope restaura el logo
- Given el logo en estado reducido tras hacer scroll
- When el usuario vuelve al tope de la página (scrollY = 0)
- Then el logo retorna a su tamaño completo (max-width 300px en desktop) sin cambios en el resto del estado compacto

#### SC-003: Mobile no se degrada
- Given un viewport mobile (< 640px)
- When el usuario hace scroll
- Then el comportamiento actual del logo en mobile se mantiene intacto (shrink 200px → 150px) salvo que el cambio desktop lo afecte colateralmente, en cuyo caso mobile conserva su comportamiento actual

#### SC-004: Accesibilidad — reduced motion
- Given un usuario con `prefers-reduced-motion: reduce`
- When hace scroll y el logo cambia de tamaño
- Then el cambio ocurre sin transición animada (comportamiento existente preservado)

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Header chico (h-24 = 96px) vs logo ≥100px | El logo puede desbordar visualmente con overflow visible (patrón ya usado hoy por el logo 2x) sin agrandar el header — validar en planificación |
| Aspect ratio del asset cambia | El criterio es sobre el alto renderizado (≥100px), no sobre un max-width fijo, para no acoplar al asset |
| Scroll parcial / threshold 0 | Estado binario existente: cualquier scroll > 0 activa el estado compacto; no hay tamaños intermedios |
| Breakpoint exacto 640px | La regla desktop aplica en ≥640px (`@media (min-width: 640px)`), igual que hoy |

### Estimación
Complejidad: **XS**
Justificación: ajuste de una regla CSS existente + actualización de tests E2E que assertan el valor anterior (200px).

### Riesgo
Nivel: **Bajo**
Motivo: cambio acotado a `header-scroll.css`; riesgo principal es visual (overflow del logo sobre el header de 96px de alto) y romper los E2E existentes si no se actualizan.

### Dependencias
Tickets relacionados: ninguno.

### Alternativas descartadas
- Alternativa: eliminar el shrink por completo (logo siempre a tamaño completo).
  Motivo del descarte: pierde el gesto de diseño del header compacto; el pedido es solo acotar el encogimiento.
- Alternativa: manejar el tamaño con JS inline styles en `createHeaderScrollState`.
  Motivo del descarte: el mecanismo actual es CSS puro (estado binario + transitions); mover lógica de presentación a JS rompe la separación y dificulta el SSR.

### Technical Considerations

- Archivo objetivo principal: `apps/web/src/styles/header-scroll.css` (regla `body[data-scrolled='true'] .site-logo` dentro de `@media (min-width: 640px)`).
- Implementación esperada: garantizar alto ≥ 100px con ancho automático en el estado compacto desktop. El alto es el criterio contractual; si se implementa vía `max-width`, con el asset actual 330×134 equivale aprox. a 246px, pero NO debe hardcodearse el ancho como contrato: documentar el razonamiento si se elige ese camino.
- No usar hex crudos ni valores mágicos sin comentario (frontend-standards).
- Tests a actualizar (TDD — primero el test fallido):
  - `apps/web/e2e/site-header-scroll.spec.ts`: el assert de `max-width: 200px` en desktop pasa a verificar alto ≥ 100px (o el nuevo mecanismo elegido).
  - Revisar asserts relacionados en `apps/web/e2e/site-header.spec.ts` si aplican.
  - Mobile (`150px`) se mantiene: su E2E debe seguir en verde.
- Sin cambios de API, data model, ni backend. Sin cambios en `createHeaderScrollState.ts`.

### Definition of Done

- [ ] Tests E2E actualizados escritos primero y pasando (`site-header-scroll.spec.ts`)
- [ ] Regla CSS ajustada en `header-scroll.css` con comentario que documente el mínimo de 100px
- [ ] E2E mobile existente sigue en verde
- [ ] Verificación visual desktop: logo reducido ≥100px de alto, header sin growth ni CLS brusco
- [ ] Artefactos OpenSpec actualizados tras `/apply`
- [ ] Code review aprobado
- [ ] `bash check-refs.sh` y `bash specboot.sh --ci` en 0 errores si se tocan archivos del framework (no esperado)

### Questions for Clarification

1. (Resuelta) Mínimo desktop: 100px de alto, ancho automático — confirmado por el usuario.
2. (Abierta, no bloqueante) ¿El mínimo de 100px aplica también a mobile? Por defecto NO: mobile conserva su comportamiento actual; confirmar en `/plan-change` si se desea lo contrario.
