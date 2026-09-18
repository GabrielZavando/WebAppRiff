# Tasks: migrate-product-images

### T1 — Puerto y servicio de validación de accesibilidad de URLs
- **Priority**: high
- **Layer**: domain + application
- **Estimate**: S
- **Requirement**: R1
- **Scenarios**: SC-002, SC-004
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/ports.ts (nuevo puerto `UrlAccessibilityPort`) + servicio de validación en el use case
- **Test Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.use-case.spec.ts
- Subtasks:
  - [x] 1. Escribir test fallido: URL que responde 403 no se persiste en Firestore y queda como fallo en el reporte
  - [x] 2. Declarar `UrlAccessibilityPort` (método `isAccessible(url): Promise<boolean>`) en ports.ts, sin imports de infraestructura
  - [x] 3. Integrar la validación en `MigrateImagenesUseCase` antes de persistir `galeria`
  - [x] 4. Tests verdes; refactor

### T2 — Adapter HTTP de validación HEAD
- **Priority**: high
- **Layer**: infrastructure
- **Estimate**: XS
- **Requirement**: R1
- **Scenarios**: SC-002
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/url-accessibility.adapter.ts (nuevo)
- **Test Path**: apps/backend/src/cli/migrate-imagenes/url-accessibility.adapter.spec.ts (nuevo)
- Subtasks:
  1. [x] Escribir test fallido del adapter (200 → true; 403/404 → false; timeout → false)
  2. [x] Implementar HEAD request con timeout y sin seguimiento de body
  3. [x] Registrar provider por token en `migrate-imagenes.module.ts`

### T3 — Servicio de notificación de rebuild del sitio
- **Priority**: medium
- **Layer**: application + infrastructure
- **Estimate**: S
- **Requirement**: R4
- **Scenarios**: SC-005
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/rebuild-notifier.service.ts (nuevo) + integración al final de `migrate-imagenes.use-case.ts`
- **Test Path**: apps/backend/src/cli/migrate-imagenes/rebuild-notifier.service.spec.ts (nuevo)
- Subtasks:
  1. [x] Escribir test fallido: tras migración con cambios, POST a `CATALOG_REBUILD_WEBHOOK_URL`; sin cambios, no se dispara
  2. [x] Implementar servicio inyectado por abstracción (sin lógica de Coolify hardcodeada)
  3. [x] Manejar fallo del webhook: warning e indicación de rebuild manual en el reporte, sin abortar

### T4 — Reintento de omitidos y reporte completo
- **Priority**: high
- **Layer**: application
- **Estimate**: S
- **Requirement**: R2, R3
- **Scenarios**: SC-003, SC-004
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.use-case.ts
- **Test Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.use-case.spec.ts
- Subtasks:
  1. [x] Escribir test fallido: producto omitido previamente se reintenta; ya migrado no duplica objetos
  2. [x] Ajustar clasificación del reporte (migrado / omitido-con-motivo / fallido con causa)
  3. [x] Asegurar que toda URL persistida pasó la validación de T1

### T5 — Fail-fast de configuración
- **Priority**: medium
- **Layer**: infrastructure
- **Estimate**: XS
- **Requirement**: R5
- **Scenarios**: SC-006
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.module.ts
- **Test Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.module.spec.ts
- Subtasks:
  1. [x] Escribir test fallido: sin `FIREBASE_STORAGE_BUCKET` el bootstrap falla con mensaje explícito
  2. [x] Validar todas las variables requeridas antes de cualquier escritura

### T6 — Respeto de reglas de dominio (máx. 10, URLs absolutas)
- **Priority**: medium
- **Layer**: application
- **Estimate**: XS
- **Requirement**: R6
- **Scenarios**: SC-001, SC-004
- **Suggested Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.use-case.ts
- **Test Path**: apps/backend/src/cli/migrate-imagenes/migrate-imagenes.use-case.spec.ts
- Subtasks:
  1. [x] Test fallido: producto con >10 imágenes se trunca a 10 con nota en reporte; URL relativa nunca se persiste
  2. [x] Implementar guard y documentar en reporte

### T7 — Ejecución y verificación en staging
- **Priority**: high
- **Layer**: infrastructure (operación)
- **Estimate**: S
- **Requirement**: R7
- **Scenarios**: SC-001, SC-002, SC-005
- **Suggested Path**: no aplica (ejecución operativa del CLI; evidencia en reporte)
- **Test Path**: no aplica (verificación manual con curl y navegador)
- Subtasks:
  1. Configurar variables Firebase en el entorno de staging del CLI
  2. Verificar muestra de URLs del hosting legacy (pre-chequeo)
  3. Ejecutar migración; verificar reporte sin omitidos sin motivo
  4. curl a URLs persistidas (200, image/webp)
  5. Confirmar rebuild del sitio y verificar imágenes en listado y detalle de staging

Dependencias: T2→T1; T1→T4; T3 independiente; T5/T6 independientes; T7 requiere T1-T6.

## Mandatory Steps

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de implementación ejecutada vía `/apply`.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [ ] La **rama activa** sigue la convención vigente del proyecto (`feature/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit`: sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
