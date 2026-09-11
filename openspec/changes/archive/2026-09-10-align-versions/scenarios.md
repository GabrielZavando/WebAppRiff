# Scenarios — align-versions

### SC-V01: Node 24 como runtime unificado

- Given que `package.json` raíz declara `engines.node >= 24.0.0`
- When un desarrollador ejecuta `node --version`
- Then debe tener Node 24.x instalado
- And `.nvmrc` existe con contenido `24`

### SC-V02: Dockerfiles usan Node 24

- Given que los 3 Dockerfiles (backend, web, admin) usan `FROM node:24` / `FROM node:24-slim`
- When se ejecuta `docker build` para cualquier servicio
- Then la imagen se construye con Node 24

### SC-V03: TypeScript unificado

- Given que todos los workspaces declaran `typescript ~5.9.0`
- When se ejecuta `npm run typecheck --workspaces`
- Then todos los workspaces compilan sin errores con el mismo compilador

### SC-V04: @types/node consistente con Node 24

- Given que todos los workspaces declaran `@types/node ^24.0.0`
- When se ejecuta typecheck
- Then los tipos del runtime coinciden con Node 24

### SC-V05: Vitest unificado en v4

- Given que root, web, admin y html-sanitize declaran `vitest ^4.1.10`
- When se ejecuta `npm run test --workspaces`
- Then todos los tests corren con vitest 4.x
- And `apps/admin/vitest.config.ts` existe

### SC-V06: Playwright unificado

- Given que web y admin declaran `playwright ^1.52.0`
- When se ejecutan los tests e2e
- Then usan la misma versión del runner
- And `apps/admin/playwright.config.ts` existe

### SC-V07: ESLint 9 con flat config

- Given que los 3 workspaces usan `eslint ^9.0.0` con `@typescript-eslint ^8.0.0`
- When se ejecuta `npm run lint --workspaces`
- Then linting pasa con la nueva configuración flat config
- And no existen `.eslintrc.cjs` (reemplazados por `eslint.config.js`)

### SC-V08: NestJS 11 en backend

- Given que `apps/backend/package.json` declara `@nestjs/* ^11.2.0`
- When se ejecuta `npm run build --workspace=apps/backend`
- Then el backend compila y los tests pasan

### SC-V09: Angular 22 en admin

- Given que `apps/admin/package.json` declara `@angular/* ^22.0.0` y `@ngrx/signals ^22.0.0`
- When se ejecuta `npm run build --workspace=apps/admin`
- Then el admin compila correctamente
- And `@ngrx/store` ya no está en dependencies

### SC-V10: Lockfile limpio y reproducible

- Given que se ejecuta `rm -rf node_modules package-lock.json && npm install`
- When se resuelven todas las dependencias
- Then no hay conflictos de resolución
- And `npm ls` no muestra versiones duplicadas o incompatibles

### SC-V11: Docs actualizados

- Given que `stack.md` y `deploy-standards.md` reflejan Node 24, Angular 22, NestJS 11
- When un nuevo desarrollador lee la documentación
- Then las versiones documentadas coinciden con el código

### SC-V12: Scripts lint:fix preservados

- Given que los scripts `lint:fix` siguen existiendo en cada workspace
- When un desarrollador ejecuta `npm run lint:fix`
- Then ESLint corrige errores automáticamente (solo uso local, no en CI)
