# Design — catalog-rebuild-flush-scheduler

## Context

El backend NestJS (Cloud Run, `--allow-unauthenticated`, `minScale=0`,
`maxScale=2`, CPU throttling, concurrencia 80) notifica cambios de catálogo
vía el port `ICatalogChangeNotifier`
(`apps/backend/src/catalog/domain/icatalog-change-notifier.ts`) implementado por
`WebhookCatalogChangeNotifier`
(`apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`):
un `fetch` POST inmediato al deploy webhook de Coolify
(`CATALOG_REBUILD_WEBHOOK_URL` + Bearer `CATALOG_REBUILD_WEBHOOK_TOKEN`,
timeout 5 s, fire-and-forget). Cada edición produce un deploy completo; no hay
coalescencia.

El provider del notifier vive en `categorias.module.ts` (exportado por token
`I_CATALOG_CHANGE_NOTIFIER`) y es consumido por los servicios de escritura de
productos, categorías y subcategorías a través de la importación de
`CategoriasModule`.

Restricciones que motivan el diseño:

- Cloud Run escala a cero y throttles CPU: **un temporizador en memoria no es
  fiable** (puede no ejecutarse nunca o con retraso arbitrario) y con dos
  instancias habría doble disparo.
- No hay CDN; el build de Coolify tarda 3–4 min y no deben solaparse deploys.
- El gate de autenticación debe ser app-side: el servicio acepta peticiones
  anónimas (`--allow-unauthenticated`), por lo que `roles/run.invoker` no
  filtra nada a nivel IAM.
- `google-auth-library@9.15.1` ya está en el árbol (transitiva de
  `firebase-admin`); solo falta promoverla a dependencia explícita.

## Goals / Non-Goals

**Goals:**

- Coalescer ráfagas de ediciones en **un único deploy de Coolify**, con
  staleness peor caso ≈ max-wait + build ≈ 9 min (tolerancia: 10 min).
- Estado de rebuild **duradero en Firestore**: inmune a scale-to-zero, crashes
  y a instancias concurrentes.
- Disparo del webhook protegido por **verificación OIDC app-side** del
  Cloud Scheduler (fail-closed).
- Reintentos con **backoff acotado y sin dead-letter**; estado pendiente jamás
  se pierde por un fallo del webhook.
- Mantener el port `ICatalogChangeNotifier` y sus emisores intactos (mismo
  wiring DI, cero cambios en productos/categorías/subcategorías).

**Non-Goals:**

- Invalidación de caché del sitio (el sitio sigue SSG con rebuild completo).
- Cambiar el destino, formato o payload del webhook de Coolify.
- Cualquier cambio en `apps/web`, `apps/admin`, la API pública `/api/v1`, o el
  `Dockerfile` del backend.
- Índices compuestos o reglas de seguridad de Firestore (documento único
  accedido vía Admin SDK, que las ignora).

## Decisions

### D1 — Estado en Firestore + Cloud Scheduler (no temporizadores en memoria)

`notifyChange()` escribe en un documento único de Firestore; un job de Cloud
Scheduler (`*/1 * * * *`) invoca un endpoint interno que decide y dispara.

- Alternativa descartada (a): `DebouncedWebhookCatalogChangeNotifier` en
  memoria — no fiable con `minScale=0` (la instancia puede morir con el timer
  pendiente), CPU throttling (retrasos arbitrarios) y 2 instancias (doble
  deploy).
- Alternativa descartada (b): colas/tareas GCP (Cloud Tasks, Pub/Sub) — añade
  un servicio nuevo para un problema de una fila; Firestore + Scheduler usa
  infraestructura que el backend ya opera.
- Trade-off aceptado: el Scheduler pinguea cada minuto → mantiene una
  instancia caliente la mayor parte del tiempo (coste marginal, beneficio
  colateral: menos cold starts para el tráfico público).

### D2 — Modelo del documento de estado

Colección `catalog_rebuild_state`, documento `global` (id fijo). Campos:

| Campo | Semántica |
| --- | --- |
| `firstChangeAt` | Inicio del lote; se fija solo si el estado estaba limpio |
| `lastChangeAt` | Último cambio recibido |
| `claimedAt` + `claimId` | Claim del flush en curso (con vencimiento) |
| `failureCount`, `lastFailureAt`, `nextAttemptAt` | Backoff tras fallos |

- El doc se lee/escribe con Admin SDK → **ignora security rules**; doc único →
  **sin índices compuestos**.
- Contención: transacciones sobre un doc caliente soportan el volumen humano
  del catálogo (≤ 90 productos, ediciones esporádicas/ráfagas de carga) con
  holgura; los reintentos internos de transacción de Firestore cubren colisiones.
- Máquina de decisiones como **función pura** (`decideFlush(state, now, config)`
  → `noop | backoff | claim`) en `domain/`, testeada sin Firestore; el
  adaptador Firestore es fino.

### D3 — Notificador buffering + cliente de dispatch separado

- Nuevo `FirestoreBufferedCatalogChangeNotifier implements ICatalogChangeNotifier`:
  transacción que fija `firstChangeAt` solo si el estado estaba limpio,
  actualiza `lastChangeAt`, y **omite el buffering si el webhook no está
  configurado** (warning observable, misma semántica de no-op que hoy). No
  toca `claimedAt` ni `nextAttemptAt`.
- `WebhookCatalogChangeNotifier` se reescribe como **cliente de dispatch**
  (`CoolifyRebuildWebhookClient`) usado por el servicio de flush: conserva
  Bearer + `content-type: application/json`, timeout 5 s, inspección de
  `response.ok`, warnings sin filtrar secretos.
- Wiring: se sustituye `useClass` en `categorias.module.ts`; los demás módulos
  no cambian (consumen el token exportado).

### D4 — Patrón claim → dispatch → clear (webhook fuera de la transacción)

Flujo del flush (`POST /internal/catalog-rebuild/flush`):

1. **Transacción de decisión**: lee el doc; si no hay estado → no-op; claim
   vigente → no-op; `nextAttemptAt` futuro → no-op; si
   `now - lastChangeAt >= SILENCE` o `now - firstChangeAt >= MAX_WAIT` → fija
   `claimedAt`/`claimId` (claim). **No limpia el estado.**
2. **Dispatch fuera de la transacción**: POST a Coolify (D3).
3. **Transacción de resolución** (condicionada a `claimId` propio):
   - Éxito: si `lastChangeAt > claimedAt` (llegaron ediciones en vuelo) →
     conserva lote residual con `firstChangeAt = claimedAt` (reinicia el reloj
     de max-wait para no solapar builds); si no → borra el doc.
   - Fallo: libera el claim, `failureCount++`, `lastFailureAt = now`,
     `nextAttemptAt = now + min(60s × 2^failureCount, 15 min)`; conserva
     `firstChangeAt` original y el `lastChangeAt` más reciente del doc (las
     ediciones en vuelo ya se fusionaron vía D3).
- Claim vencido (`claimedAt < now - CLAIM_TTL`, default 60 s > timeout del
  webhook) puede ser tomado por un flush posterior → un crash post-claim no
  atrapa el lote.
- Semántica **at-least-once**: un crash entre éxito del webhook y limpieza
  produce a lo sumo un deploy duplicado en el siguiente ciclo (aceptado: el
  rebuild de Coolify es idempotente y el coste es un build).
- El endpoint responde 2xx con el resultado (`dispatched | no-op | backoff |
  claimed`); los reintentos son responsabilidad del backoff, **no** del
  Scheduler (job sin `retryConfig`).

### D5 — Gate OIDC app-side con google-auth-library

- Guard NestJS en la ruta interna: `OAuth2Client.verifyIdToken({ idToken,
  audience: CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE })` (verifica firma contra
  los JWKs públicos de Google, `exp` y `aud`) + checks explícitos
  `payload.email === CATALOG_REBUILD_FLUSH_EXPECTED_SA` y
  `payload.email_verified === true`. Fail-closed → 401 sin detalles del estado.
- El job fija `--oidc-token-audience` explícitamente (el servicio tiene varias
  URLs: `*.run.app` y, si aplica, dominio); la audience esperada es config por
  entorno, no secreto.
- `roles/run.invoker` a la SA del Scheduler: se otorga y documenta como
  defensa en profundidad (y prerequisite si algún día se pasa a
  `--no-allow-unauthenticated`), pero **no es el gate**.
- `google-auth-library` se promueve a dependencia explícita de `apps/backend`
  (misma versión que resuelve el lockfile).
- Alternativa descartada: token compartido en el body del Scheduler (headers
  custom no soportados) — token estático rejugable y un secreto más que rotar;
  la verificación OIDC no añade secretos y da identidad auditable.

### D6 — Ruta interna fuera de `/api/v1` y exenta del throttler

- Controlador con path `internal/catalog-rebuild/flush` registrado en la
  exclusión del prefijo global (`main.ts`, mismo mecanismo que `'health'`).
- `HealthAwareThrottlerGuard` se extiende (p. ej. `isThrottleExemptUrl`) para
  eximir la ruta interna: 1 req/min no compite con el límite público
  (100/min), pero la exención hace el comportamiento determinista.
- El guard OIDC se aplica con `@UseGuards` en el controlador (no global), sin
  tocar los guards existentes de la API.

### D7 — Backoff acotado, sin dead-letter, logs escalados

- `nextAttemptAt = lastFailureAt + min(60s × 2^failureCount, 15 min)`.
- Reintento indefinido: el lote pendiente nunca se descarta.
- Warning por cada fallo; **error** cuando `failureCount >= 10` o la
  antigüedad del lote (`now - firstChangeAt`) supere 24 h (umbral en config
  interna, ajustable en apply si surge).
- Los cambios nuevos durante backoff se acumulan (D3) sin acortar el backoff:
  protege a Coolify de martilleo.

### D8 — Configuración por entorno (env, no secretos nuevos)

| Variable | Default | Naturaleza |
| --- | --- | --- |
| `CATALOG_REBUILD_SILENCE_SECONDS` | 60 | config |
| `CATALOG_REBUILD_MAX_WAIT_SECONDS` | 300 | config |
| `CATALOG_REBUILD_CLAIM_TTL_SECONDS` | 60 | config |
| `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE` | — (obligatoria en prod/staging) | config por entorno |
| `CATALOG_REBUILD_FLUSH_EXPECTED_SA` | — (obligatoria en prod/staging) | config por entorno |
| `CATALOG_REBUILD_WEBHOOK_URL` / `_TOKEN` | — (existentes) | secretos (Secret Manager, sin cambios) |

Sin `*_EXPECTED_*` configuradas, el guard es fail-closed (401) con warning de
configuración ausente — mismo patrón de no-op observable que el notifier
actual.

## Risks / Trade-offs

- [Staleness de migración: entre el deploy del backend y la creación del job
  no hay rebuilds automáticos] → El runbook ordena crear SA + job
  inmediatamente después del deploy; el primer flush publica el lote
  acumulado; gap esperado < minutos.
- [Doble deploy tras crash entre éxito del webhook y limpieza] → Aceptado
  (at-least-once): Coolify rebuild idempotente; costo = un build extra.
- [Doc único "hot" en Firestore] → Volumen humano (≤ 90 productos); las
  transacciones reintentan colisiones; monitorear latencia del flush en logs.
- [Clock skew entre instancias para ventanas de 60–300 s] → Timestamps
  comparados contra el reloj del server que decide (Cloud Run/GCP, NTP); riesgo
  residual despreciable para segundos de granularidad.
- [verifyIdToken necesita JWKS públicos de Google] → `google-auth-library`
  cachea las claves en memoria; el primer verify de una instancia fría añade
  un fetch HTTP único, no por request.
- [Scheduler caído → no hay flush] → El estado acumula cambios en Firestore;
  al recuperarse el job, el siguiente ciclo publica todo el lote (self-healing).
- [Job 401/404 en Scheduler logs si el job se crea antes del deploy o tras un
  rollback] → Documentar `gcloud scheduler jobs pause/resume` en el runbook
  para ventanas de rollback.

## Migration Plan

1. **Staging** (`riff-catalogo-staging`):
   1. Desplegar backend con el nuevo código (notifier buffering activo; deja
      de disparar Coolify de inmediato).
   2. Crear SA `catalog-rebuild-flusher@riff-catalogo-staging` +
      `roles/run.invoker` sobre `riff-api-staging`.
   3. Crear el job de Cloud Scheduler (`*/1 * * * *`, OIDC, audience explícita,
      sin retries) apuntando a la URL del servicio.
   4. Verificar end-to-end: editar un producto de prueba → esperar ≤ 1–2 min →
      confirmar un único deploy de Coolify y el doc de estado limpio.
2. **Producción** (otro proyecto GCP — config pendiente de revisar; asumir
   similar a staging): repetir los pasos con los valores del proyecto.
3. **Rollback**: `gcloud run services update-traffic --revision=<previa>`
   restaura el dispatch directo (el doc de estado pendiente queda inofensivo);
   `gcloud scheduler jobs pause <job>` elimina el ruido de 401 en logs
   mientras dure el rollback; limpieza manual opcional del doc
   (`catalog_rebuild_state/global`).

## Open Questions

- Config exacta de producción (proyecto GCP distinto, aún sin revisar): URLs,
  SA y nombre del job — se asume topología igual a staging; el runbook
  parametriza por variables de entorno.
- Umbral de escalamiento de logs (propuesto: `failureCount >= 10` o lote con
  antigüedad > 24 h): default de diseño, ajustable durante apply si el
  equipo de ops prefiere otro valor.
