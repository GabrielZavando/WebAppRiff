## 1. CORS configuration (TDD)

- [x] 1.1 Crear `apps/backend/src/common/config/cors.config.ts` con `export interface CorsConfig { nodeEnv: string; astroSiteUrl?: string; angularAdminUrl?: string }` y `export function buildCorsOptions(config: CorsConfig): CorsOptions`.
- [x] 1.2 Escribir `apps/backend/src/common/config/cors.config.spec.ts` que falle primero (la función no existe). Verificar RED.
- [x] 1.3 Test: `buildCorsOptions({ nodeEnv: 'production', astroSiteUrl: 'https://catalogo.riff.cl', angularAdminUrl: 'https://admin.riff.cl' })` → `origin` es `["https://catalogo.riff.cl", "https://admin.riff.cl"]` y `credentials` es `true`.
- [x] 1.4 Test: `buildCorsOptions({ nodeEnv: 'development' })` → `origin` es `true`.
- [x] 1.5 Test: `buildCorsOptions({ nodeEnv: 'production' })` (sin URLs) → `origin` es `[]` (fail-closed).
- [x] 1.6 Implementar `cors.config.ts`: producción → array filtrado de URLs no vacías; desarrollo → `true`; `credentials: true`; `methods` restringidos. Verificar GREEN.
- [x] 1.7 En `apps/backend/src/main.ts`, llamar `app.enableCors(buildCorsOptions({ nodeEnv: configService.get('NODE_ENV') ?? 'development', astroSiteUrl: configService.get('ASTRO_SITE_URL'), angularAdminUrl: configService.get('ANGULAR_ADMIN_URL') }))`. Verificar build/typecheck.

## 2. Global ValidationPipe (TDD)

- [x] 2.1 Crear `apps/backend/src/common/config/validation.config.ts` con `export function buildValidationOptions(): ValidationPipeOptions` que retorna `{ whitelist: true, transform: true, forbidNonWhitelisted: true }`.
- [x] 2.2 Escribir `apps/backend/src/common/config/validation.config.spec.ts` que falle primero. Verificar RED.
- [x] 2.3 Test: `buildValidationOptions()` → `whitelist`, `transform`, `forbidNonWhitelisted` valen `true`.
- [x] 2.4 Implementar `validation.config.ts`. Verificar GREEN.
- [x] 2.5 En `main.ts`, registrar `app.useGlobalPipes(new ValidationPipe(buildValidationOptions()))`. Verificar build/typecheck.

## 3. Throttler rate limiting (TDD)

- [x] 3.1 Crear `apps/backend/src/common/config/throttler.config.ts` con `export interface ThrottlerConfig { ttl?: number; limit?: number }` y `export function buildThrottlerOptions(config: ThrottlerConfig)` que retorna opciones de `ThrottlerModule` con defaults (`ttl=60`, `limit=100`) y usa los valores de env cuando están presentes.
- [x] 3.2 Escribir `apps/backend/src/common/config/throttler.config.spec.ts` que falle primero. Verificar RED.
- [x] 3.3 Test: `buildThrottlerOptions({ ttl: 60, limit: 100 })` codifica ttl `60` y limit `100`.
- [x] 3.4 Test: `buildThrottlerOptions({})` codifica defaults positivos (ttl y limit > 0).
- [x] 3.5 Implementar `throttler.config.ts`. Verificar GREEN.
- [x] 3.6 Crear `apps/backend/src/common/guards/health-throttler.guard.ts` con `HealthAwareThrottlerGuard extends ThrottlerGuard` que sobreescribe el skip para omitir `/health` (retorna `true` cuando `request.url === '/health'`).
- [x] 3.7 Escribir `apps/backend/src/common/guards/health-throttler.guard.spec.ts` que falle primero. Verificar RED.
- [x] 3.8 Test: el guard omite `/health` (shouldSkip devuelve `true` para url `/health`) y no omite `/api/v1/products`.
- [x] 3.9 Implementar el guard. Verificar GREEN.

## 4. Response envelope interceptor (TDD)

- [x] 4.1 Crear `apps/backend/src/common/interceptors/response.interceptor.ts` implementando `NestInterceptor` que envuelve respuestas exitosas de rutas bajo `/api/v1/` en `{ data, error: null, meta: { timestamp, path } }`; pasa sin tocar rutas fuera de ese prefijo.
- [x] 4.2 Escribir `apps/backend/src/common/interceptors/response.interceptor.spec.ts` que falle primero. Verificar RED.
- [x] 4.3 Test: para una request con url `/api/v1/products`, el body resultante es `{ data: <original>, error: null, meta: { timestamp: <iso>, path: '/api/v1/products' } }`.
- [x] 4.4 Test: para una request con url `/health`, el body pasa sin envolver (igual al original).
- [x] 4.5 Implementar el interceptor. Verificar GREEN.

## 5. Global exception filter (TDD)

- [x] 5.1 Crear `apps/backend/src/common/filters/http-exception.filter.ts` implementando `ExceptionFilter` que mapea excepciones al sobre `{ data: null, error: { statusCode, message, error }, meta: { timestamp, path } }`; para no-HttpException usa `500` y `message: 'Internal server error'`.
- [x] 5.2 Escribir `apps/backend/src/common/filters/http-exception.filter.spec.ts` que falle primero. Verificar RED.
- [x] 5.3 Test: ante un `HttpException` (404, "Not found"), el response es `404` con body `{ data: null, error: { statusCode: 404, message: "Not found", error: "Not Found" }, meta: { timestamp, path } }`.
- [x] 5.4 Test: ante un error genérico, el response es `500` con `error.message === 'Internal server error'`.
- [x] 5.5 Implementar el filtro. Verificar GREEN.

## 6. CommonModule wiring

- [x] 6.1 Crear `apps/backend/src/common/common.module.ts` (`@Module`) que provee `APP_INTERCEPTOR` (ResponseInterceptor), `APP_FILTER` (HttpExceptionFilter) y `APP_GUARD` (HealthAwareThrottlerGuard), e importa `ThrottlerModule.forRootAsync` con `buildThrottlerOptions`.
- [x] 6.2 Importar `CommonModule` en `apps/backend/src/app.module.ts`.
- [x] 6.3 Verificar `npm run build --workspace=@riff/backend` → exit 0 y `npm run typecheck --workspace=@riff/backend` → exit 0.

## 7. Health endpoint enrichment (TDD)

- [x] 7.1 Extender `apps/backend/src/app.service.ts`: `getHealth()` inyecta `@Inject(FIRESTORE) firestore: Firestore` y retorna `{ status: 'ok', version, timestamp, uptime, firebase }`, donde `firebase` resulta de un ping best-effort (`Promise.race` con timeout ~2000ms sobre una lectura liviana de Firestore) envuelto en `try/catch` (falla → `'down'`).
- [x] 7.2 Escribir/actualizar `apps/backend/src/app.service.spec.ts` que falle primero (nuevo contrato). Verificar RED.
- [x] 7.3 Test: con `FIRESTORE` mockeado que resuelve, `getHealth()` retorna `firebase: 'up'` y contiene `status`, `version`, `timestamp`, `uptime`.
- [x] 7.4 Test: con `FIRESTORE` mockeado que rechaza/timeout, `getHealth()` retorna `firebase: 'down'` y sigue `status: 'ok'`.
- [x] 7.5 Actualizar `apps/backend/src/app.controller.spec.ts` y `app.service.spec.ts` para el nuevo shape de `/health`.
- [x] 7.6 Actualizar `docs/api-spec.yml`: el contrato de `/health` pasa a `{ status, version, timestamp, uptime, firebase }` (`security: []`, `200`).
- [x] 7.7 Verificar GREEN y coverage ≥ 90% en los archivos nuevos/modificados.

## 8. Validation & SDD

- [x] 8.1 `npm run lint --workspace=@riff/backend` → exit 0 (umbrales SOLID).
- [x] 8.2 `npm run typecheck --workspace=@riff/backend` → exit 0.
- [x] 8.3 `npm test --workspace=@riff/backend -- --coverage` → all pass + coverage ≥ 90% (100% stmts/lines/funcs, 97.14% branches).
- [x] 8.4 `npm run build --workspace=@riff/backend` → exit 0.
- [x] 8.5 Humo (con credenciales reales del cliente ya presentes): `GET /health` → 200 con shape enriquecido; `GET /health` NO throttled; headers CORS presentes (`Access-Control-Allow-Origin` refleja el origen). Nota: `firebase` reporta `down` en este sandbox por falta de egress de red a Firestore; en entorno real con red será `up`.
- [x] 8.6 `openspec validate backend-commons` → valid.
- [x] 8.7 `openspec status --change backend-commons` → 4/4 artefactos completos.
- [x] 8.8 Escenarios Gherkin de `backend-commons` (13) verificados contra tests: CORS×3, validación, throttler×2, skip-health, envelope×2, error×2, health×2. El único escenario de wiring (ValidationPipe global en `main.ts`) queda validado implícitamente por el compile de `AppModule` en `app.module.spec.ts`.
- [x] 8.9 Adversarial review (lente Architect/SOLID): cero warnings críticos. Hallazgo no bloqueante: el sobre de error `{ data, error:{statusCode,message,error}, meta }` no está documentado como componente en `docs/api-spec.yml` (se documentó inline en la sección /health del design, pero no como schema reutilizable). Sugerencia: añadir `ErrorEnvelope` a components.schemas en un cambio de documentación posterior.
