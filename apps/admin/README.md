# Riff Admin Panel

Panel de administración (Angular 22 + Tailwind CSS v4 + Firebase Auth).

## Puesta en marcha (desarrollo)

```bash
npm install                      # en la raíz del monorepo
npm run env:write:dev --workspace=apps/admin   # opcional: credenciales reales
npm start --workspace=apps/admin
```

- Backend: corre en `:3000` (`apps/backend`, `resolvePort` default). El admin
  apunta a `http://localhost:3000/api/v1` por defecto.
- Firebase: las credenciales del proyecto de desarrollo se inyectan con
  variables de entorno, nunca se commitean.

## Credenciales Firebase en desarrollo

> **IMPORTANTE**: el fileReplacement de development es de **UN SOLO nivel**
> (`environment.ts → environment.development.local.ts`). **NO añadir
> cascadas** porque Angular no las aplica de forma fiable (solo los
> reemplazos contra el archivo original `environment.ts` surten efecto; una
> cascada deja el bundle con los placeholders silenciosamente). Si necesitas
> más entornos, usa un archivo por entorno con un solo salto.
> (`src/environments/__tests__/dev-file-replacement.test.ts` y el smoke E2E
> `[bug-1]` protegen esta regla.)

`environment.development.example.ts` está **commiteado con placeholders** y el
build de desarrollo reemplaza `environment.ts` por
`src/environments/environment.development.local.ts` (**gitignoreado**):

```bash
FIREBASE_API_KEY=... FIREBASE_AUTH_DOMAIN=... \
FIREBASE_PROJECT_ID=... FIREBASE_APP_ID=... \
API_BASE_URL=http://localhost:3000/api/v1 \
npm run env:write:dev --workspace=apps/admin
```

Reglas:

- `postinstall` / `prestart` / `pretypecheck` ejecutan el generador con
  `--if-missing`: si falta el archivo local lo crean con los placeholders
  seguros (el build nunca se rompe en un clon limpio); si ya existe, **no lo
  sobreescriben** (tus credenciales reales no se pierden).
- `env:write:dev` (sin `--if-missing`) sobreescribe siempre: úsalo para
  actualizar tus valores.
- Ejecuta siempre los builds vía `npm run …` (los hooks garantizan que el
  archivo local exista); un `npx ng serve` directo puede fallar en un clon
  limpio que aún no haya corrido `npm install`.
- `environment.development.example.ts` documenta los placeholders del
  bootstrap y debe mantenerse en sincronía con `DEV_PLACEHOLDERS` de
  `scripts/write-env.mjs` (hay un test que lo verifica).

## Producción

El pipeline genera `src/environments/environment.production.ts`
(gitignoreado) desde variables de entorno:

```bash
FIREBASE_API_KEY=... FIREBASE_AUTH_DOMAIN=... FIREBASE_PROJECT_ID=... \
FIREBASE_APP_ID=... API_BASE_URL=https://<backend>/api/v1 \
npm run env:write --workspace=apps/admin
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Dev server (`ng serve`, config development) |
| `npm run typecheck` | `ng build --configuration development` |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:smoke` | Smoke E2E (Playwright, requiere build dev) |
| `npm run build` | Build de producción |
| `npm run env:write` | Genera `environment.production.ts` (target por defecto) |
| `npm run env:write:dev` | Genera `environment.development.local.ts` |

Más contexto del cambio: `openspec/changes/admin-panel-foundation/`.
