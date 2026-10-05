# Tasks — ui-chrome-uniform

> Change: `ui-chrome-uniform` — Ticket `UI-02` — Tag `[frontend]` — Branch `feature/ui-02-ui-chrome-uniform`
> Service root (`.specboot.json`): `.` (repo root) — paths below are relative to the repo root.
> Nota: las env vars `PRIMARY_PHONE`/`SOCIAL_*_URL` dejan de leerse en código pero NO se eliminan de
> `.env.example`/`env.d.ts`/`playwright.config`/`deploy-standards` — la limpieza queda a criterio del usuario.

## 1. Chrome uniforme (Req 1 — SC-001, SC-002)

- [x] 1.1 RED — `Header.test.ts`: el assert del estado no-transparente espera `bg-secondary` sólido y NO `bg-linear-to-r from-secondary to-secondary-light` ni `from-secondary`/`to-secondary-light` (hoy el componente usa el gradiente → RED).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/Header.test.ts
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts (+ __snapshots__/Header.test.ts.snap)

- [x] 1.2 GREEN — `Header.astro` (línea ~33): `'bg-linear-to-r from-secondary to-secondary-light'` → `'bg-secondary'`; actualizar comentarios internos y el snapshot.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/Header.astro
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

- [x] 1.3 RED — `TopHeader.test.ts`: assert del estado no-transparente espera `bg-secondary` sólido y NO `from-secondary`/`to-secondary-light` (hoy usa `bg-secondary bg-linear-to-r from-secondary to-secondary-light` → RED).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/TopHeader.test.ts
  - **Test Path**: apps/web/src/components/__tests__/TopHeader.test.ts (+ snapshot si aplica)

- [x] 1.4 GREEN — `TopHeader.astro` (línea ~34): `'bg-secondary bg-linear-to-r from-secondary to-secondary-light'` → `'bg-secondary'`; actualizar comentarios internos y snapshot.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/TopHeader.astro
  - **Test Path**: apps/web/src/components/__tests__/TopHeader.test.ts

## 2. Contacto en configuración (Req 2 — SC-003)

- [x] 2.1 RED — `contact.test.ts`: reescribir los asserts — `getContactInfo()` devuelve las constantes (`phone` `+56 2 29079067`, `whatsapp` `+56 9 3752 6162`, `social.facebook` `https://www.facebook.com/somosriff`, `social.x` `''`, `social.instagram` `https://www.instagram.com/somosriff.cl/`, `social.linkedin` `https://www.linkedin.com/company/somosriff/`) y NO depende de `import.meta.env` (los asserts actuales setean env → fallan contra la implementación actual).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/config/__tests__/contact.test.ts
  - **Test Path**: apps/web/src/lib/config/__tests__/contact.test.ts

- [x] 2.2 GREEN — `lib/config/contact.ts`: constantes tipadas (`PHONE`, `WHATSAPP_NUMBER`, `SOCIAL_FACEBOOK`, `SOCIAL_INSTAGRAM`, `SOCIAL_LINKEDIN`; X vacío); `getContactInfo()` devuelve las constantes (sin `import.meta.env`).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/lib/config/contact.ts
  - **Test Path**: apps/web/src/lib/config/__tests__/contact.test.ts

- [x] 2.3 GREEN — `lib/types/top-header.ts`: `ContactInfo` + campo `whatsapp: string`.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/lib/types/top-header.ts
  - **Test Path**: apps/web/src/lib/config/__tests__/contact.test.ts

- [x] 2.4 GREEN — Alinear fixtures de `ContactInfo`: añadir `whatsapp` a los literales de test que lo omiten (`contact.test.ts` getSocialLinks fixtures, `TopHeader.test.ts` líneas ~6/47/70/89/202) — resuelve los 8 errores de typecheck detectados tras 2.3.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/lib/config/__tests__/contact.test.ts (+ apps/web/src/components/__tests__/TopHeader.test.ts)
  - **Test Path**: apps/web/src/lib/config/__tests__/contact.test.ts

## 3. WhatsApp desde configuración (Req 3 — SC-004)

- [x] 3.1 RED — `WhatsAppButton.test.ts`: renderiza con prop `phone` → el `<a>` enlaza a `https://wa.me/56937526162` (dígitos de `+56 9 3752 6162`); el número no aparece hardcodeado en el componente (el test actual asume el número fijo en el markup → se actualiza a la prop).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

- [x] 3.2 GREEN — `WhatsAppButton.astro`: `interface Props { phone: string }` → `href={`https://wa.me/${phone.replace(/\D/g, '')}`}`; eliminar el número hardcodeado y el comentario que lo cita.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/WhatsAppButton.astro
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

- [x] 3.3 GREEN — `Layout.astro`: `<WhatsAppButton phone={contact.whatsapp} />` (ya importa `getContactInfo()`); verificar `Layout.test.ts` (aserta el href del wa.me).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/layouts/Layout.astro
  - **Test Path**: apps/web/src/layouts/__tests__/Layout.test.ts

## 4. Barra de contacto con URLs nuevas (Req 4 — SC-005)

- [x] 4.1 RED — Actualizar asserts de URLs en `TopHeader.test.ts`, `Footer.test.ts`, `ContactBar.test.ts`, `contacto.test.ts` y `e2e/top-header.spec.ts` a las nuevas (`https://www.facebook.com/somosriff`, `https://www.instagram.com/somosriff.cl/`, `https://www.linkedin.com/company/somosriff/`; X ausente) — fallan contra las URLs viejas (implementación actual / snapshots).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/__tests__/TopHeader.test.ts (+ Footer.test.ts, ContactBar.test.ts, apps/web/src/pages/__tests__/contacto.test.ts, apps/web/e2e/top-header.spec.ts)
  - **Test Path**: apps/web/src/components/__tests__/TopHeader.test.ts

- [x] 4.2 GREEN — Verificación: con `contact.ts` actualizado (2.2) los tests pasan; ejecutar TopHeader/Footer/e2e relacionados. (Sin código nuevo — la fuente de las URLs es la config.)
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: S
  - **Suggested Path**: no aplica (verificación only)
  - **Test Path**: apps/web/src/components/__tests__/TopHeader.test.ts (+ apps/web/src/components/__tests__/Footer.test.ts)

## 5. CSP de fuentes (Req 5 — SC-006)

- [x] 5.1 RED — Nuevo test `apps/web/src/styles/__tests__/csp-nginx.test.ts`: lee `apps/web/nginx.conf` y `apps/admin/nginx.conf` y aserta que cada location con `Content-Security-Policy` incluye `font-src 'self' https: data:` (hoy sin `data:` → RED).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/styles/__tests__/csp-nginx.test.ts
  - **Test Path**: apps/web/src/styles/__tests__/csp-nginx.test.ts

- [x] 5.2 GREEN — `apps/web/nginx.conf` y `apps/admin/nginx.conf`: `font-src 'self' https:` → `font-src 'self' https: data:` (3 locations por archivo).
  - **Priority**: P1 | **Layer**: n/a (config) | **Estimate**: XS
  - **Suggested Path**: apps/web/nginx.conf (+ apps/admin/nginx.conf)
  - **Test Path**: apps/web/src/styles/__tests__/csp-nginx.test.ts

## 6. Suite + gates (post-implementación)

- [x] 6.1 Suite completa `apps/web` (Vitest + snapshots) + `npm run lint` + `npm run typecheck`; también el sync test de tokens de `apps/admin`. Fix cualquier regresión.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: apps/web (suite completa) + apps/admin/src/styles/__tests__/sync.test.ts

- [x] 6.2 Ejecutar `verify` (evidencia en `openspec/state/verify-results.json`) y `adversarial-review` (veredicto en `openspec/state/adversarial-result.json`) para el change activo.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: no aplica
  - **Nota**: verify `PASS` (2026-10-04T23:53:55Z, 6/6 escenarios tras cerrar brechas SC-002/SC-004) · adversarial `SHIP` (confianza 0.85, 2026-10-04).

## 7. Cierre de brechas de evidencia (verify PARTIAL — SC-002/SC-004)

> Hallazgos de `/verify` (2026-10-04): SC-002 y SC-004 tenían evidencia débil
> (IDs solo en comentarios de `TopHeader.test.ts` y `WhatsAppButton.test.ts`,
> no en nombres de tests — convención 5c del skill verify). Se cierran con
> renames de tests; luego se re-ejecuta `/verify` para emitir PASS.

- [x] 7.1 Rename — `TopHeader.test.ts`: el test del fondo no-transparente (hoy `'applies brand navy background, compact h-8 height and full layout styling'` o el de default solid) pasa a llevar `(SC-002)` en su nombre (p. ej. `'applies the solid bg-secondary background (SC-002)'`). Sin cambio de comportamiento.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/TopHeader.test.ts
  - **Test Path**: apps/web/src/components/__tests__/TopHeader.test.ts

- [x] 7.2 Rename — `WhatsAppButton.test.ts`: el test que deriva el `wa.me` desde la prop `phone` (hoy `'derives the wa.me href from the phone prop digits (no spaces, +, or parentheses)'`) pasa a llevar `(SC-004)` en su nombre. Sin cambio de comportamiento.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

## Mandatory Steps

> Checklist obligatoria del ciclo SDD (fuente única de verdad:
> `docs/openspec-tasks-mandatory-steps.md`, inyectada por `plan-change` al
> generar este `tasks.md`). Obligatoria, no sugerida.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.