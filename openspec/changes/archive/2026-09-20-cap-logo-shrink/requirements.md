# Requirements — cap-logo-shrink

- **R1. Alto mínimo desktop del logo en estado compacto**: en viewport ≥ 640px con `data-scrolled="true"`, el alto renderizado del logo (`.site-logo`) debe ser ≥ 100px con ancho automático que preserve el aspect ratio. (Trazable a SC-001)
- **R2. Restauración al tope**: al volver a scrollY = 0 el logo vuelve a su cap completo de 300px en desktop sin efectos colaterales en el resto del estado compacto. (Trazable a SC-002)
- **R3. Invariancia mobile**: la regla mobile existente (150px en estado compacto) permanece sin cambios. (Trazable a SC-003)
- **R4. Accesibilidad**: `prefers-reduced-motion: reduce` sigue deshabilitando la transición del logo. (Trazable a SC-004)
- **R5. Sin valores mágicos sin documentar**: la regla CSS resultante debe llevar un comentario que explique el mínimo de 100px y, si se materializa vía `max-width`, el razonamiento de equivalencia con el aspect ratio del asset (330×134). (Trazable a SC-001; estándar frontend: no magic values)
