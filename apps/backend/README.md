# apps/backend — NestJS BFF

Backend NestJS (BFF) del Catálogo Digital Headless Riff. Concentra la lógica de negocio, las validaciones, el control de acceso por roles y la integridad referencial que Firestore no garantiza nativamente. Alimenta al sitio público Astro (`apps/web`) y al panel admin Angular (`apps/admin`).

## Requisitos

- Node.js ≥ 22.12.0
- npm ≥ 10 (package manager del monorepo)
- (changes posteriores) Proyecto Firebase con Firestore/Storage/Auth habilitados + service account JSON

## Setup

```bash
# 1. Instalar dependencias desde la raíz del monorepo (hoisting de workspaces)
npm install

# 2. Copiar variables de entorno
cp apps/backend/.env.example apps/backend/.env

# 3. Arrancar en modo desarrollo
npm run start:dev --workspace=@riff/backend
```

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto en el que escucha la app | `3000` |

> Las variables de Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), CORS (`ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL`) y Throttler se añaden en los changes `backend-firebase-config` y `backend-commons`.

## Comandos clave

```bash
# Desarrollo (watch)
npm run start:dev --workspace=@riff/backend

# Tests unitarios (coverage >= 90%)
npm test --workspace=@riff/backend

# Tests e2e (config lista; primeros e2e HTTP entran en backend-commons)
npm run test:e2e --workspace=@riff/backend

# Lint (umbrales SOLID: max-lines 300, complexity 10)
npm run lint --workspace=@riff/backend

# Typecheck estricto
npm run typecheck --workspace=@riff/backend

# Build de producción
npm run build --workspace=@riff/backend

# Health check
curl http://localhost:3000/health   # => {"status":"ok"}
```

## Arquitectura

Clean Architecture por módulo de negocio (aplica desde `backend-categorias` en adelante):

```
apps/backend/src/
  domain/            # entidades, value objects, interfaces de puertos
  application/       # casos de uso / services
  infrastructure/    # repositories Firestore, controllers, adapters
```

Reglas duras (ver `docs/backend-standards.md`):
- `domain/` y `application/` NO importan infraestructura (Firebase Admin SDK, HTTP clients). DIP enforced por `.dependency-cruiser.js` (regla `no-infra-from-domain`).
- Umbrales: 300 líneas/archivo, complejidad 10, ≤3 params por constructor, ≤5 métodos por interfaz de puerto.
- Modelo anémico: entidades transportan datos; la lógica vive en services.

## Contrato

- `docs/api-spec.yml` — endpoints REST `/api/v1/...` (versioning se configura en `backend-commons`; `/health` va en la raíz sin prefijo).
- `docs/data-model.md` — colecciones Firestore (`productos`, `categorias`, `subcategorias`, `usuarios`, `cotizaciones`).

## Docker

```bash
# Desde la raíz del monorepo (contexto = raíz)
docker build -f apps/backend/Dockerfile -t riff-backend .
docker run -d -p 3000:3000 riff-backend
```
