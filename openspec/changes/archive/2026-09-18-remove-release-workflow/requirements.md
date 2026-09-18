# Requirements: remove-release-workflow

1. **R1 — Sin workflow de publicación**: el repositorio no debe contener un workflow que publique el paquete raíz en GitHub Packages en push a `main`. (SC-001)
2. **R2 — Gate de CI preservado**: la validación de pushes a `main` y PRs debe seguir provista por `ci.yml` sin regresiones. (SC-002)
3. **R3 — Deploy por tags preservado**: el flujo de despliegue por tags `v*`/manual (`deploy.yml`) no debe verse afectado. (SC-003)

Traceability: R1→SC-001; R2→SC-002; R3→SC-003.
