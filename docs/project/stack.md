# Stack — Riff Catálogo Digital Headless

Monorepo npm workspaces con tres aplicaciones:

```
apps/
├── backend/   # NestJS 11+ (BFF / API REST) — Firebase Firestore, Storage, Auth
├── web/       # Astro 7 (sitio público SSG) — Tailwind CSS v4
└── admin/     # Angular 22+ (panel admin, standalone + signals) — Tailwind CSS v4
```

## Arquitectura

- **Backend (NestJS)**: Clean Architecture por módulo de negocio — divisiones `domain/`, `application/`, `infrastructure/`. REST API versionada en `/api/v1/` con envoltura de respuesta `{ data, error, meta }`.
- **Sitio público (Astro)**: SSG en build-time; fetching del catálogo desde el backend en `getStaticPaths`/frontmatter vía `lib/api/`. SEO y Core Web Vitals prioritarios.
- **Panel admin (Angular)**: standalone components, signals, NgRx Signals. Smart vs dumb components.
- **Design tokens**: sincronizados manualmente vía `@theme {}` de Tailwind v4 en `apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css`.

## Base de datos

- Firebase Firestore (via Firebase Admin SDK en backend). Schemaless; la integridad referencial se implementa en NestJS (validaciones explícitas antes de cada escritura).
- Firestore Storage para medios. Firebase Auth con Custom Claims para roles (superadmin, admin, editor).

## Infraestructura

Arquitectura de despliegue aprobada (change `decide-api-deployment-architecture`, 2026-09-08):

- **Firebase (gestionado)**: Firestore, Firebase Authentication (incl. recuperación de contraseña) y Firebase Storage. No se operan servicios de datos en el VPS.
- **API NestJS (BFF)**: **Google Cloud Run** — la imagen de `apps/backend/Dockerfile` (multi-stage, Node 24) se publica en Artifact Registry y se despliega con `gcloud run deploy` desde GitHub Actions. Secretos Firebase vía Google Secret Manager. Escala a cero; revisar `min-instances` tras medir cold starts en staging.
- **Frontends (estáticos)**: sitio Astro y panel Angular como **servicios independientes en VPS con Coolify** (build in-situ desde Git en MVP). Dockerfiles multi-stage creados (`apps/web/Dockerfile`, `apps/admin/Dockerfile`, runtime nginx + healthcheck).
- **Rebuild del sitio**: el backend dispara un webhook de Coolify (`CATEGORIES_WEBHOOK_URL`) cuando cambian categorías, para regenerar el sitio estático.
- **Runtime**: Node.js 24 (alineado a `engines` del monorepo); TypeScript 5+ strict en los tres stacks.

Definido (2026-09-08): región GCP **`southamerica-west1`**; dominios **`somosriff.cl`** (sitio Astro), **`admin.somosriff.cl`** (panel Angular) y **`api.somosriff.cl`** (API); proyecto Firebase de staging separado (**`riff-catalogo-staging`**). Detalle operativo en `docs/deploy-standards.md` y `AUDIT.md`.
