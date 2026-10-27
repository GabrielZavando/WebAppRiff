# Tasks — catalog-rebuild-flush-scheduler

> Orden TDD: cada tarea de código empieza por su test fallido
> (`apps/backend`, Jest, cobertura ≥ 90 %). Código en inglés; los escenarios
> (a)–(h) referencian el delta de `generalize-catalog-rebuild-webhook`.

## 1. Contrato de entorno y dependencias

- [x] 1.1 Promover `google-auth-library` a dependencia explícita de `apps/backend/package.json` (misma versión que resuelve el lockfile: 9.15.1) y verificar `npm ci` + typecheck
- [x] 1.2 Test fallido: loader de config de rebuild (`CATALOG_REBUILD_SILENCE_SECONDS`, `CATALOG_REBUILD_MAX_WAIT_SECONDS`, `CATALOG_REBUILD_CLAIM_TTL_SECONDS` con defaults 60/300/60; `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE` y `CATALOG_REBUILD_FLUSH_EXPECTED_SA` opcionales con semántica fail-closed al faltar) en `src/catalog/`
- [x] 1.3 Implementar el loader de config y declarar las cinco variables nuevas en `.env.example` (raíz y backend) con comentarios de uso por entorno

## 2. Máquina de decisiones (domain, función pura)

- [x] 2.1 Test fallido: `decideFlush(state, now, config)` — casos sin estado, con claim vigente y con `nextAttemptAt` futuro → no-op/backoff
- [x] 2.2 Test fallido: condición de silencio (`now - lastChangeAt >= SILENCE`) y de max-wait (`now - firstChangeAt >= MAX_WAIT`) disparan claim (escenarios a y b, decisiones)
- [x] 2.3 Test fallido: claim vencido (`claimedAt < now - CLAIM_TTL`) es reclamable por un nuevo flush (escenario g)
- [x] 2.4 Implementar `decideFlush` en `src/catalog/domain/` (tipado completo, sin efectos)

## 3. Estado duradero en Firestore (port + adaptadores)

- [x] 3.1 Declarar el port `ICatalogRebuildStateStore` en `src/catalog/domain/` (leer estado, tomar claim transaccional, resolver claim: éxito con lote residual/limpieza, fallo con backoff) — contrato espejo del diseño D4
- [x] 3.2 Test fallido del adaptador Firestore (`FirestoreRebuildStateStore`): `recordChange` fija `firstChangeAt` solo con estado limpio y actualiza `lastChangeAt` (escenario: ediciones acumuladas en el mismo lote); no toca `claimedAt`/`nextAttemptAt`
- [x] 3.3 Test fallido del adaptador: transacción de claim serializa dos ejecuciones concurrentes — exactamente una reclama (escenario c, con fake de transacción Firestore)
- [x] 3.4 Test fallido del adaptador: resolución de éxito con ediciones en vuelo conserva lote residual con `firstChangeAt = claimedAt`; sin ediciones en vuelo borra el doc
- [x] 3.5 Test fallido del adaptador: resolución de fallo conserva `firstChangeAt` original y el `lastChangeAt` más reciente, e incrementa `failureCount`/`lastFailureAt`/`nextAttemptAt` con backoff `min(60s × 2^n, 15 min)` (escenarios d y h)
- [x] 3.6 Implementar `FirestoreRebuildStateStore` (Admin SDK, colección `catalog_rebuild_state`, doc `global`) y hacer pasar 3.2–3.5

## 4. Notifier buffering (mismo port, wiring intacto)

- [x] 4.1 Test fallido: `FirestoreBufferedCatalogChangeNotifier implements ICatalogChangeNotifier` — delega en `ICatalogRebuildStateStore.recordChange`, nunca lanza, no bloquea (contrato de `icatalog-change-notifier.contract.spec.ts` sigue pasando)
- [x] 4.2 Test fallido: con `CATALOG_REBUILD_WEBHOOK_URL` o `_TOKEN` sin configurar, el notifier registra warning nombrando la variable faltante y NO escribe estado (no-op observable)
- [x] 4.3 Implementar el notifier buffering y sustituir el provider en `categorias.module.ts` (`useClass`) — productos/categorías/subcategorías no cambian
- [x] 4.4 Reescribir `WebhookCatalogChangeNotifier` como `CoolifyRebuildWebhookClient` (dispatch puro: Bearer + timeout 5 s + `response.ok` + warnings sin secretos); migrar `webhook-catalog-change-notifier.spec.ts` al nuevo nombre y comportamiento

## 5. Guard OIDC app-side

- [x] 5.1 Test fallido: guard OIDC rechaza con 401 sin `Authorization`, con token no-ID-token y con firma inválida (fail-closed, escenarios f)
- [x] 5.2 Test fallido: firma válida con `aud` distinto de `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `email` distinto de `_EXPECTED_SA` o `email_verified` falso → 401 sin filtrar detalle del estado
- [x] 5.3 Test fallido: identidad válida (Google-signed, aud/email/email_verified correctos) → `next()`; con las variables `*_EXPECTED_*` ausentes → 401 + warning de config ausente
- [x] 5.4 Implementar `SchedulerOidcGuard` (`OAuth2Client.verifyIdToken` + checks explícitos) en `src/catalog/infrastructure/`

## 6. Servicio y endpoint de flush

- [x] 6.1 Test fallido: `CatalogRebuildFlushService` — decide con `decideFlush`, toma claim vía `ICatalogRebuildStateStore`, despacha con `CoolifyRebuildWebhookClient` FUERA de la transacción y resuelve éxito/fallo (escenarios a, b, d)
- [x] 6.2 Test fallido: crash simulado tras el claim (claim vencido en el siguiente ciclo) → el lote se re-claima y se reintenta (escenario g); respuesta del endpoint 2xx con `dispatched | no-op | backoff | claimed`, sin delegar reintentos al Scheduler
- [x] 6.3 Test fallido: controlador `POST /internal/catalog-rebuild/flush` con `SchedulerOidcGuard` (`@UseGuards`), path `internal/catalog-rebuild/flush` excluido del prefijo global en `main.ts` (mismo mecanismo que `'health'`)
- [x] 6.4 Test fallido: `HealthAwareThrottlerGuard` exime la ruta interna del throttling (extensión de `isThrottleExemptUrl`)
- [x] 6.5 Implementar servicio + controlador + registro en el módulo de catálogo; wiring de `I_CATALOG_REBUILD_STATE_STORE` y del cliente de dispatch en `categorias.module.ts`
- [x] 6.6 Log escalado: warning por fallo de dispatch y error cuando `failureCount >= 10` o antigüedad del lote > 24 h (sin dead-letter)

## 7. Infraestructura y documentación

- [x] 7.1 Actualizar `docs/deploy-standards.md`: tabla de variables nuevas (con defaults y alcance por entorno), sección del flush (SA dedicada + `roles/run.invoker` como defensa en profundidad, gate real app-side) y job de Cloud Scheduler (`*/1 * * * *`, POST, `--oidc-token-audience` explícito, sin retryConfig) con comandos `gcloud` por entorno
- [x] 7.2 Actualizar `docs/runbooks/backend-staging-cloud-run.md`: nueva subsección "Activar el flush programado del rebuild" (crear SA, otorgar `roles/run.invoker`, crear job, verificación end-to-end, `gcloud scheduler jobs pause/resume` para rollbacks) y reordenar el paso 5.1 para que el deploy del backend preceda a la creación del job (gap de staleness mínimo)
- [x] 7.3 Verificar que ninguna referencia a un webhook inmediato por edición queda en docs (`grep` de "rebuild webhook" en `docs/`) y que `CATEGORIES_WEBHOOK_URL` sigue sin referencias

## 8. Validación final

- [x] 8.1 `npx openspec validate --all --strict` sin errores
- [x] 8.2 `make ci` en verde (lint + typecheck + build + test-ci con cobertura ≥ 90 % + audit)
- [x] 8.3 Prueba manual en local: mutación de catálogo → doc de estado en Firestore (emulador) → flush con token OIDC de prueba → un único dispatch al webhook stub
