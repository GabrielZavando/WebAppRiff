# Requirements: migrate-product-images

1. **R1 — Validación de accesibilidad pública**: antes de persistir cada entrada en `galeria`, el sistema debe verificar con un HEAD request que la URL responde 200; si no, no persistir y registrar el fallo. (SC-002, SC-004)
2. **R2 — Reintento de omitidos**: al re-ejecutar, los productos previamente omitidos por error deben reintentarse y los ya migrados deben omitirse sin duplicar objetos en Storage. (SC-003)
3. **R3 — Reporte completo**: el reporte final debe clasificar cada producto (migrado / omitido-con-motivo / fallido) sin entradas omitidas sin motivo. (SC-003, SC-004)
4. **R4 — Notificación de rebuild**: al finalizar la migración con cambios, el CLI debe disparar `CATALOG_REBUILD_WEBHOOK_URL` vía un servicio dedicado inyectado por abstracción; si el webhook falla, loguear warning y reportarlo sin abortar la migración ya exitosa. (SC-005)
5. **R5 — Fail-fast de configuración**: el CLI debe validar al inicio la presencia de toda la configuración requerida (`FIREBASE_STORAGE_BUCKET` y credenciales Firebase) y abortar con mensaje explícito antes de cualquier escritura si falta algo. (SC-006)
6. **R6 — Respeto del dominio**: la migración debe respetar el máximo de 10 imágenes por producto y nunca persistir URLs relativas en `galeria`. (SC-001, SC-004)
7. **R7 — Verificación end-to-end en staging**: completada la migración y el rebuild, se debe verificar en staging que las imágenes responden 200 y se renderizan en cards y detalle. (SC-001, SC-002, SC-005)

Traceability: R1→SC-002/SC-004; R2→SC-003; R3→SC-003/SC-004; R4→SC-005; R5→SC-006; R6→SC-001/SC-004; R7→SC-001/SC-002/SC-005.
