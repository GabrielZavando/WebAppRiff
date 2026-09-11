# Enriched Ticket — V1

## User Story enriched: V1

**As a** mantenedor del repositorio / líder técnico
**I want** alinear todas las versiones del monorepo a Node 24 LTS y sus últimas versiones estables compatibles
**So that** el proyecto tenga un runtime moderno, reproducible, sin inconsistencias de tipos ni versiones rotas entre workspaces, y sin dependencias EOL.

**Capas afectadas**: `fullstack` (tooling, configs, Dockerfiles, docs — transversal a los 3 workspaces)

### Context

Origen: AUDIT.md H6. El proyecto tiene:
- 4 versiones de Node referenciadas (22 en engines/Dockerfiles/docs, 24 en CI)
- 3 majors de vitest (^1 en admin, ^3 en root, ^4 en web)
- @types/node inconsistente (^20 en backend/admin, ^22 en web)
- TypeScript desalineado (^5.3 en backend/admin/html-sanitize, ^5.9 en web)
- NestJS 10 (EOL cuando NestJS 12 ya salió)
- ESLint 8 (EOL) en los 3 workspaces
- Angular 18 con Angular 22 como LTS activo soportado hasta 2028
- Sin `.nvmrc` para consistencia de entorno
- `apps/admin` sin `vitest.config.*` ni `playwright.config.*` a pesar de declarar ambas dependencias
- `@ngrx/store` redundante con `@ngrx/signals` (decisión A1: eliminar en V1)

**Decisiones del usuario (confirmadas):**
- Node 24 como runtime objetivo (LTS Krypton, v24.20.0)
- Angular 22 (Active LTS hasta junio 2028)
- NestJS 11 (estable; v12 recién salido, demasiado fresco)
- ESLint 9 con flat config (migración completa)
- Eliminar `@ngrx/store` redundante en V1
- Incluir `.nvmrc` para consistencia de entorno

### Versiones objetivo (septiembre 2026)

| Paquete | Actual | Objetivo | Notas |
|---------|--------|----------|-------|
| Node.js | 22 (Docker/engines) / 24 (CI) | **24 LTS** | Krypton, v24.20.0 |
| npm | 10.9.8 | **11.x** | Incluido con Node 24 |
| Angular | ^18.0.0 | **^22.0.0** | Active LTS hasta 2028-06 |
| NestJS | ^10.0.0 | **^11.2.0** | Estable; v12 recién salido |
| TypeScript | ^5.3 / ^5.9 | **~5.9.0** | Uniforme en todos los workspaces |
| ESLint | ^8.56.0 | **^9.0.0** | Migración a flat config |
| @typescript-eslint | ^7.0 | **^8.0.0** | Compatible con ESLint 9 |
| vitest | ^1 / ^3 / ^4 | **^4.1.10** | Uniforme |
| Playwright | ^1.40 / ^1.62 | **^1.52.0** | Uniforme |
| @types/node | ^20 / ^22 | **^24.0.0** | Matching Node 24 |
| @ngrx/* | ^18.0.0 | **^22.0.0** | Matching Angular 22 (sin @ngrx/store) |
| @angular/fire | ^18.0.0 | **^22.0.0** | Matching Angular 22 |

### Diseño de Clases/Componentes

**Cambios por archivo:**

- `package.json` raíz: `engines.node` → `>=24.0.0`, `packageManager` → `npm@11.x`, `@types/node` → `^24.0.0`, `vitest` → `^4.1.10`
- `apps/backend/package.json`: `@nestjs/*` → `^11.2.0`, `@types/node` → `^24.0.0`, `typescript` → `~5.9.0`, `eslint` → `^9.0.0`, `@typescript-eslint/*` → `^8.0.0`, añadir `engines.node >= 24.0.0`
- `apps/web/package.json`: `@types/node` → `^24.0.0`, `vitest` → `^4.1.10`, `playwright` → `^1.52.0`
- `apps/admin/package.json`: `@angular/*` → `^22.0.0`, `@ngrx/signals` → `^22.0.0`, **eliminar `@ngrx/store`**, `vitest` → `^4.1.10`, `playwright` → `^1.52.0`, `@types/node` → `^24.0.0`, `typescript` → `~5.9.0`, `eslint` → `^9.0.0`, `@typescript-eslint/*` → `^8.0.0`, añadir `engines.node >= 24.0.0`
- `packages/html-sanitize/package.json`: `typescript` → `~5.9.0`, `@types/node` → `^24.0.0`
- Dockerfiles (3): `FROM node:22` → `FROM node:24`, `FROM node:22-slim` → `FROM node:24-slim`
- `.nvmrc` (nuevo): `24`
- `apps/admin/vitest.config.ts` (nuevo): configuración mínima de vitest
- `apps/admin/playwright.config.ts` (nuevo): configuración de playwright
- ESLint configs: `.eslintrc.cjs` → `eslint.config.js` (flat config) en backend, web, admin
- `docs/project/stack.md`: Node 24, Angular 22, NestJS 11, ESLint 9
- `docs/deploy-standards.md`: Node 24

### Acceptance Criteria

#### SC-V01: Node 24 como runtime unificado
- Given que `package.json` raíz declara `engines.node >= 24.0.0`
- When un desarrollador ejecuta `node --version`
- Then debe tener Node 24.x instalado
- And `.nvmrc` existe con contenido `24`

#### SC-V02: Dockerfiles usan Node 24
- Given que los 3 Dockerfiles (backend, web, admin) usan `FROM node:24` / `FROM node:24-slim`
- When se ejecuta `docker build` para cualquier servicio
- Then la imagen se construye con Node 24

#### SC-V03: TypeScript unificado
- Given que todos los workspaces declaran `typescript ~5.9.0`
- When se ejecuta `npm run typecheck --workspaces`
- Then todos los workspaces compilan sin errores con el mismo compilador

#### SC-V04: @types/node consistente con Node 24
- Given que todos los workspaces declaran `@types/node ^24.0.0`
- When se ejecuta typecheck
- Then los tipos del runtime coinciden con Node 24

#### SC-V05: Vitest unificado en v4
- Given que root, web, admin y html-sanitize declaran `vitest ^4.1.10`
- When se ejecuta `npm run test --workspaces`
- Then todos los tests corren con vitest 4.x
- And `apps/admin/vitest.config.ts` existe

#### SC-V06: Playwright unificado
- Given que web y admin declaran `playwright ^1.52.0`
- When se ejecutan los tests e2e
- Then usan la misma versión del runner
- And `apps/admin/playwright.config.ts` existe

#### SC-V07: ESLint 9 con flat config
- Given que los 3 workspaces usan `eslint ^9.0.0` con `@typescript-eslint ^8.0.0`
- When se ejecuta `npm run lint --workspaces`
- Then linting pasa con la nueva configuración flat config
- And no existen `.eslintrc.cjs` (reemplazados por `eslint.config.js`)

#### SC-V08: NestJS 11 en backend
- Given que `apps/backend/package.json` declara `@nestjs/* ^11.2.0`
- When se ejecuta `npm run build --workspace=apps/backend`
- Then el backend compila y los tests pasan

#### SC-V09: Angular 22 en admin
- Given que `apps/admin/package.json` declara `@angular/* ^22.0.0` y `@ngrx/signals ^22.0.0`
- When se ejecuta `npm run build --workspace=apps/admin`
- Then el admin compila correctamente
- And `@ngrx/store` ya no está en dependencies

#### SC-V10: Lockfile limpio y reproducible
- Given que se ejecuta `rm -rf node_modules package-lock.json && npm install`
- When se resuelven todas las dependencias
- Then no hay conflictos de resolución
- And `npm ls` no muestra versiones duplicadas o incompatibles

#### SC-V11: Docs actualizados
- Given que `stack.md` y `deploy-standards.md` reflejan Node 24, Angular 22, NestJS 11
- When un nuevo desarrollador lee la documentación
- Then las versiones documentadas coinciden con el código

#### SC-V12: Scripts lint:fix preservados
- Given que los scripts `lint:fix` siguen existiendo en cada workspace
- When un desarrollador ejecuta `npm run lint:fix`
- Then ESLint corrige errores automáticamente (solo uso local, no en CI)

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| NestJS 11 breaking changes desde v10 | Revisar migration guide; `@nestjs/config` y `@nestjs/throttler` pueden necesitar bumps menores |
| Angular 18→22 migration (4 majors) | Ejecutar `ng update` incrementalmente; Angular CLI aplica schematics de migración automática |
| ESLint 8→9 flat config migration | Reemplazar `.eslintrc.cjs` por `eslint.config.js`; `@typescript-eslint v8` soporta flat config nativamente |
| vitest admin sin config | Crear `vitest.config.ts` mínimo; verificar que los 5 tests existentes pasan |
| playwright admin sin config | Crear `playwright.config.ts` básico; verificar `test:smoke` funciona |
| @ngrx/store eliminado | Verificar que ningún archivo importa `@ngrx/store`; migrar a `@ngrx/signals` si hay uso |
| Lockfile conflictos tras bumps masivos | Ejecutar `rm -rf node_modules package-lock.json && npm install` para regeneración limpia |
| Dockerfile context unchanged | El context sigue siendo la raíz del monorepo; solo cambia la tag de la imagen base |
| API endpoints / data model | No aplica — este cambio es solo tooling/infra, sin lógica de negocio |
| `specboot update` sobrescribe archivos | Verificar `bash check-refs.sh` y `bash specboot.sh --ci` tras cambios |

### Estimación

Complejidad: **M** (1–3 días)
Justificación: toca ~8 package.json, 3 Dockerfiles, 3+ configs de eslint, docs, crea configs faltantes, y elimina `@ngrx/store`. Sin lógica de negocio; el riesgo principal es la migración Angular 18→22 (4 majors) y ESLint 8→9.

### Riesgo

Nivel: **Medio**
Motivo:
- Angular 18→22 es una migración de 4 majors; puede requerir refactor de componentes si usan APIs deprecadas.
- ESLint 8→9 flat config es un cambio estructural en la configuración.
- NestJS 10→11 tiene breaking changes menores pero manejables.
- Se mitiga ejecutando tests después de cada grupo de upgrades.

### Dependencias

Tickets relacionados: **Q1** (ESLint 9 — se implementa en V1), **Q2** (NestJS 11 — se implementa en V1). **A1** (decisión stack admin — se resuelve parcialmente: se elimina `@ngrx/store` en V1, la decisión final de stack queda para A1 si es necesario).

### Alternativas descartadas

- Mantener NestJS 10: descartado — NestJS 10 acumula deuda; NestJS 11 es estable desde dic 2024.
- NestJS 12: descartado — recién salido (27 agosto 2026), demasiado fresco para migración de producción.
- Mantener ESLint 8: descartado — ESLint 8 está EOL; no recibe fixes de seguridad.
- Migrar backend de Jest a Vitest: descartado — scope creep; Jest funciona bien en backend.
- Angular 20 en vez de 22: descartado — Angular 20 LTS termina nov 2026; 22 es LTS activo hasta 2028.

### Technical Considerations

- **Angular 18→22**: ejecutar `ng update @angular/core@19` → `ng update @angular/core@20` → `ng update @angular/core@21` → `ng update @angular/core@22` secuencialmente. Cada paso aplica schematics de migración automática.
- **NestJS 10→11**: ejecutar `nest upgrade` o actualizar manualmente `@nestjs/*` a `^11.2.0`. Revisar migration guide para breaking changes en `@nestjs/config` y `@nestjs/throttler`.
- **ESLint 8→9**: migrar de `.eslintrc.cjs` a `eslint.config.js` (flat config). `@typescript-eslint v8` soporta flat config nativamente. Crear `eslint.config.js` por workspace.
- **vitest admin**: crear `vitest.config.ts` mínimo con `defineConfig({ test: { globals: true } })`.
- **playwright admin**: crear `playwright.config.ts` básico.
- **@ngrx/store**: buscar imports de `@ngrx/store` en `apps/admin/src` y eliminar; migrar a `@ngrx/signals` si hay uso activo.
- **Regenerar lockfile**: tras todos los bumps, `rm -rf node_modules package-lock.json && npm install`.
- **Verificar `bash check-refs.sh` y `bash specboot.sh --ci`** con 0 errores tras el cambio.
- **Dockerfiles**: solo cambia la tag base; el multi-stage build y el context se mantienen intactos.

### Definition of Done

- [ ] `package.json` raíz: `engines.node >= 24.0.0`, `@types/node ^24.0.0`, `vitest ^4.1.10`
- [ ] `.nvmrc` creado con `24`
- [ ] 3 Dockerfiles actualizados a `node:24` / `node:24-slim`
- [ ] `apps/backend/package.json`: NestJS 11.2, TS ~5.9, @types/node ^24, ESLint 9, engines.node
- [ ] `apps/web/package.json`: @types/node ^24, vitest ^4.1.10, playwright ^1.52.0
- [ ] `apps/admin/package.json`: Angular 22, @ngrx/signals ^22, **@ngrx/store eliminado**, vitest ^4.1.10, ESLint 9, @types/node ^24, engines.node
- [ ] `packages/html-sanitize/package.json`: TS ~5.9, @types/node ^24
- [ ] `apps/admin/vitest.config.ts` creado
- [ ] `apps/admin/playwright.config.ts` creado
- [ ] ESLint configs migrados: `.eslintrc.cjs` → `eslint.config.js` en backend, web, admin
- [ ] `npm run lint --workspaces` pasa
- [ ] `npm run typecheck --workspaces` pasa
- [ ] `npm run build --workspaces` pasa
- [ ] `npm run test --workspaces` pasa
- [ ] `bash check-refs.sh` y `bash specboot.sh --ci` pasan con 0 errores
- [ ] `docs/project/stack.md` actualizado (Node 24, Angular 22, NestJS 11, ESLint 9)
- [ ] `docs/deploy-standards.md` actualizado (Node 24)
- [ ] OpenSpec: change `align-versions`, tasks.md, verify PASS
