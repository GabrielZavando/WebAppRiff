# generalize-catalog-rebuild-webhook Specification

## Purpose
Webhook de rebuild del catálogo: notificación ante cambios de categorías/subcategorías/productos, autenticación Bearer con timeout, errores HTTP visibles (sin fallo silencioso) y contrato de entorno CATALOG_REBUILD_*.
## Requirements
### Requirement: Catalog changes SHALL trigger a rebuild notification
El backend SHALL registrar un cambio de entidad pública del catálogo (categoría,
subcategoría —creada/actualizada/eliminada— o producto —creado/actualizado,
incluyendo publicar/despublicar vía su campo `publicado`, o eliminado—) en un
**estado de rebuild duradero en Firestore** (documento único en una colección
interna) en lugar de disparar el webhook de Coolify de forma directa. El registro
SHALL ser fire-and-forget y MUST NOT bloquear ni fallar la operación de
mutación. El disparo efectivo del webhook lo realiza el endpoint de flush
(invocado por Cloud Scheduler), no el registro del cambio.

#### Scenario: Category change triggers a rebuild event
- **WHEN** se crea, actualiza o elimina una categoría con éxito
- **THEN** un evento `category` con el id afectado, la acción y `occurredAt` queda registrado en el estado de rebuild de Firestore
- **AND** la mutación responde sin esperar ni depender del registro del estado ni del webhook

#### Scenario: Subcategory change triggers a rebuild event
- **WHEN** se crea, actualiza o elimina una subcategoría con éxito
- **THEN** un evento `subcategory` queda registrado en el estado de rebuild
- **AND** la mutación no se bloquea por el registro ni por el webhook

#### Scenario: Product change triggers a rebuild event (incl. publish/unpublish)
- **WHEN** se crea, actualiza (incluido alternar `publicado`) o elimina un producto
- **THEN** un evento `product` con la acción correspondiente queda registrado en el estado de rebuild
- **AND** la mutación no se bloquea por el registro ni por el webhook

#### Scenario: State records batch start and latest change
- **WHEN** un cambio llega con el estado de rebuild limpio (sin lote pendiente)
- **THEN** el estado fija `firstChangeAt` (inicio del lote) y `lastChangeAt` con la marca de tiempo del cambio
- **AND** cuando llega un cambio con un lote ya pendiente, solo se actualiza `lastChangeAt`, preservando el `firstChangeAt` original

### Requirement: The webhook SHALL authenticate with Bearer and a timeout
El servicio de flush SHALL leer `CATALOG_REBUILD_WEBHOOK_URL` y
`CATALOG_REBUILD_WEBHOOK_TOKEN` al disparar el webhook y enviar un `POST` con
`Authorization: Bearer <token>` y `content-type: application/json`, abortado tras
un timeout configurable. El disparo MUST NOT lanzar excepciones no controladas y
SHALL registrar los errores como warnings sin filtrar el token ni la URL. La
ausencia de URL o token SHALL ser un no-op observable que emite un warning
explícito nombrando la variable faltante, nunca un no-op silencioso; en ese caso
el registro de cambios en el estado también se omite (no hay destino al que
notificar).

#### Scenario: Request is authenticated with the bearer token
- **WHEN** el servicio de flush dispara el webhook
- **THEN** la petición incluye `Authorization: Bearer <token>` y `content-type: application/json`
- **AND** el token nunca aparece en logs ni en el cuerpo de la petición

#### Scenario: Request times out without blocking
- **WHEN** el webhook no responde dentro del timeout
- **THEN** la petición se aborta y el timeout se registra como warning sin secretos
- **AND** el estado pendiente se conserva para el reintento del siguiente ciclo de flush

#### Scenario: Unset URL is a no-op
- **WHEN** `CATALOG_REBUILD_WEBHOOK_URL` o `CATALOG_REBUILD_WEBHOOK_TOKEN` no está configurado y ocurre una mutación de catálogo
- **THEN** no se envía nada al webhook y no se escribe estado de rebuild pendiente
- **AND** se registra un warning indicando que el rebuild webhook no está configurado, nombrando la(s) variable(s) faltante(s), sin incluir el token ni el valor de la URL

#### Scenario: Webhook failure does not fail the mutation
- **WHEN** el webhook devuelve un error o es inalcanzable tras una mutación de catálogo
- **THEN** la mutación de catálogo tiene éxito y el error queda registrado como warning

### Requirement: The notifier SHALL surface HTTP failures (no silent failure)
El servicio de flush SHALL inspeccionar `response.ok` tras el `fetch` al webhook.
Cuando el webhook responde con un estado HTTP no-OK (4xx/5xx), SHALL registrar un
warning con el estado HTTP y el tipo/acción de la entidad, sin filtrar el token ni
la URL, y SHALL conservar el estado pendiente con backoff para reintentarlo en un
ciclo posterior de flush.

#### Scenario: Non-OK HTTP status is logged as a warning
- **WHEN** el webhook responde con `response.ok === false` (p. ej. HTTP 401 o 500)
- **THEN** se registra un warning con el estado HTTP y el tipo/acción de entidad
- **AND** el token y la URL no aparecen en el mensaje

#### Scenario: Failed dispatch keeps the pending state
- **WHEN** el disparo del webhook termina en error (HTTP no-OK, timeout o fallo de transporte)
- **THEN** el estado de rebuild se conserva pendiente (no se limpia) y se incrementa `failureCount` fijando `nextAttemptAt` según el backoff

### Requirement: Environment contract SHALL use CATALOG_REBUILD_*
`.env.example` (raíz y backend) y `docs/deploy-standards.md` SHALL documentar el
contrato completo del rebuild: las variables existentes
`CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN` (destino del
webhook, usado por el servicio de flush) y las nuevas variables de ventanas y de
identidad del Scheduler: `CATALOG_REBUILD_SILENCE_SECONDS`,
`CATALOG_REBUILD_MAX_WAIT_SECONDS`, `CATALOG_REBUILD_CLAIM_TTL_SECONDS`,
`CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE` y `CATALOG_REBUILD_FLUSH_EXPECTED_SA`,
con sus valores por defecto y su alcance por entorno. `CATEGORIES_WEBHOOK_URL`
SHALL mantenerse sin referencias en código ni docs.

#### Scenario: Env vars are migrated
- **WHEN** un desarrollador lee el contrato de entorno y la documentación
- **THEN** `CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN` están presentes
- **AND** `CATEGORIES_WEBHOOK_URL` está ausente de código y docs

#### Scenario: New flush variables are documented with defaults
- **WHEN** se revisan `.env.example` (raíz y backend) y `docs/deploy-standards.md`
- **THEN** las cinco variables nuevas (`CATALOG_REBUILD_SILENCE_SECONDS`, `CATALOG_REBUILD_MAX_WAIT_SECONDS`, `CATALOG_REBUILD_CLAIM_TTL_SECONDS`, `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `CATALOG_REBUILD_FLUSH_EXPECTED_SA`) están documentadas con sus valores por defecto (60, 300, 60) y su uso por entorno

### Requirement: Rebuild state SHALL be durable in Firestore across scale-to-zero
El estado de rebuild SHALL persistir en Firestore (colección interna con un
documento único de id fijo, accedido vía Admin SDK) de modo que ningún cambio
pendiente dependa de la vida de la instancia que lo registró. El estado SHALL
registrar, como mínimo: `firstChangeAt` (solo al abrir un lote con el estado
limpio), `lastChangeAt` (cada cambio), `claimedAt`/`claimId` (claim del flush en
curso, con vencimiento), `failureCount`, `lastFailureAt` y `nextAttemptAt`.

#### Scenario: Scale-to-zero instance does not lose pending changes
- **WHEN** una instancia registra cambios y escala a cero (o muere) antes de que se dispare el webhook
- **THEN** los cambios pendientes permanecen en Firestore y el siguiente ciclo de flush los procesa desde una instancia nueva

#### Scenario: Edits accumulate in the same batch
- **WHEN** llegan múltiples cambios mientras existe un lote pendiente no reclamado
- **THEN** todos quedan representados por el mismo `firstChangeAt` original y un `lastChangeAt` actualizado al cambio más reciente

### Requirement: The flush endpoint SHALL decide dispatch with silence window, max-wait and a transactional claim
El endpoint interno de flush SHALL decidir si corresponde disparar el webhook
dentro de una **transacción de Firestore** sobre el documento de estado, con estas
reglas: (1) si no hay estado pendiente, es no-op; (2) si existe un claim vigente
(`claimedAt` no vencido según `CATALOG_REBUILD_CLAIM_TTL_SECONDS`), es no-op; (3)
si `nextAttemptAt` está en el futuro, es no-op (backoff); (4) solo si se cumple
`ahora - lastChangeAt >= CATALOG_REBUILD_SILENCE_SECONDS` **o**
`ahora - firstChangeAt >= CATALOG_REBUILD_MAX_WAIT_SECONDS` toma el claim
(fija `claimedAt`/`claimId`), y el disparo del webhook ocurre **fuera** de la
transacción; (5) tras una respuesta exitosa del webhook, limpia el estado solo si
no llegaron cambios nuevos durante el vuelo; si llegaron, conserva un lote
residual reiniciando el reloj de max-wait (`firstChangeAt = claimedAt`). Un claim
vencido SHALL poder ser tomado por un flush posterior. El endpoint SHALL responder
2xx con el resultado de la decisión (dispatch, no-op, backoff, claim en curso) y
SHALL NOT delegar los reintentos al Scheduler.

#### Scenario: Burst of edits within the window triggers a single webhook after silence
- **WHEN** una ráfaga de ediciones con separación menor que la ventana de silencio termina y transcurre la ventana sin nuevos cambios
- **THEN** el siguiente ciclo de flush dispara exactamente un webhook de Coolify y limpia el estado
- **AND** ningún ciclo de flush dispara un webhook adicional por la misma ráfaga

#### Scenario: Continuous burst past the max-wait triggers the webhook at the cap
- **WHEN** los cambios llegan de forma continua con separación menor que la ventana de silencio durante al menos `CATALOG_REBUILD_MAX_WAIT_SECONDS` desde `firstChangeAt`
- **THEN** el flush dispara el webhook al alcanzarse el tope, aunque la condición de silencio no se cumpla
- **AND** el lote se cierra y un lote nuevo arranca con su propio `firstChangeAt` si siguen llegando cambios

#### Scenario: Concurrent flush executions do not double-dispatch
- **WHEN** dos ejecuciones del flush (p. ej. dos instancias de Cloud Run) procesan el mismo estado pendiente simultáneamente
- **THEN** la transacción serializa la decisión: exactamente una toma el claim y dispara el webhook
- **AND** la otra es no-op (claim en curso) sin disparar nada

#### Scenario: Crash after the claim does not strand the batch
- **WHEN** una instancia muere (o escala a cero) tras confirmar el claim pero antes de limpiar el estado por éxito o fallo
- **THEN** el claim vence según `CATALOG_REBUILD_CLAIM_TTL_SECONDS` y el siguiente ciclo de flush toma el claim vencido y reintenta el disparo

#### Scenario: No pending state is a no-op
- **WHEN** el flush se ejecuta y no existe estado pendiente
- **THEN** el endpoint responde 2xx como no-op sin contactar el webhook de Coolify

### Requirement: Webhook failure SHALL keep the state pending with bounded backoff and no dead-letter
El servicio de flush SHALL conservar el estado pendiente tras un fallo del
webhook (HTTP no-OK, timeout o fallo de transporte), con el `firstChangeAt`
original y el `lastChangeAt` más reciente entre el estado y las ediciones
nuevas. Además SHALL fijar
`failureCount`, `lastFailureAt` y `nextAttemptAt = lastFailureAt +
min(60s × 2^failureCount, 15 min)`; `nextAttemptAt` SHALL ser respetado por las
decisiones de flush. No SHALL existir dead-letter permanente: el reintento es
indefinido, con warning por fallo y log de error escalado cuando `failureCount`
alcance un umbral o la antigüedad del lote supere 24 h. Los cambios nuevos que
lleguen durante el backoff SHALL acumularse sin reiniciar ni acortar el backoff.

#### Scenario: Webhook failure preserves the pending state
- **WHEN** el disparo del webhook falla en un ciclo de flush
- **THEN** el estado no se limpia y queda reclamable cuando `nextAttemptAt` venza
- **AND** el fallo queda registrado en `failureCount`/`lastFailureAt` con el warning correspondiente

#### Scenario: Edits during failure keep the original batch window
- **WHEN** llegan ediciones nuevas mientras el lote está en backoff por un fallo previo
- **THEN** el `firstChangeAt` original se conserva y el `lastChangeAt` pasa a ser el más reciente entre el estado y las ediciones nuevas
- **AND** el reintento (cuando `nextAttemptAt` lo permita) publica todas las ediciones acumuladas en un único webhook

#### Scenario: Backoff is bounded and failures escalate in logging
- **WHEN** el webhook falla de forma repetida en ciclos sucesivos
- **THEN** `nextAttemptAt` se separa progresivamente hasta un tope de 15 minutos, sin dead-letter permanente
- **AND** a partir del umbral de `failureCount` o de antigüedad del lote mayor a 24 h, los logs escalan de warning a error

### Requirement: The flush endpoint SHALL verify the Scheduler OIDC identity app-side
El endpoint de flush SHALL estar protegido por un guard que verifique **en la
aplicación** el ID token OIDC emitido por Google para la service account del
Cloud Scheduler: firma válida (verificada con `google-auth-library`), `aud` igual
a `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `email` igual a
`CATALOG_REBUILD_FLUSH_EXPECTED_SA` y `email_verified` verdadero. El guard SHALL
ser fail-closed: ante token ausente, malformado, con firma inválida o con
cualquier claim que no coincida, rechaza con 401 sin ejecutar el flush. Este gate
app-side es el control de acceso real: el servicio está desplegado con
`--allow-unauthenticated`, por lo que el rol `run.invoker` de la SA del Scheduler
es defensa en profundidad y documentación, no el gate.

#### Scenario: Endpoint rejects calls without the Scheduler identity
- **WHEN** una petición al endpoint de flush llega sin cabecera `Authorization` o con un token que no es un ID token de Google válido
- **THEN** el endpoint responde 401 y el flush no se ejecuta

#### Scenario: Valid signature with wrong claims is rejected
- **WHEN** el token tiene firma válida pero `aud` distinto de `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, o `email` distinto de `CATALOG_REBUILD_FLUSH_EXPECTED_SA`, o `email_verified` falso
- **THEN** el endpoint responde 401 y el flush no se ejecuta

#### Scenario: Valid Scheduler identity is accepted
- **WHEN** el token tiene firma de Google válida, `aud`, `email` y `email_verified` coinciden con la configuración
- **THEN** el guard permite la petición y el flush ejecuta su decisión

### Requirement: The flush route SHALL be internal and exempt from global prefix and throttling
La ruta `POST /internal/catalog-rebuild/flush` SHALL vivir fuera del prefijo
global `api/v1` (declarada con exclusión igual que `/health`) y SHALL estar exenta
del throttler global (mismo mecanismo de exención que `/health`) para que la
frecuencia del Scheduler no compita con el límite de peticiones público. La ruta
SHALL NOT exponer información del estado del rebuild en errores de autenticación.

#### Scenario: Route is reachable outside the API version prefix
- **WHEN** el Scheduler invoca `POST /internal/catalog-rebuild/flush`
- **THEN** la petición llega al controlador sin el prefijo `/api/v1`

#### Scenario: Route is exempt from rate limiting
- **WHEN** el job del Scheduler invoca el endpoint cada minuto durante tiempo prolongado
- **THEN** el throttler global no devuelve 429 para esas invocaciones

### Requirement: The Scheduler job SHALL be documented per environment
`docs/deploy-standards.md` y el runbook de Cloud Run SHALL documentar la creación
de la infraestructura del flush por entorno: la service account dedicada
(p. ej. `catalog-rebuild-flusher@<proyecto>`) con el rol `roles/run.invoker` sobre
el servicio (defensa en profundidad; el gate real es la verificación app-side), y
el job de Cloud Scheduler con frecuencia `*/1 * * * *`, objetivo HTTP `POST` a la
URL del entorno, `--oidc-token-audience` explícito (igual a
`CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`; el servicio tiene varias URLs) y sin
reintentos propios del Scheduler (los reintentos los posee el backoff del
servicio), incluyendo los comandos `gcloud` correspondientes.

#### Scenario: Runbook documents the scheduler setup
- **WHEN** un operador sigue el runbook de Cloud Run para un entorno
- **THEN** encuentra los comandos para crear la SA, otorgar `roles/run.invoker`, crear el job de Scheduler con OIDC y audience explícita, y verificar el flujo end-to-end
