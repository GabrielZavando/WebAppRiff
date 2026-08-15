# apps/backend — NestJS BFF

Backend NestJS (BFF) del Catálogo Digital Headless Riff. Concentra la lógica de negocio, las validaciones, el control de acceso por roles y la integridad referencial que Firestore no garantiza nativamente. Alimenta al sitio público Astro (`apps/web`) y al panel admin Angular (`apps/admin`).

## Requisitos

- Node.js ≥ 22.12.0
- npm ≥ 10 (package manager del monorepo)
- Proyecto Firebase con Firestore/Storage/Auth habilitados + service account JSON

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
| `FIREBASE_PROJECT_ID` | Project ID del proyecto Firebase (campo `project_id` del service account JSON) | — |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio (campo `client_email`) | — |
| `FIREBASE_PRIVATE_KEY` | Private key de la cuenta de servicio (campo `private_key`, **con los `\n` escapados literales**). El backend los normaliza en runtime | — |

> CORS (`ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL`) y Throttler se añaden en el change `backend-commons`.

## Firebase setup

El backend usa Firebase Admin SDK (Firestore, Auth, Storage) vía un service account. Pasos:

1. En Firebase Console, creá (o seleccioná) el proyecto `riff-catalogo`.
2. Habilitá **Firestore Database** (modo producción) y **Authentication** (proveedor Email/Password + el que requiera el cliente), y **Storage** si se usará para binaries (PDF de fichas técnicas, imágenes).
3. Ir a **Project Settings → Service accounts → Generate new private key** y descargar el JSON.
4. Del JSON, mapeá tres campos a las variables de entorno:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
5. El `private_key` del JSON trae los saltos de línea escapados como `\n`. Pegalos **exactamente así** (entre comillas simples en `.env` para evitar que el shell los interprete). El backend los convierte a saltos reales antes de pasarlos a `firebase-admin`.
6. **Nunca commitees** el JSON ni el `.env` con valores reales. Ambos están en `.gitignore`.

Si falta cualquiera de las tres variables, el backend falla rápido (fail-fast) al arrancar con un error descriptivo que nombra la variable ausente — no queda escuchando a medias.

## Bootstrap del primer superadmin

El módulo `usuarios` protege la creación de usuarios por rol, y crear un `superadmin` requiere un `superadmin` ya autenticado (ver `docs/api-spec.yml` y `docs/data-model.md`). Eso crea el problema del huevo y la gallina: **no hay forma de crear el primero desde la API**. Por eso existe un comando CLI operativo, idempotente, que crea el primer `superadmin` directamente (Firebase Auth + custom claim `role` + documento `usuarios/{uid}`), sin necesidad de un actor autenticado.

1. Seteá las variables de entorno `BOOTSTRAP_SUPERADMIN_EMAIL` y `BOOTSTRAP_SUPERADMIN_PASSWORD` (mínimo 6 caracteres) en el `.env` del backend (o en el entorno del deploy). Opcionalmente `BOOTSTRAP_SUPERADMIN_NAME`.
2. Ejecutá una sola vez (desde `apps/backend`):

   ```bash
   BOOTSTRAP_SUPERADMIN_EMAIL=admin@riff.cl \
   BOOTSTRAP_SUPERADMIN_PASSWORD='cambiame123' \
   npm run bootstrap:superadmin
   ```

3. El comando es **idempotente**: si ya existe un usuario con ese email, lo devuelve sin crear duplicados. La password no se loguea nunca.

Tras el bootstrap, ese usuario puede iniciar sesión desde el futuro panel admin (Firebase Auth, email/password) y acceder a `/api/v1/auth/me` para conocer su perfil/rol.

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

# Bootstrap del primer superadmin (una sola vez; idempotente)
npm run bootstrap:superadmin --workspace=@riff/backend

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
