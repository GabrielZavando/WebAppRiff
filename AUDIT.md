# AUDIT — Riff Catálogo Digital Headless

> **Fecha**: 2026-09-08 · **Alcance**: repositorio completo (monorepo npm workspaces) · **Método**: análisis estático de solo lectura (sin ejecutar builds/tests) con evidencia `archivo:línea`.
> **Estado del proyecto**: desarrollo activo — backend y sitio público funcionales, panel admin en fase inicial (placeholder).

---

## 1. Resumen ejecutivo

| Área | Salud | Comentario |
|---|---|---|
| Backend (NestJS) | 🟢 Bueno | Clean Architecture real, cero `any`, umbrales de cobertura 90/90/90/90, guards en todos los writes |
| Sitio público (Astro) | 🟢 Bueno | ~85 tests unitarios + 8 e2e, fuentes self-hosted, build-time fetch con caché |
| Panel admin (Angular) | 🟡 No iniciado | Placeholder (`apps/admin/src/main.ts`); decisión de stack pendiente antes de construir |
| CI/CD | 🟠 Débil | CI sin typecheck/build/cobertura; audit no bloquea; deploy pipeline roto |
| Despliegue | 🔴 Crítico | `deploy.yml` se salta silenciosamente; no existe Dockerfile para web/admin |
| Documentación | 🟠 Drift | `stack.md` y `deploy-standards.md` desactualizados vs código real |

### Riesgos principales (ordenados)

1. 🔴 **El pipeline de deploy no despliega nada** (busca un Dockerfile en la raíz que no existe y además nunca hace `docker push`).
2. 🔴 **El sitio público puede publicarse vacío** sin que nadie lo note (fallback silencioso a `[]` si el API no responde en build-time).
3. 🟠 **El CI no protege lo que el proyecto considera sagrado**: sin typecheck, sin build, sin cobertura ejecutada, sin `npm audit` bloqueante.
4. 🟠 **Contrato de variables de entorno roto** entre `.env.example` y el código (`NESTJS_API_URL`, `SITE_URL`, `CATEGORIES_WEBHOOK_URL`).

---

## 2. Metodología

- Inspección estática de código (lectura + greps) sobre `apps/*`, `packages/*`, `.github/workflows/*`, `Makefile`, `openspec/`, `docs/`, archivos raíz.
- **No** se ejecutaron builds, tests ni comandos de red durante la auditoría; los conteos de tests son de presencia de archivos (`*.spec.ts`, `*.test.ts`).
- Severidad: 🔴 Crítico (bloquea o rompe producción) · 🟠 Alto (deuda o riesgo serio) · 🟡 Medio · 🔵 Bajo.
- Evidencia citada como `ruta:línea`.

---

## 3. Fortalezas a preservar

- **Tipado estricto y limpio**: TS `strict` + `strictNullChecks` + `noImplicitAny` (`apps/backend/tsconfig.json:16-21`). **Cero ocurrencias de `: any`** en `apps/backend/src` y `apps/web/src` (verificado por grep).
- **TDD real en backend**: ~80 archivos `.spec.ts` junto a su fuente; umbrales de cobertura **90/90/90/90** declarados (`apps/backend/jest.config.js:18-25`, aunque no se ejecuten en CI — ver H3).
- **Seguridad del API**: guards + roles en todos los endpoints de escritura (`FirebaseAuthGuard`, `RolesGuard` con `superadmin/admin/editor`); `OptionalFirebaseAuthGuard` solo en lecturas públicas (`producto.controller.ts:46-101`); DTOs con `whitelist + forbidNonWhitelisted` (`validation.config.ts:11-15`); CORS fail-closed en producción (`cors.config.ts:30-38`); sanitización HTML delegada al paquete compartido `@riff/html-sanitize` (consumido por backend via `html-sanitizer.service.ts` y por web en `toProductCardModel.ts`/`toProductDetailModel.ts`).
- **Dockerfile del backend impecable**: multi-stage, `node:22`, usuario no-root (`USER node`), `npm prune --omit=dev` (`apps/backend/Dockerfile`).
- **Sitio público muy probado**: ~85 archivos de test (componentes, páginas, config, api, types) incluyendo `styles/__tests__/tokens.test.ts`, `icon-catalog.test.ts`, `no-brand-classes.test.ts`; 8 specs e2e Playwright en `apps/web/e2e/`.
- **Design tokens sincronizados con guardia**: `globals.css` de web y admin declaran el mismo `@theme` y un test lo verifica (`apps/admin/src/styles/__tests__/sync.test.ts`).
- **Webhook de categorías defensivo**: no-op si `CATEGORIES_WEBHOOK_URL` no está definido; fire-and-forget sin romper la mutación (`webhook-category-change-notifier.ts:15-31`).
- **Biblioteca HTML despachada como paquete compartido** (`packages/html-sanitize`) en lugar de duplicarse.

---

## 4. Hallazgos detallados

### 🔴 H1 — El pipeline de deploy está roto y es silencioso

**Evidencia**:
- `.github/workflows/deploy.yml:20,46` → `if: ${{ hashFiles('Dockerfile') != '' }}` busca el Dockerfile en la **raíz del repo**; el único Dockerfile vive en `apps/backend/Dockerfile` → `dockerfile-present` siempre es `false` → **ambos jobs terminan sin hacer nada, con éxito**.
- `deploy.yml:24,50` → `docker build -t $REPO:staging` construye en el runner **pero nunca hace `docker push`**; luego el VPS ejecuta `docker pull $REPO:staging` (`:33,:59`) → el pull fallaría o traería una imagen antigua.
- `deploy.yml:79` → rollback a tag `:previous` que **nunca se crea ni se pushea**.
- `deploy.yml:36,62` → `docker run -d ...` **sin pasar `-e`** para `FIREBASE_*` ni `NESTJS_API_URL` → el contenedor no podría arrancar contra Firestore.
- No hay healthcheck post-deploy ni lógica de verificación.
- El workflow solo contempla un contenedor backend; **no existe pipeline para web ni admin** (ver sección 5).
- `deploy-standards.md:30-32` ya declara que debe existir un Dockerfile multi-stage **por app** (backend, web, admin) — hoy solo existe el del backend.

**Impacto**: imposible desplegar por CI; cualquier release sería manual. Riesgo alto de desplegar un contenedor inservible (sin env vars) o un catálogo vacío.

**Recomendación**: reescribir la estrategia de deploy conforme a la arquitectura objetivo (sección 5), no parchear este workflow.

---

### 🔴 H2 — El catálogo público puede publicarse vacío silenciosamente

**Evidencia**:
- `apps/web/src/lib/api/products.ts:45-51` → ante cualquier fallo del API en build-time, `getPublicProducts()` hace `cached = []` y solo `console.warn`. El comentario lo declara intencional ("the build never fails").
- Mismo patrón en `products.ts:96-102` para detalle de producto (cae a `null` → 404) y espejado en `lib/api/categories.ts` y `subcategories.ts` (módulo con caché + fallback, según `products.ts:14`).
- `astro.config.mjs:10` → `site: process.env.SITE_URL || 'http://localhost:4321'` sin validación de entorno.

**Impacto**: en producción, si el API está caído o mal configurado (p. ej. `NESTJS_API_URL` mal formado — ver H4), `astro build` **pasa** y se publica un sitio sin productos. Los e2e no lo detectan porque corren contra un backend vivo local.

**Recomendación**: comportamiento diferenciado por entorno — en `NODE_ENV=production` fallar el build si el API no responde (o exigir `REQUIRE_API=true` explícito); en dev/staging mantener el fallback. Añadir un test e2e que verifique que el catálogo no queda vacío tras el build.

---

### 🟠 H3 — Los gates de CI no protegen el código

**Evidencia**:
- `Makefile:192` → `ci: refs solid-lint lint test audit` — **sin `typecheck`, sin `build` para los workspaces, sin cobertura**.
- `Makefile:125` → `npm audit --audit-level=high || true` — el `|| true` hace que **npm audit jamás falle el pipeline**.
- `lint` en CI muta archivos: `--fix` en backend (`apps/backend/package.json:18`), web (`apps/web/package.json:14`) y admin (`apps/admin/package.json:14`) — corrige y continúa, enmascarando errores que deberían fallar.
- Umbrales de cobertura declarados (`apps/backend/jest.config.js:18-25`) **nunca se evalúan** porque `npm test` corre sin `--coverage` y `make ci` no lo exige.
- Falta verificación de compile de web (`astro check`/`tsc`) y admin (`ng build`) en el gate.
- `ci.yml:28,51` usa `node-version: '24'` mientras `engines` del repo exige `>=22.12` (ver H6).

**Impacto**: el CI da falsa sensación de seguridad: un PR con errores de tipos, código que no compila o deuda de seguridad puede pasar.

**Recomendación**: ampliar `make ci` (o el job `project-ci`) a `refs + solid-lint + lint + typecheck + build + test (con cobertura) + audit (bloqueante, sin `|| true`)`. Qué `lint` no use `--fix` en CI (dexar `--fix` solo en script local `lint:fix`).

---

### 🟠 H4 — Contrato de variables de entorno roto (`env.example` vs código)

**Evidencia**:
- `.env.example:14` → `NESTJS_API_URL=http://localhost:3000` — **sin `/api/v1`**, pero `apps/web/src/lib/api/products.ts:20` hace `process.env.NESTJS_API_URL ?? 'http://localhost:3000/api/v1'` y construye `${base}/products` (`:37`). Si alguien copia `.env.example` a `.env`, el sitio web llama a `http://localhost:3000/products` → 404 → **catálogo vacío** (agravado por H2).
- `astro.config.mjs:10` usa `SITE_URL` — **no existe en `.env.example`**. Canonical/sitemap podrían generarse contra `localhost`.
- `webhook-category-change-notifier.ts:7,26` usa `CATEGORIES_WEBHOOK_URL` — documentado en `deploy-standards.md:77` pero **ausente de `.env.example`**.
- `.env.example:55-56` declara `LOG_LEVEL`/`LOG_FORMAT` que **ningún código lee** (grep del backend no encuentra consumidores) — variables muertas que confunden.

**Impacto**: configuración errónea garantizada en el primer entorno real; webhook de rebuild del sitio Astro silenciosamente inactivo.

**Recomendación**: unificar el contrato de env en `.env.example` (con `/api/v1` documentado o normalizado en código), añadir `SITE_URL` y `CATEGORIES_WEBHOOK_URL`, eliminar muertas, y añadir validación de env en el frontend (p. ej. fail en build si `SITE_URL` ausente en producción).

---

### 🟠 H5 — `release.yml` intenta publicar un paquete privado

**Evidencia**:
- `.github/workflows/release.yml:39-56` → `npm publish` del paquete raíz `riff-catalogo-digital`, que es `"private": true` (`package.json:4`) → el publish **falla siempre** en cada push a `main`.
- Es residuo del template del framework (dogfooding de `@gabrielzavando/specboot`), no de este producto.

**Impacto**: job roto permanente en `main`; ruido en el historial de checks.

**Recomendación**: eliminar el job `publish` (o condicionarlo a un paquete publicable real). El proyecto no publica nada a registros npm.

---

### 🟡 H6 — Drift de versiones y documentación

**Evidencia**:
- **Node**: `engines >=22.12` (raíz `package.json:22`), Dockerfile `node:22` (`apps/backend/Dockerfile:13,38`), CI `node: '24'` (`ci.yml:27,50`), `deploy-standards.md:84` dice "Runtime: Node.js 20" → **4 versiones distintas referenciadas**.
- **@types/node**: `^20` en backend y admin, `^22` en web.
- **TypeScript**: `^5.3` en backend/admin, `^5.9.3` en web — inconsistencias de resolución en monorepo.
- **vitest**: `^1.0.0` en admin (`apps/admin/package.json:47`), `^4.1.10` en web (`apps/web/package.json:42`) — dos majors de runner en el mismo repo.
- **Astro**: `stack.md:8` dice "Astro 4+" pero se usa `astro 7.1.6` (`apps/web/package.json:26`).
- **NestJS 10** (`^10.0.0`) con 11 ya en el mercado; **ESLint 8** (EOL) en los tres workspaces.
- El podcast admin trae **dos librerías de estado redundantes**: `@ngrx/store` y `@ngrx/signals` (`apps/admin/package.json:27-28`) — decisión pendiente antes de construir (ver M4).

**Impacto**: builds no reproducibles entre máquinas, resolución de tipos divergente, docs que confunden.

**Recomendación**: alinear a Node 22 + `@types/node@22` + TypeScript único; subir admin a vitest 4; corregir `stack.md` (Astro 7, Node 22) y `deploy-standards.md` (Node 22); migrar ESLint 9 + typescript-eslint v8 (P3).

---

### 🟡 M — Otros hallazgos medios

- **M1 · Sin sitemap**: `@astrojs/sitemap` ausente en `apps/web/package.json` y en `astro.config.mjs` — pese a que SEO es prioridad declarada (`docs/project/client.md`, `stack.md`). Con `site` configurado, integrarlo es barato.
- **M2 · Higiene raíz**: 3 carpetas `.specboot-backup-*` sin gestionar, `dist/` en la raíz, y los seeds JSON de cliente (`seed-productos-71.json`, `seed-categorias-subcategorias.json`) en la raíz (estos sí están referenciados por CLIs y documentados en `docs/seed-catalog.md` — no son huérfanos, solo conviene moverlos a `data/` o mantenerlos documentados).
- **M3 · E2E limitados a web**: `apps/web/e2e/` cubre componentes de landing (8 specs) pero no flujos completos de catálogo/cotización contra el API real; sin e2e para backend (`test:e2e` de backend no tiene specs en `apps/backend`).
- **M4 · Admin: stack por decidir**: dependerá de una decisión (`@ngrx/store` vs `@ngrx/signals` vs solo signals nativas) antes de construir features; cambiar después es caro.
- **M5 · Firestore paginación/proyección pendiente de verificar**: los endpoints públicos de listado podrían devolver entidades completas sin paginación; marcar como verificación en P2 (no afirmado en esta auditoría).
- **M6 · Backups del framework**: `.specboot-backup-*` duplican estructura del repo; revisar si `.gitignore` los cubre y archivar/eliminar los antiguos.

---

## 5. Arquitectura de despliegue objetivo

Según decisión del cliente (2026-09-08):

| Capa | Dónde corre |
|---|---|
| **Firebase (gestionado)** | Firestore (BD), Authentication (incl. recuperación de contraseña), Storage (archivos/imágenes) |
| **VPS + Coolify** | Sitio público Astro (estático SSG) y panel Angular (estático) — **faltan los Dockerfiles de `apps/web` y `apps/admin`** |
| **API NestJS (BFF)** | **Decisión pendiente** — ver tabla abajo |

### 5.1 Ubicación del API NestJS — RESUELTA (2026-09-08): Cloud Run

> **Resolución**: decisión aprobada por el cliente el 2026-09-08. Fuentes canónicas vigentes: `docs/project/stack.md` e `docs/deploy-standards.md` (change `decide-api-deployment-architecture`). La tabla siguiente se conserva como registro de la evaluación original.

| Opción | Pros | Contras |
|---|---|---|
| **(a) Cloud Run (GCP)** ⭐ | Corre **el Dockerfile existente sin cambios** (`apps/backend/Dockerfile` es un contenedor estándar node:22); escala a cero + free tier (≈2M req/mes); hasta ~80 requests concurrentes por instancia; mínima latencia a Firestore si la región coincide (p. ej. `southamerica-west1`); misma imagen es portable a Coolify si cambia la decisión; sin ops de servidor | Cold start de NestJS (~1-4 s con 0 instancias; mitigable con `min-instances: 1`, coste bajo); requiere Artifact Registry + CI/`gcloud` |
| **(b) Contenedor en el VPS vía Coolify** | Todo en un solo proveedor (VPS); sin cold start; el equipo ya conoce Docker | El VPS absorbe tráfico/memoria del API (2-3 contenedores en un mismo host); más ops (monitoreo, reinicios, TLS interno); acopla API a la salud del VPS |
| **(c) Cloud Functions (2nd gen)** | Gestionado como Cloud Run (corre sobre Cloud Run) | Ata al Functions Framework; sin ventaja sobre (a) en este caso; NestJS encaja peor |

> **Recomendación del documento (no vinculante)**: **Cloud Run** como candidata fuerte por portabilidad total del contenedor y zero-ops. La decisión no bloquea el plan P0 salvo el punto D1 (no tocar `deploy.yml` hasta decidir; mientras tanto el backend se despliega igual con el mismo Dockerfile en cualquiera de las dos vías).

### 5.2 Brechas de deploy detectadas

- Faltan **Dockerfiles de `apps/web`** (Astro SSG → imagen estática con nginx/Caddy, sin Node en runtime) y **`apps/admin`** (Angular compilado → estáticos).
- `deploy-standards.md:31-32` prevé "build in-situ de Coolify desde el repo" como opción MVP — coherente con la arquitectura objetivo; el `deploy.yml` actual (SSH docker pull) no es la vía estándar Coolify.
- Falta resolver: dominios + TLS (Coolify gestiona certs), definición de entornos staging/prod, y variables de entorno por servicio (ver H4).

---

## 6. Plan de mejoras priorizado (impacto × esfuerzo)

Leyenda esfuerzo: **S** < 1 día · **M** 1-3 días · **L** 1-2 semanas. Cada ítem termina en un ticket `/plan-change`.

### P0 — Confiabilidad y despegue (hacer primero)

| ID | Mejora | Evidencia | Pasos | Aceptación | Esfuerzo |
|---|---|---|---|---|---|
| **D1** | Decidir ubicación del API y definir arquitectura de deploy definitiva (Coolify in-situ para los 3 servicios, o Cloud Run para API + Coolify para frontends) | §5.1, H1 | Opciones con pros/contras ya documentadas; decidir con el cliente; actualizar `deploy-standards.md` | Doc `deploy-standards.md` actualizado y aprobado; sin contradicciones con `stack.md` | S |
| **D2** | Crear Dockerfiles de `apps/web` y `apps/admin` (multi-stage con servidor estático) | H1, §5.2 | Dockerfile web (build astro → nginx/Caddy con gzip/brotli) y admin (ng build → nginx); contexto de build = raíz del monorepo (mismo patrón que `apps/backend/Dockerfile:4-10`) | `docker build` de los 3 servicios localmente; imágenes < ~150 MB; estáticos sirven correctamente | M |
| **D3** | Reescribir `deploy.yml` (o reemplazarlo por flujo Coolify) eliminando los defectos H1: path de Dockerfile, push a registry (o build in-situ Coolify), env vars por servicio, healthcheck post-deploy, rollback real, smoke tests post-deploy (`deploy-standards.md:39-43`) | H1 | Rediseñar flujo; conectar registry GHCR/Artifact si aplica; pasar `FIREBASE_*`/`NESTJS_API_URL` vía env del entorno Coolify | Deploy staging automático con smoke tests verdes; rollback comprobado una vez | L |
| **C1** | Endurecer el gate de CI: añadir `typecheck` y `build` por workspace, cobertura bloqueante (90 %), `npm audit` sin `|| true` | H3 | Ampliar `Makefile:192` (`ci: refs solid-lint lint typecheck build test-cov audit`) o el job `project-ci` de `ci.yml:43-55`; separar `lint` (sin `--fix`) de `lint:fix` | `make ci` falla con: error de tipos, compile fallido, cobertura < 90 %, vulnerabilidad high | M |
| **E1** | Corregir contrato de env: `.env.example` con `SITE_URL`, `NESTJS_API_URL` (con `/api/v1` normalizado), `CATEGORIES_WEBHOOK_URL`; eliminar `LOG_LEVEL`/`LOG_FORMAT` muertas | H4 | Actualizar `.env.example`; normalizar base URL en `lib/api/*` (construir siempre sobre `/api/v1` para no romper si el env no lo trae); validar `SITE_URL` en build de producción | Build de producción falla si `SITE_URL` no está; catálogo carga con `.env.example` copiado tal cual | S |
| **E2** | Fail-fast en producción si el API no responde en build-time (flag `REQUIRE_API` o equivalente); fallback solo en dev | H2 | Modificar `lib/api/products.ts:45-51` y espejos en categories/subcategories; añadir e2e que detecte catálogo vacío tras build | En `NODE_ENV=production`, un API caído hace fallar `astro build`; en dev mantiene fallback | S |

### P1 — Escalabilidad y limpieza estructural

| ID | Mejora | Evidencia | Pasos | Aceptación | Esfuerzo |
|---|---|---|---|---|---|
| **V1** | Alinear versiones: Node 22 (engines, Docker, CI, docs), `@types/node@22`, TypeScript único, vitest 4 en admin | H6 | Subir `@types/node` a ^22 en backend/admin; `typescript@~5.9` uniforme; `vitest@^4` en admin; `ci.yml` a node 22; corregir `stack.md` y `deploy-standards.md` | Un solo Node y un solo TS en todo el monorepo; `npm ci` reproducible | M |
| **V2** | Eliminar el job `publish` de `release.yml` (o condicionarlo) | H5 | Editar `release.yml:39-56` | Checks verdes en `main` sin publish | S |
| **H1.1** | Gestión de backups y residuos: archivar `.specboot-backup-*` y `dist/` raíz; decidir ubicación de seeds (`data/`) y asegurar `.gitignore` | M2, M6 | Mover/eliminar backups antiguos; añadir entradas a `.gitignore` si faltan; mover seeds a `data/` actualizando `SEED_FILE_PATH` y `docs/seed-catalog.md` | `git status` limpio; seeds referenciados desde su nueva ruta | S |
| **A1** | Definir stack del panel admin **antes** de escribir features: signals nativas vs `@ngrx/signals`, y eliminar `@ngrx/store` si no se usa | M4, H6 | Decisión arquitectónica documentada en `docs/frontend-standards.md`; refactor de deps del admin | `apps/admin/package.json` sin dependencias redundantes; estándar actualizado | S |

### P2 — Producción y rendimiento

| ID | Mejora | Evidencia | Pasos | Aceptación | Esfuerzo |
|---|---|---|---|---|---|
| **W1** | Integrar `@astrojs/sitemap` (+ canonical/OG coherentes con `SITE_URL`) | M1 | Añadir integración a `astro.config.mjs`; verificar URLs canónicas en build | `/sitemap-index.xml` generado; canonicals apuntan al dominio final | S |
| **W2** | Verificar y optimizar consultas del API: paginación en listados públicos de productos, proyección de campos para cards (sin `galeria` completa innecesaria), índices compuestos de Firestore | M5 | Revisar `producto-read.service.ts` y `producto.controller.ts`; añadir paginación/`select` si falta; documentar índices en `docs/data-model/data-model.md` | Listados paginados con proyección; sin lecturas innecesarias de `galeria` por card | M |
| **W3** | Auditoría de payload web: imágenes de `galeria` servidas con transformación (WebP, widths responsivos) en runtime | domain.md:20, §3 | Verificar servicio de imágenes de Astro/`astro:assets` en `ProductGallery.astro`/`ProductCard.astro` | Imágenes con `srcset`/formatos modernos; LCP bajo | M |

### P3 — Calidad continua y deuda diferida

| ID | Mejora | Evidencia | Pasos | Aceptación | Esfuerzo |
|---|---|---|---|---|---|
| **Q1** | Migrar ESLint 8 → 9 (flat config) y typescript-eslint v8 en los tres workspaces | H6 | Actualizar deps y configs; validar contra `templates/ci/*` (framework) | `eslint` 9 limpio en los 3 apps; CI verde | L |
| **Q2** | Upgrade NestJS 10 → 11 | H6 | Actualizar `@nestjs/*`; corregir breaking changes; CI + test:cov verdes | Backend en NestJS 11 con suite verde | M |
| **Q3** | Ampliar e2e: backend (`test:e2e` sin specs), flujos completos web (listado → ficha → cotización) y humo de admin (login, CRUD) | M3, deploy-standards.md:44-53 | Crear specs e2e por app; mapear a `npm run test:smoke` | Smoke tests verdes en staging por cada deploy | L |
| **Q4** | Tests de contrato del envelope `{data, error, meta}` del API (consumidor web vs backend) | stack.md:14 | Spec compartida (OpenAPI `docs/api/api-spec.yml`) + tests de contrato | Cambios de envelope rompen tests, no producción | M |
| **Q5** | Cerrar TODO pendiente y deuda menor: `PanelHome.astro:55` (TODO de `design-system-revision`), migración de contenido config a CMS si el cliente lo pide (hoy contenido en `lib/config/*`) | §grep TODO | Revisar item por item; archivar el design system o implementar | Cero TODOs en código; decisión sobre contenido configurable documentada | S/M |

### Orden de ejecución sugerido (roadmap)

1. **Semana 1**: D1 (decisión API) + E1 + E2 + V2 + C1 (gate CI duro). Con esto el repo queda "desplegable en falso": CI bloqueante, env sano, sin catálogo vacío.
2. **Semana 2**: D2 + D3 (Dockerfiles web/admin + pipeline/deploy con Coolify) + smoke tests básicos.
3. **Semana 3**: V1 + H1.1 + A1 (decisión stack admin) — alineación total y arranque del admin limpio.
4. **Semanas 4-6**: W1 + W2 + W3 (producción/rendimiento) en paralelo con features del admin.
5. **Trimestre**: Q1-Q5 (deuda diferida) según ritmo del equipo; re-auditar tras Q2.

---

## 7. Métricas objetivo para re-auditoría

| Métrica | Baseline (2026-09-08) | Target |
|---|---|---|
| Cobertura backend ejecutada en CI | Declarada 90 % pero **no verificada** | ≥ 90 % bloqueante en `make ci` |
| `npm audit` en CI | No bloquea (`|| true`) | 0 vulnerabilidades high/critical |
| Cobertura tests web | ~85 archivos test + 8 e2e | + e2e flujos completos catálogo/cotización |
| Dockerfiles por app | 1 de 3 (backend) | 3 de 3 (backend, web, admin) |
| Deploy automático | Roto (H1) | Staging automático + smoke + rollback |
| Env contract | 2 vars ausentes en `.env.example` | `.env.example` = único contrato, 100 % sincronizado |
| `any` / `@ts-ignore` | 0 / 0 | Se mantiene en 0 (regresión prohibida vía lint) |
| TODOs en código | 1 real | 0 |

---

## 8. Anexo — Inventario rápido

- **Backend**: ~90 archivos fuente en `apps/backend/src` (sin contar specs), módulos `auth`, `productos`, `categorias`, `subcategorias`, `usuarios`, `common` (config/filters/interceptors/guards), CLIs de migración/seed (bootstrap-superadmin, seed-catalog, seed-productos, migrate-firestore, migrate-imagenes, normalize-descriptions).
- **Web**: 8 páginas, ~37 componentes Astro, `lib/{api,config,products,types,scroll,anim}`, 8 e2e Playwright.
- **Admin**: placeholder (`main.ts` + `config/` + `styles/`), 5 tests de configuración.
- **Paquete compartido**: `@riff/html-sanitize` (consumido por backend y web).
- **OpenSpec**: 2 cambios archivados en `openspec/state/manifest.json` (2026-09-02); `openspec/changes/` vacío — **sin cambio activo**; sin `verify-results.json` ni `adversarial-result.json` aún.