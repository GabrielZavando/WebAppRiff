## Context

`backend-scaffold` (archivado) entregó un backend NestJS runnable con `GET /health` crudo y bootstrap en `main.ts`. `backend-firebase-config` (archivado) añadió `ConfigModule` global, `FirebaseModule`/`FirestoreModule` (`@Global()`, tokens `FIREBASE_APP`/`FIRESTORE`) y helpers puros de service account; el backend ya corre en dev con credenciales reales del cliente. No obstante, el BFF aún carece de las preocupaciones transversales de plataforma HTTP: CORS, rate limiting, validación global de DTOs, sobre de respuesta consistente y manejo uniforme de errores. Los módulos de dominio (`backend-categorias` en adelante) necesitan todo esto ya resuelto para no acoplarlo en cada feature.

`docs/backend-standards.md` establece: respuestas consistentes `{ data, error, meta }`, validación en capa de presentación (DTOs + `class-validator`), rate limiting en endpoints públicos (`@nestjs/throttler`), CORS explícito para los orígenes del frontend (Astro/Angular), y health check público `GET /health`. `@nestjs/throttler` v6, `class-validator` v0.14 y `class-transformer` v0.5 ya están en `apps/backend/package.json` (no se añaden deps). La estructura Clean Architecture del estándar prohíbe que `domain/`/`application/` importen infraestructura; por tanto, estos elementos transversales viven en `src/common/` (shared kernel de plataforma), no en un módulo de dominio.

## Goals / Non-Goals

**Goals:**
- CORS habilitado y restringido a `ASTRO_SITE_URL` + `ANGULAR_ADMIN_URL` (allowlist estricta en producción; localhost permitido en desarrollo).
- `ValidationPipe` global con `whitelist`, `transform` y `forbidNonWhitelisted`, configurado desde una función pura.
- Rate limiting global con `ThrottlerModule.forRootAsync` + `ThrottlerGuard` como `APP_GUARD`, leyendo `THROTTLE_TTL`/`THROTTLE_LIMIT`, y omitiendo `/health`.
- Interceptor `ResponseInterceptor` que envuelve respuestas exitosas de `/api/v1/**` en `{ data, error: null, meta }`; pasa sin tocar rutas fuera de `/api/v1`.
- Filtro global `HttpExceptionFilter` que normaliza errores al sobre `{ data: null, error: { statusCode, message, error }, meta }`.
- `/health` enriquecido: `{ status, version, timestamp, uptime, firebase }` con ping best-effort de Firestore (timeout + try/catch).
- `CommonModule` que registra `APP_INTERCEPTOR`, `APP_FILTER` y `APP_GUARD` para que sean globales; importado por `AppModule`.
- Tests unitarios (TDD) para toda la lógica pura y los decoradores/filtros, con `firebase-admin` mockeado donde corresponda.

**Non-Goals:**
- NO se crean módulos de dominio (`categorias`/`subcategorias`/`productos`/`usuarios`/`cotizaciones`).
- NO verificación de JWT/Auth ni Guards de roles ni Custom Claims → se difiere a `backend-usuarios` (Auth es de dominio usuario, no transversal de plataforma).
- NO Storage (Firebase Storage) → entra en `backend-productos`.
- NO se toca `docs/data-model.md`.
- NO se introduce `@nestjs/terminus` (se evita dependencia nueva; el ping de `/health` se hace con `getFirestore` ya disponible y un timeout manual).

## Decisions

1. **Carpeta `src/common/` como shared kernel de plataforma.** CORS/Throttler/validación/interceptores/filtros son transversales, no entidades de negocio, así que no viven en un módulo de dominio ni violan la regla DIP (ninguno importa `firebase-admin` salvo el ping de health, que inyecta el token `FIRESTORE` ya global). Alternativa considerada: ponerlos directo en `main.ts` → descartada, porque los filtros/interceptores necesitan ser testeables de forma aislada y `main.ts` no se testea fácilmente.

2. **Configuraciones como funciones puras (`buildCorsOptions`, `buildValidationOptions`, `buildThrottlerOptions`).** Permite testearlas sin levantar la app. Alternativa: leer `process.env` dentro de los providers → descartada por acoplamiento y falta de testeo.

3. **CORS en desarrollo permite localhost; en producción solo allowlist.** `buildCorsOptions` devuelve `origin: true` cuando `NODE_ENV === 'development'` (práctica para dev local) y un array filtrado (`ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL` no vacíos) en producción. `credentials: true` siempre. Alternativa: siempre allowlist estricta → descartada, rompe dev local sin config.

4. **Solo se envuelve `/api/v1/**` en el sobre de respuesta.** `ResponseInterceptor` inspecciona `request.url` y pasa sin tocar las rutas fuera del prefijo (notablemente `/health`), preservando la compatibilidad de los probes de salud y cualquier ruta no-API. Alternativa: envolver todo → descartada, rompe el contrato crudo de `/health` documentado en `docs/api-spec.yml`.

5. **`ThrottlerGuard` como `APP_GUARD` pero omitiendo `/health`.** Se crea `HealthAwareThrottlerGuard extends ThrottlerGuard` que sobreescribe el skip para `/health`, evitando limitar los health probes de load balancers. Alternativa: throttle global sin excepción → descartada, los probes frecuentes podrían recibir 429.

6. **Ping best-effort de Firebase en `/health` con timeout manual.** `AppService.getHealth()` inyecta `FIRESTORE` y hace una lectura liviana (`collection('__health__').limit(1).get()`) envuelta en `Promise.race` con un timeout (~2000ms) y `try/catch`; ante fallo devuelve `firebase: 'down'` pero el endpoint sigue `200`. Alternativa: `@nestjs/terminus` → descartada (dependencia nueva, fuera del alcance sin deps).

7. **Registro global vía `CommonModule` con `APP_*` providers.** Se usa `providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }, { provide: APP_FILTER, useClass: HttpExceptionFilter }, { provide: APP_GUARD, useClass: HealthAwareThrottlerGuard }]` para que apliquen a toda la app sin importar el módulo en cada feature. Alternativa: `useGlobalInterceptors` en `main.ts` → descartada, los global guards/interceptors puestos en `main.ts` no funcionan en tests e2e/contextos fuera del bootstrap.

8. **El filtro de excepciones normaliza a `{ data: null, error, meta }`.** Para `HttpException` usa `statusCode`, `message` y `error` (nombre del error); para errores no esperados, devuelve `500` con `message: 'Internal server error'` y loguea el detalle (sin exponer stacktraces en producción, según estándar de seguridad). Alternativa: dejar el manejo por defecto de Nest → descartada, no cumple el sobre consistente.

9. **Actualizar `docs/api-spec.yml` para `/health`.** El contrato cambia de `{ status: "ok" }` al shape enriquecido; se documenta antes de implementar (SDD). Alternativa: no documentar → descartada, el api-spec es fuente de verdad.

10. **No nuevas dependencias.** `@nestjs/throttler`, `class-validator`, `class-transformer` ya declarados. Se respeta la decisión de no añadir deps.

## Risks / Trade-offs

- **Risk**: envolver respuestas podría chocar con streams o archivos binarios en el futuro. → **Mitigation**: el interceptor solo actúa sobre respuestas JSON de `/api/v1/**`; respuestas `application/octet-stream`/streams se manejarán con cuidado en `backend-productos` (Storage) cuando aplique.
- **Risk**: `NODE_ENV` mal seteado podría dejar CORS abierto en producción. → **Mitigation**: la allowlist de producción se construye solo con las URLs explícitas; si están vacías, CORS queda sin orígenes (Fail-closed). Test de `buildCorsOptions` cubre ambos modos.
- **Risk**: el ping de Firebase añade latencia a `/health`. → **Mitigation**: timeout corto (~2s) y `try/catch`; el endpoint sigue respondiendo `200` con `firebase: 'down'` si falla.
- **Trade-off**: no usar `@nestjs/terminus` → el health enriquecido es manual y simple, suficiente para el alcance actual; se puede migrar a Terminus si crece la necesidad de checks compuestos.
- **Trade-off**: envolver solo `/api/v1/**` deja `/health` fuera del sobre → es intencional para compatibilidad de probes; los futuros endpoints de dominio sí usarán el sobre.

## Migration Plan

- No hay migración de datos. Se añade infraestructura transversal y se enriquece `/health`.
- Deploy: este change no aporta endpoints de dominio todavía, pero sí endurece la plataforma (CORS/Throttler/validación); se puede desplegar junto con `backend-categorias` o de forma independiente (es compatible: `/health` sigue `200`).
- Rollback: revertir el commit — `AppModule` deja de importar `CommonModule`, `main.ts` deja de llamar `enableCors`/`useGlobalPipes`, y `/health` vuelve a `{ status: "ok" }` (definido en `backend-runtime` original). Ningún módulo de dominio depende aún de estos providers.
- Variables de entorno: `THROTTLE_TTL`/`THROTTLE_LIMIT` opcionales (defaults); `ASTRO_SITE_URL`/`ANGULAR_ADMIN_URL` ya documentadas en `.env.example`.

## Open Questions

- ¿Se desea permitir orígenes adicionales (p. ej. preview URLs de Coolify) vía una variable `CORS_EXTRA_ORIGINS` separada por coma? Por ahora se asume solo Astro + Angular; se puede extender sin cambiar el diseño.
- ¿El límite de throttle por defecto (p. ej. 100 req / 60s) es adecuado para el tráfico esperado del catálogo público? Ajustable vía env.
