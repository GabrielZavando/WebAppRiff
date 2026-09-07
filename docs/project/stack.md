# Stack — Riff Catálogo Digital Headless

Monorepo npm workspaces con tres aplicaciones:

```
apps/
├── backend/   # NestJS 10+ (BFF / API REST) — Firebase Firestore, Storage, Auth
├── web/       # Astro 4+ (sitio público SSG) — Tailwind CSS v4
└── admin/     # Angular 18+ (panel admin, standalone + signals) — Tailwind CSS v4
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

- Deploy: Docker image en VPS vía Coolify (provider VPS pendiente de decisión final).
- Runtime Node.js 20; TypeScript 5+ strict en los tres stacks.
