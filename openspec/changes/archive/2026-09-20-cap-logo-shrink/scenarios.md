# Scenarios — cap-logo-shrink

Mapeados 1:1 desde los Acceptance Criteria de openspec/tickets/LOGO-SIZE-enriched.md.

### SC-001: Desktop — logo reducido no baja de 100px de alto
- Given el header en la parte superior de la página en viewport desktop (ancho ≥ 640px)
- When el usuario hace scroll hacia abajo y el body entra en estado `data-scrolled="true"`
- Then el logo se reduce, pero su alto renderizado es ≥ 100px y su ancho es automático preservando el aspect ratio del asset

### SC-002: Volver al tope restaura el logo a tamaño completo
- Given el logo en estado reducido tras hacer scroll en desktop
- When el usuario vuelve al tope de la página (scrollY = 0)
- Then el logo retorna a su tamaño completo (cap `max-width: 300px`) y el resto del estado compacto se revierte sin cambios

### SC-003: Mobile conserva su comportamiento actual
- Given un viewport mobile (< 640px)
- When el usuario hace scroll
- Then el logo en mobile sigue reduciéndose según la regla vigente de mobile (150px), sin alteraciones por el cambio desktop

### SC-004: prefers-reduced-motion respeta la ausencia de transición
- Given un usuario con `prefers-reduced-motion: reduce`
- When hace scroll y el logo cambia de tamaño
- Then el cambio de tamaño ocurre sin transición animada
