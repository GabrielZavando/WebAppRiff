# Verification — deploy-docker-hardening

> Evidencia de las verificaciones ejecutadas el 2026-10-12 durante el apply.
> Entorno: linux/amd64 (x86_64), Docker 28.1.1, ramas de trabajo
> `chore/deploy-docker-hardening`.

## 1. Gate de CI — TDD rojo → verde (tarea 5.3)

**Rojo** (gate añadido ANTES de los fixes, con `.dockerignore` ya excluyendo el
environment generado — contexto idéntico a un checkout limpio):

```
$ make docker-build
#17 1.239 An unhandled exception occurred: The /app/apps/admin/src/environments/environment.production.ts path in file replacements does not exist.
#17 ERROR: process "/bin/sh -c npm run build --workspace=@riff/admin" did not complete successfully: exit code: 127
make: *** [Makefile:72: docker-build] Error 2
GATE_EXIT=2 (DURATION=4s, capas de install cacheadas)
```

→ El gate reproduce el Bug 1 exacto y falla el pipeline. ✓

**Verde** (tras fix 2.2):

```
$ make docker-build
#18 0.190 [write-env] wrote /app/apps/admin/src/environments/environment.production.ts
#19 4.820 Application bundle generation complete. [3.687 seconds]
#26 naming to docker.io/library/riff-web:ci done
✅ Builds Docker de admin y web completados
GATE_EXIT=0 (DURATION=8s, web desde caché)
```

## 2. Bug 1 — bundle de admin con valores inyectados (tareas 2.3, 4.3)

```
$ docker build -f apps/admin/Dockerfile -t riff-admin:ci \
    --build-arg FIREBASE_API_KEY=ci-test-firebase-api-key \
    --build-arg FIREBASE_AUTH_DOMAIN=ci-test.firebaseapp.com \
    --build-arg FIREBASE_PROJECT_ID=ci-test-project \
    --build-arg FIREBASE_APP_ID=ci-test-app \
    --build-arg API_BASE_URL=http://localhost:3000/api/v1 .
BUILD_EXIT=0
$ docker create riff-admin:ci && docker cp <cid>:/usr/share/nginx/html <tmp>
$ grep -rl "dev-placeholder-api-key" <bundle>   → sin resultados (OK)
$ grep -rlo "ci-test-firebase-api-key" <bundle> → main-H7GU4WFX.js (OK)
$ sha256sum apps/web/public/logo_riff.png <bundle>/logo_riff.png
bf9f2d29272a681b18b099d1bbefc66f37e1913e3db070a198c56a262624da81  (idénticos)
$ grep -o '<link rel="icon"[^>]*>' <bundle>/index.html
<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32">
$ docker run -d -p 8081:80 riff-admin:ci
GET /              → 200 OK
GET /logo_riff.png → 200 OK
```

Smoke de regresión del bundle (tarea 2.4):

```
$ npm run test:build --workspace=@riff/admin
[test:build] regenerating environment.production.ts with smoke values...
[test:build] running production build...
[sync-favicon] copied apps/web/public/logo_riff.png -> apps/admin/src/favicon/logo_riff.png
✅ [test:build] bundle OK: no dev placeholders, injected values present (2/2 markers)
SMOKE_EXIT=0
```

> Nota: el caso negativo end-to-end (bundle que SÍ contenga el placeholder) no
> es reproducible en esta máquina: el build `--configuration development`
> local no lo contiene porque `environment.development.local.ts` del
> desarrollador fue generado con valores reales (no placeholders). La lógica
> de detección es un scan de marcadores de cadena directo sobre el bundle.

## 3. Bug 2 — web con sharp verificado (tareas 3.1-3.3)

Pines declarados en `apps/web/package.json` (`optionalDependencies`) y
lockfile regenerado con diff mínimo:

```
$ git diff --stat package-lock.json
 package-lock.json | 5 +++++
$ npm ls @img/sharp-darwin-arm64   # caso simétrico: plataforma no coincidente
└── (empty)                        # npm la salta sin error (exit 0)
$ node -e "require('sharp')"       # host linux/x64
sharp OK: 0.35.5 | vips: 8.18.7
```

Build Docker con el lockfile nuevo (los cambios en el lockfile invalidan la
capa de `npm ci` → re-ejercita la instalación):

```
$ docker build -f apps/web/Dockerfile -t riff-web:verify \
    --build-arg SITE_URL=https://staging.somosriff.cl \
    --build-arg NESTJS_API_URL=https://api.somosriff.cl/api/v1 \
    --build-arg REQUIRE_API=false \
    --build-arg PUBLIC_API_URL=https://api.somosriff.cl/api/v1 .
BUILD_EXIT=0
#20 0.360 sharp OK: 0.35.5 | vips: 8.18.7        ← fail-fast (tarea 3.2)
grep -c "MissingSharp|Unable to generate optimized image" → 0
(55/55) imágenes optimizadas generadas
```

Sitio servido desde la imagen:

```
$ docker run -d -p 8080:80 riff-web:verify
GET /nosotros/  → 200 (7 referencias a /_astro/*.webp en el HTML)
GET /_astro/logo-web.BSWtorkv_R2wHA.webp → 200 (image/webp)
GET /_astro/logo-web.BSWtorkv_Lq1Ds.webp → 200 (image/webp)
```

> `GET /nosotros` → 301 a `/nosotros/` (redirect de directorio de nginx,
> `try_files $uri $uri/`, comportamiento preexistente; con `Host:` de staging
> también 200). No es efecto de este change.

Contingencia (tarea 3.4): protocolo documentado en design.md D3 — si
`MissingSharp` reaparece en un deploy de Coolify, re-lanzar el build con
`--no-cache` para descartar capa corrupta/base vieja del daemon.

## 4. Gate de CI — duración (tarea 5.4)

Caché fría (tras `docker builder prune -af`, equivalente a un runner de CI sin
caché):

```
$ make docker-build
COLD_GATE_EXIT=0 DURATION=93s
```

Ambas imágenes construidas desde cero en 93s — muy por debajo del presupuesto
de <10 min. En un runner de GitHub (red/CPU distintas) se espera 2-4x ese
tiempo, aún dentro del presupuesto. La lane es paralela al job `ci` (sin
`needs`): el tiempo de pared del pipeline es `max(ci, docker-build)`.

## 5. Gate del proyecto (tareas 7.1, 7.3)

```
$ make ci
✅ PASS — No blocking vulnerabilities found
✅ CI del proyecto completado
MAKE_CI_EXIT=0 DURATION=133s

$ npx openspec validate --all --strict
Totals: 77 passed, 0 failed (77 items)
VALIDATE_EXIT=0
```

## 6. Cierre post-merge (tarea 7.5) — completado 2026-10-13

1. Merge de la PR → Coolify despliega staging. **OK**: `riff-admin-staging`
   redesplegado; estilos del admin cargando correctamente tras el fix del
   CSS (change `admin-tailwind-docker-fix`: `COPY .postcssrc.json` +
   `@source`).
2. Configurar en Coolify las Build Variables de `riff-admin-staging` (5
   variables documentadas en `docs/deploy-standards.md`). **OK**.
3. Confirmar deploys en verde + verificación end-to-end. **OK**:
   - Login real con `soporte@gabrielzavando.cl` → `/profile` con datos del
     usuario.
   - GET `/api/v1/auth/me` → **200** con `Authorization: Bearer eyJ...`.
   - Backend: `https://riff-api-staging-345601325361.southamerica-west1.run.app`
     (proyecto `riff-catalogo-staging`).

- Estado: **verificado**.
- Fecha: 2026-10-13.
- Ejecutor: Gabriel Zavando.
