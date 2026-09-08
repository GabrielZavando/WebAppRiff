## Context

Riff es un monorepo npm con tres aplicaciones:

- `apps/backend`: API NestJS/BFF REST que usa Firebase Admin SDK para Firestore, Authentication y Storage.
- `apps/web`: sitio Astro SSG que consulta el API durante el build y publica archivos estáticos.
- `apps/admin`: panel Angular que consumirá el API y Firebase Authentication para gestión interna.

La infraestructura gestionada por Firebase seguirá siendo responsable de Firestore, autenticación —incluida recuperación de contraseña— y Storage. El VPS administrado con Coolify ejecutará el sitio Astro y el panel Angular como servicios estáticos independientes. **El runtime del API NestJS quedó aprobado: Google Cloud Run** (decisión del cliente, 2026-09-08).

El repositorio cuenta con `apps/backend/Dockerfile`, un Dockerfile multi-stage basado en Node 22 que compila el monorepo desde su raíz, elimina dependencias de desarrollo y ejecuta como usuario no-root. No existen todavía Dockerfiles para web ni admin. `.github/workflows/deploy.yml` asume erróneamente un `Dockerfile` en la raíz, intenta construir una imagen sin publicarla y posteriormente solicita al VPS que la descargue.

La decisión debe respetar `docs/deploy-standards.md`: staging antes de producción, smoke tests, health check, rollback y separación explícita de variables por entorno.

## Goals / Non-Goals

**Goals:**

- Definir una arquitectura de despliegue clara entre Firebase, Coolify/VPS y el runtime elegido para NestJS.
- Evaluar formalmente Cloud Run, Coolify para el API y Cloud Functions 2nd gen.
- Priorizar una solución portable que aproveche el Dockerfile existente.
- Definir contratos de red, configuración, secretos, dominios, health checks, staging, producción y rollback.
- Identificar el rediseño requerido para `deploy.yml` y los Dockerfiles faltantes.
- Actualizar la documentación de arquitectura y deploy con una decisión auditable.

**Non-Goals:**

- Crear en este cambio los Dockerfiles de Astro o Angular.
- Implementar el pipeline final de CI/CD.
- Desplegar recursos reales en Coolify, Google Cloud, Artifact Registry o Firebase.
- Cambiar endpoints, contratos REST, autenticación o modelo de datos.
- Migrar NestJS a Cloud Functions.
- Resolver en este ticket la configuración comercial definitiva del proveedor VPS, dominios o presupuesto.

## Decisions

### 1. Firebase permanece como plataforma gestionada de datos y capacidades de identidad

Firestore, Firebase Authentication y Firebase Storage no se trasladan al VPS. NestJS se conecta a ellos mediante Firebase Admin SDK usando credenciales de service account administradas como secretos del runtime.

**Razón**: evita operar una base de datos, proveedor de identidad o almacenamiento de archivos en el VPS y conserva las capacidades gestionadas ya integradas en el código.

### 2. Astro y Angular se desplegarán como servicios estáticos independientes en Coolify

Cada frontend tendrá su propio Dockerfile multi-stage:

1. Stage de build usando el contexto raíz del monorepo y `npm ci`.
2. Stage runtime con servidor estático (nginx, Caddy o equivalente ligero).
3. Health check HTTP.
4. Variables públicas inyectadas durante el build, no secretos Firebase.

Astro deberá construir contra la URL pública del API NestJS. Angular deberá conocer la URL pública del API y del proveedor de autenticación según el diseño que se concrete en su implementación.

**Razón**: separa ciclos de release, facilita rollback independiente y encaja con Coolify. Los frontends no deben compartir el proceso runtime del API.

### 3. Cloud Run es el runtime elegido para el API NestJS (aprobado por el cliente, 2026-09-08)

Cloud Run ejecuta directamente la imagen producida por `apps/backend/Dockerfile`:

- Build y push a Artifact Registry.
- Deploy con `gcloud run deploy` o integración equivalente desde GitHub Actions.
- Secret Manager para `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` y URLs privadas.
- Región coincidente o próxima a la región de Firebase.
- `min-instances=0` inicialmente para minimizar coste; revisar `min-instances=1` si los cold starts afectan el panel o cotizaciones.
- Concurrencia, memoria, timeout y máximo de instancias definidos antes de producción.
- Endpoint `GET /health` como startup/readiness probe.

**Razón**: no requiere adaptar NestJS a un runtime de funciones, reutiliza el contenedor existente, escala según demanda y mantiene portabilidad hacia Coolify.

### 4. Coolify para el API queda como alternativa de fallback (no elegida en este ciclo)

Coolify podría construir `apps/backend/Dockerfile` desde el repositorio si en el futuro se decide consolidar los tres servicios en el VPS. Esa alternativa requiere documentar límites de memoria, reinicio automático, health check, red interna y secretos antes de activarse. No forma parte del despliegue objetivo actual.

**Razón**: con Cloud Run aprobado, consolidar el API en el VPS añadiría responsabilidad operativa y competiría por recursos con los frontends sin beneficio actual; se conserva como plan B documentado.

### 5. Cloud Functions 2nd gen no será la opción principal

Cloud Functions 2nd gen solo se mantendrá como alternativa futura si el equipo decide adaptar el API al modelo de funciones. No se recomienda para este cambio porque el backend actual es una aplicación NestJS HTTP completa y Cloud Run ofrece el mismo modelo gestionado sin abandonar el contenedor.

### 6. Comunicación entre servicios

- Navegador → Astro/Angular mediante HTTPS público.
- Astro build → API NestJS público o endpoint de staging autorizado durante el build.
- Angular runtime → API NestJS mediante HTTPS y CORS estricto.
- API NestJS → Firebase mediante SDK Admin y secretos del runtime.
- Backend → webhook de Coolify únicamente para solicitar rebuild del sitio cuando cambien categorías, usando `CATEGORIES_WEBHOOK_URL`.

No se expondrán credenciales Firebase Admin en Astro, Angular ni variables `PUBLIC_*`.

### 7. Estrategia de entornos

- **Staging**: recursos separados o aislados, URLs propias y proyecto Firebase de staging recomendado.
- **Producción**: promoción manual tras smoke tests verdes en staging.
- **Pull requests**: validación estática, typecheck, tests, cobertura y builds; sin despliegue productivo.
- **Rollback**: redeploy de la imagen/tag anterior en Coolify o revisión anterior de Cloud Run; comprobar `/health` y endpoints clave después del rollback.

### 8. `deploy.yml` se reemplazará, no se parcheará mínimamente

El workflow actual mezcla SSH/docker manual con supuestos de un único contenedor. Estrategia reemplazo elegida (coherente con la decisión de runtime):

- **API (Cloud Run)**: build/push a Artifact Registry y deploy con `gcloud run deploy` usando una identidad de GitHub Actions de mínimo privilegio (Workload Identity Federation recomendado).
- **Frontends (Coolify)**: build in-situ desde Git vía Coolify para `apps/web` y `apps/admin`, sin `docker pull` manual ni SSH.

La implementación de ese pipeline será un cambio posterior.

## Risks / Trade-offs

- **[Cloud Run cold start]** → Medir tiempo de arranque con smoke tests; habilitar `min-instances=1` solo si el impacto justifica el coste.
- **[Coste/región Firebase-GCP]** → Elegir región cercana a Firebase y definir alertas/presupuesto antes de producción.
- **[API público para build Astro]** → Mantener endpoint de staging dedicado, autenticación de build si fuese necesaria y `REQUIRE_API=true` en builds de producción.
- **[Secretos mal inyectados]** → Usar Coolify Secrets o Google Secret Manager; nunca `.env` versionado, argumentos Docker ni variables públicas.
- **[VPS compartido saturado]** → Límites de CPU/memoria por servicio, health checks y monitoreo; migrar API a Cloud Run si el consumo afecta frontends.
- **[Cambios de dominio/CORS]** → Registrar `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL` y URL del API por entorno; probar preflight y credenciales en staging.
- **[Build Astro con catálogo vacío]** → Fallar el build productivo si el API no responde o devuelve un catálogo inválido; no aceptar fallback silencioso en producción.
- **[Imagen no probada en runtime gestionado]** → Probar la imagen del backend localmente (y en staging de Cloud Run) antes del primer deploy a producción.

## Migration Plan

1. Runtime del API aprobado: **Cloud Run** (2026-09-08). Pendiente registrar región, dominios y responsable operativo.
2. Actualizar `docs/project/stack.md` y `docs/deploy-standards.md` con la decisión.
3. Crear los Dockerfiles multi-stage de Astro y Angular como cambio independiente.
4. Definir y validar el contrato de variables por servicio; añadir secrets a Coolify o Secret Manager.
5. Reemplazar `deploy.yml` por el flujo elegido y añadir health checks/smoke tests.
6. Desplegar staging con Firebase de staging o datos controlados.
7. Ejecutar smoke tests: `/health`, listado público de productos, categorías, cotización, home Astro, ficha de producto y login admin.
8. Promover manualmente a producción.
9. Documentar el procedimiento de rollback y probarlo una vez.

**Rollback del cambio de arquitectura**: antes del primer despliegue, no hay migración de datos. Si la imagen o configuración falla, conservar el deploy anterior, restaurar la documentación/flujo previo y volver a ejecutar el servicio estable. No se modifican colecciones Firebase en este cambio.

## Open Questions

Resueltas:

- **Runtime del API**: ✅ Cloud Run (aprobado por el cliente, 2026-09-08).
- **Proveedor de secretos para el API**: ✅ Google Secret Manager (implícito en la decisión 3; Coolify Secrets cubriría solo el fallback).

- **Región GCP**: ✅ `southamerica-west1` (aprobada por el cliente, 2026-09-08).
- **Dominios de frontends**: ✅ `somosriff.cl` (Astro) y `admin.somosriff.cl` (Angular) (aprobados, 2026-09-08).

- **Dominio del API**: ✅ `api.somosriff.cl` (aprobado, 2026-09-08).
- **Proyecto Firebase de staging**: ✅ separado, `riff-catalogo-staging` (aprobado, 2026-09-08).
- **URLs de staging**: ✅ `staging.somosriff.cl` (Astro), `admin-staging.somosriff.cl` (Angular), API staging con URL `*.run.app` provisional (aprobado, 2026-09-08).
- **Aprobador de promoción staging → producción**: ✅ Gabriel (2026-09-08).
- **`min-instances` del API**: diferida con default `0`; revisar tras medir cold starts en staging (no bloquea el pipeline).

No quedan pendientes que bloqueen la implementación del pipeline.
