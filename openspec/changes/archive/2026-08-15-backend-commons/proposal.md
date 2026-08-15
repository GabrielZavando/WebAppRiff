## Why

El backend ya arranca con Firebase configurado (`backend-firebase-config` archivado) y expone `GET /health` crudo (`{"status":"ok"}`). Pero aún le faltan las preocupaciones transversales de plataforma HTTP que todo BFF NestJS necesita antes de exponer endpoints de dominio (que empiezan en `backend-categorias`):

- **CORS**: el frontend Astro (`ASTRO_SITE_URL`) y el admin Angular (`ANGULAR_ADMIN_URL`) deben poder consumir la API; hoy no hay CORS configurado y cualquier origen queda bloqueado.
- **Rate limiting**: `docs/backend-standards.md` exige Throttler en endpoints públicos; no está presente.
- **Validación global**: los DTOs de los módulos de dominio necesitan `ValidationPipe` (`class-validator` + `class-transformer`, ya declarados) activado de forma global antes de que existan endpoints que los usen.
- **Respuestas consistentes**: el estándar exige el sobre `{ data, error, meta }` para los endpoints de la API; hoy no hay nada que lo garantice.
- **Errores consistentes**: no hay un filtro global que normalice las excepciones al mismo sobre.
- **`/health` enriquecido**: el health check actual solo dice `ok`; conviene reportar versión, timestamp, uptime y el estado de conectividad con Firebase para diagnóstico en despliegues.

Este change entrega la capa transversal `backend-commons` (CORS, Throttler, ValidationPipe, interceptor de respuesta, filtro de excepciones y `/health` enriquecido) y deja el BFF listo para recibir módulos de dominio sin acoplarles estas preocupaciones.

## What Changes

- `apps/backend/src/common/config/cors.config.ts`: función pura `buildCorsOptions(config)` que construye las opciones de CORS a partir de `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL` y `NODE_ENV` (en desarrollo permite orígenes localhost; en producción solo la allowlist explícita).
- `apps/backend/src/common/config/validation.config.ts`: función pura `buildValidationOptions()` con la configuración del `ValidationPipe` (`whitelist`, `transform`, `forbidNonWhitelisted`).
- `apps/backend/src/common/config/throttler.config.ts`: función pura `buildThrottlerOptions(config)` leyendo `THROTTLE_TTL` y `THROTTLE_LIMIT`.
- `apps/backend/src/common/guards/health-throttler.guard.ts`: guard que extiende `ThrottlerGuard` y omite `/health` para no limitar los probes de salud.
- `apps/backend/src/common/interceptors/response.interceptor.ts`: `NestInterceptor` que envuelve las respuestas exitosas de rutas bajo `/api/v1/**` en `{ data, error: null, meta }`; deja pasar las rutas fuera de `/api/v1` (p. ej. `/health`) sin envolver.
- `apps/backend/src/common/filters/http-exception.filter.ts`: `ExceptionFilter` global que mapea cualquier excepción al sobre `{ data: null, error: { statusCode, message, error }, meta }`.
- `apps/backend/src/common/common.module.ts`: módulo que registra `APP_INTERCEPTOR`, `APP_FILTER` y `APP_GUARD` (Throttler) para que sean globales.
- `apps/backend/src/main.ts`: aplica `enableCors(buildCorsOptions(...))` y `useGlobalPipes(new ValidationPipe(buildValidationOptions()))`.
- `apps/backend/src/app.module.ts`: importa `CommonModule`.
- `apps/backend/src/app.service.ts` / `app.controller.ts`: `/health` enriquecido (inyecta `FIRESTORE` para un ping best-effort de Firebase con timeout y try/catch; nunca rompe el endpoint).
- `docs/api-spec.yml`: actualiza el contrato de `/health` al shape enriquecido.
- Tests unitarios para toda la lógica pura (config builders, interceptor, filtro, guard, health service) siguiendo TDD.
- **No se crean módulos de dominio** (categorias, productos, etc.) — entran en changes posteriores.
- **No se incluye** verificación de JWT/Auth ni Guards de roles — se difiere a `backend-usuarios` (la capa de Auth es de dominio/usuario, no transversal de plataforma).

## Capabilities

### New Capabilities
- `backend-commons`: preocupaciones transversales de plataforma HTTP del BFF NestJS Riff — CORS restringido a orígenes del frontend configurados por entorno, rate limiting global vía Throttler (omitindo `/health`), `ValidationPipe` global, interceptor de respuesta que envuelve los endpoints `/api/v1/**` en el sobre `{ data, error, meta }`, filtro de excepciones global con el mismo sobre de error, y enriquecimiento del endpoint `/health` con versión, timestamp, uptime y estado de conectividad Firebase.

### Modified Capabilities
- `backend-runtime`: el requerimiento del endpoint `/health` se extiende para devolver un objeto enriquecido `{ status, version, timestamp, uptime, firebase }` (en lugar de solo `{ status: "ok" }`), manteniendo `200` y `security: []`. El bootstrap y el puerto no cambian.

## Impact

- **Código afectado**: `apps/backend/src/main.ts`, `apps/backend/src/app.module.ts`, `apps/backend/src/app.service.ts`, `apps/backend/src/app.controller.ts`, nuevos archivos bajo `apps/backend/src/common/`.
- **API / contratos**: `docs/api-spec.yml` se actualiza para `/health` (shape enriquecido). No se crean endpoints nuevos todavía; el sobre `{ data, error, meta }` se aplica a partir de `backend-categorias` (cuando existan rutas `/api/v1/**`).
- **Dependencias**: `@nestjs/throttler` v6, `class-validator` v0.14, `class-transformer` v0.5 ya están declarados en `apps/backend/package.json`. **Cero dependencias nuevas** (cumple la decisión de no añadir deps).
- **Configuración**: se introducen variables opcionales `THROTTLE_TTL` y `THROTTLE_LIMIT` (con defaults sensatos) y se consumen `ASTRO_SITE_URL` / `ANGULAR_ADMIN_URL` ya declaradas en `.env.example`.
- **Riesgo**: el interceptor de respuesta podría envolver respuestas que ya vienen envueltas. → **Mitigation**: solo envuelve rutas bajo `/api/v1/**`; el resto pasa sin tocarse. Los tests del interceptor cubren ambos caminos.
- **Riesgo**: el ping best-effort de Firebase en `/health` podría degradar la latencia del probe. → **Mitigation**: se ejecuta con timeout corto y `try/catch`; ante fallo reporta `firebase: "down"` pero el endpoint sigue `200` (liveness), sin lanzar.
- **Riesgo**: el `ThrottlerGuard` global podría limitar los probes de `/health`. → **Mitigation**: el guard extiende `ThrottlerGuard` y omite `/health` explícitamente.
