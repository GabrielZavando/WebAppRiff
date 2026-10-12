# Verificación — admin-panel-foundation (tasks 7.1–7.4)

## 7.1 Lint + typecheck + tests — ✅ ejecutado

- `npm run lint --workspace=apps/admin` — 0 errores.
- `npm run typecheck --workspace=apps/admin` (ng build development) — OK.
- `npm test --workspace=apps/admin` — **96/96 tests, 19 archivos** (incluye
  tests de paridad de tokens `sync.test.ts`, config `globals-css/angular-config/
  package/main.test.ts` y todos los tests nuevos de este change).
- `npm test --workspace=apps/backend` — **530/530** (regresión OK; el backend
  no cambió).

## 7.2 Builds — ✅ ejecutado

- `npm run build --workspace=apps/admin` (producción, con
  `environment.production.ts` generado por `scripts/write-env.mjs`) — OK, sin
  warnings.
- `npm run build --workspace=apps/backend` — OK.

Extra (smoke E2E con Chromium): `npm run test:smoke` — **3/3**:
- SC-001 render de la tarjeta de login.
- SC-006 redirect raíz `/ → /login?returnUrl=%2Fprofile` (actualizado al
  comportamiento del change: el delta `admin-login` MODIFIED cambió el destino
  raíz a `/profile`).
- SC-009 sin overflow horizontal a 375px y 1440px.
- Boot verificado en navegador headless: 0 errores de consola (el default de
  desarrollo usa `apiKey: 'dev-placeholder-api-key'`; con apiKey vacía
  `getAuth()` lanza `auth/invalid-api-key` y tumba el bootstrap).

## 7.3 OpenSpec — ✅ ejecutado

- `npx openspec validate --all --strict` — **73 passed, 0 failed**.

## 7.4 Verificación manual — ⏳ pendiente de ejecución con credenciales reales

**Hallazgo de la pasada manual parcial (2026-10-11, bug 1):** el
fileReplacement de development estaba en cascada
(`environment.ts → environment.development.ts → …-local.ts`), que Angular no
aplica: el bundle usaba placeholders aunque existieran credenciales reales
(evidencia directa: `key=dev-placeholder-api-key` en identitytoolkit con
sentinel en el archivo local). Fix: reemplazo de UN solo nivel
(`environment.ts → …-local.ts`), `environment.development.ts` renombrado a
`environment.development.example.ts` (documentación), regresión cubierta por
`dev-file-replacement.test.ts` y el smoke E2E `[bug-1]` (la `key=` de
identitytoolkit debe coincidir con el archivo local; verificado que FALLA
bajo cascada y PASA con el fix). Detalle en design D3 y README.

> **Ojo al re-ejecutar el smoke E2E**: Playwright reutiliza un dev server ya
> activo en :4200 (`reuseExistingServer`). Si quedó un `ng serve` viejo
> (p. ej. tras un run interrumpido), los tests corren contra un bundle
> desactualizado y pueden dar falsos positivos — matar el proceso o verificar
> `ss -tlnp | grep 4200` antes de concluir.

Las pruebas automatizadas cubren la lógica con mocks de Firebase/HTTP, pero el
checklist requiere credenciales reales. Pasos para ejecutarlo:

1. Levantar el backend (`npm run start:dev --workspace=apps/backend`) y crear un
   usuario de prueba (`npm run bootstrap:superadmin`).
2. Rellenar `apps/admin/src/environments/environment.development.ts` con las
   credenciales del proyecto Firebase de desarrollo (o generar
   `environment.production.ts` vía `npm run env:write`).
3. `npm start --workspace=apps/admin` y recorrer:

| # | Verificación | Cubierto por automatización |
| --- | --- | --- |
| 1 | Login válido → `/profile` | Parcial: `auth.service.test` (login+redirect), interceptor Bearer; falta flujo real |
| 2 | Login inválido → mensaje de error visible | Parcial: `login-page.component.test` (mensaje + botón); falta error real de Firebase |
| 3 | `/profile` sin sesión → `/login` con `returnUrl` | Sí: `auth.guard.test` + smoke SC-006 (E2E real) |
| 4 | Recargar con sesión activa mantiene la sesión | **Bug encontrado y corregido** (la fila original era la afectada): el guard decidía antes de que el SDK restaurara la sesión asíncrona → F5 expulsaba a `/login`. Fix: el guard espera `AuthService.ready` (design D5). Cobertura automatizada añadida: unit del ciclo `ready` + guard "aún inicializando" + E2E `[session-restore]` (persistir → recargar → restaurar). **Pendiente: re-verificación manual con credenciales reales tras el fix.** |
| 5 | Logout → `/login` | Sí (unit) + `app-header.component.test`; falta flujo real |
| 6 | Sidebar colapsa/expande y persiste | Sí: `app-header.component.test` (service) + colapso vía SidebarService |
| 7 | 404 con vuelta al panel | Sí: `not-found.component.test` (render + navegación) |
| 8 | Peticiones al backend llevan `Authorization: Bearer` | Sí: `auth.interceptor.test` (header + 401 → logout+redirect) |

Resultado de la pasada manual: ____________________ (fecha / ejecutor / hallazgos).
