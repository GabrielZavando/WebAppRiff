# Riff Catálogo Digital Headless

Monorepo de la plataforma de catálogo digital de **Riff**: un backend headless
(NestJS) que expone una API REST, un sitio público de catálogo (Astro, SSG) y un
panel de administración (Angular).

## Stack

| App | Carpeta | Stack |
|---|---|---|
| Backend (BFF) | `apps/backend` | NestJS 11+ — Clean Architecture por módulo (`domain/`, `application/`, `infrastructure/`), Firebase Firestore, Storage y Auth |
| Sitio público | `apps/web` | Astro 7 (SSG) — Tailwind CSS v4, SEO y Core Web Vitals prioritarios |
| Panel admin | `apps/admin` | Angular 22+ — standalone components, signals, NgRx Signals |
| Utilidades | `packages/*` | `html-sanitize` |

- **Monorepo npm workspaces** (`apps/*`, `packages/*`), Node 24, TypeScript strict.
- **Base de datos**: Firebase Firestore (schemaless; la integridad referencial se
  implementa en NestJS).
- **Infraestructura**: API en **Google Cloud Run**, frontends estáticos en
  **VPS con Coolify**, rebuild del sitio vía webhook al cambiar el catálogo.
  Detalle en `docs/deploy-standards.md` y `docs/project/stack.md`.

## Quick Start

```bash
npm ci                 # instala dependencias (workspaces)
npm run dev:backend    # NestJS en modo watch
npm run dev:web        # sitio Astro
npm run dev:admin      # panel Angular

npm run lint           # lint por workspace
npm run typecheck      # typecheck por workspace
npm test               # tests por workspace
npm run build          # build por workspace
```

## Estructura

```
.
├── apps/
│   ├── backend/            # NestJS BFF (API /api/v1)
│   ├── web/                # Sitio público Astro (SSG)
│   └── admin/              # Panel admin Angular
├── packages/
│   └── html-sanitize/      # Utilidad compartida
├── docs/                   # Estándares del proyecto
│   ├── project/            #   stack, domain, client
│   ├── backend-standards.md
│   ├── frontend-standards.md
│   ├── deploy-standards.md
│   └── ...
├── openspec/               # Artefactos OpenSpec (SDD)
│   ├── config.yaml
│   ├── specs/              #   Capabilities (spec.md)
│   └── changes/            #   Changes activos y archivados
├── .opencode/              # Skills y comandos de OpenCode
├── .github/workflows/ci.yml
├── AGENTS.md               # Instrucciones para agentes IA
├── Makefile                # Targets de CI del proyecto
└── opencode.json           # Config de OpenCode
```

## Flujo de desarrollo (OpenSpec)

El ciclo SDD se ejecuta con la CLI [OpenSpec](https://github.com/Fission-AI/OpenSpec)
vía OpenCode, usando las skills instaladas en `.opencode/skills/`:

| Comando | Descripción |
|---|---|
| `/opsx-propose "idea"` | Proponer un change (proposal, design, tasks) |
| `/opsx-apply` | Implementar tasks con TDD |
| `/opsx-archive` | Archivar el change al completarlo |
| `/opsx-explore` | Explorar / pensar antes de proponer |
| `/opsx-sync` | Sincronizar deltas de specs del change activo |

Los artefactos viven en `openspec/` (`specs/` para capabilities, `changes/` para
changes activos y archivados). Los artefactos OpenSpec se escriben en español;
el código, en inglés.

## CI/CD

- **`.github/workflows/ci.yml`**: en push/PR a `main` corre `make ci`
  (`openspec validate --all --strict` + lint + typecheck + test + audit).
- **Deploy**: merge a `main` → la GitHub App de Coolify despliega los frontends
  de staging (`riff-web-staging`, `riff-admin-staging`); el backend se despliega
  a Cloud Run. Ver `docs/deploy-standards.md`.
- **Commits**: Conventional Commits en inglés, enforced por husky + commitlint.

## Validación local

```bash
make ci                    # gate completo de CI
npx openspec validate --all --strict   # valida specs y changes
```

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | >= 24 |
| npm | 10+ |
| OpenSpec CLI | 1.14.0 (devDependency del repo) |
| OpenCode | última |

---

## Licencia

MIT © 2026 Gabriel Zavando