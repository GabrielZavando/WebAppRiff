# Tasks — ui-chrome-polish

> Change: `ui-chrome-polish` — Ticket `UI-FIX1` — Tag `[frontend]` — Branch `feature/ui-fix1-ui-chrome-polish`
> Service root (`.specboot.json`): `.` (repo root) — paths below are relative to the repo root.
> Nota: la edición manual del header (`lg:pb-4`) quedó en `git stash` (stash@{0}) antes de crear la rama; este change la re-aplica vía TDD (tareas 1.1-1.2). Dropear el stash al final del ciclo, tras `/verify` en verde.

## 1. Header `pb-10 lg:pb-4` formalizado (Req 1 — SC-001)

- [x] 1.1 RED — `Header.test.ts`: la assertion (~línea 295) espera `lg:pb-12` en `<header class="site-header">`; actualizarla al nuevo contrato (`pb-10` y `lg:pb-4`) y verificar que `lg:pb-12` NO aparece. El componente aún porta `pb-10 lg:pb-12` (la edición manual quedó en stash), así que el test debe FALLAR (RED propio); el mismatch de snapshot se resuelve en el GREEN (1.2).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/Header.test.ts
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts (+ __snapshots__/Header.test.ts.snap)
  - **Subtasks**: assertion `pb-10` + `lg:pb-4`; verificar que `lg:pb-12` ya no aparece; snapshot regenerado.

- [x] 1.2 GREEN — `Header.astro`: cambiar la clase `'pb-10 lg:pb-12'` → `'pb-10 lg:pb-4'` (línea 32) y actualizar el comentario interno (líneas 22–26): nueva rationale (`pb-10 lg:pb-4` por decisión del cliente — "así se ve mejor"; overflow leve del logo 2× en desktop aceptado; móvil `pb-10` sigue conteniendo el logo ~81px). Regenerar el snapshot `Header.test.ts.snap` y verificar el test en verde.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/Header.astro
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

## 2. Buscador: fondo uniforme transparente | secondary (Req 2-3 — SC-002, SC-003, SC-004)

- [x] 2.1 RED — `SearchForm.test.ts`: actualizar los tests de variantes — default (no hero) renderiza `bg-secondary` sólido (hoy `bg-white border-b border-border` → falla); hero renderiza `bg-transparent` (verde actual); ningún wrapper lleva el gradiente `bg-linear-to-r from-secondary to-secondary-light` ni `border-b border-border`; snapshot por defecto actualizado.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/__tests__/SearchForm.test.ts
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts (+ __snapshots__/SearchForm.test.ts.snap)

- [x] 2.2 GREEN — `SearchForm.astro`: class:list del wrapper → `transparent ? 'bg-transparent' : 'bg-secondary'`; eliminar el prop `secondaryBg` de `Props` y su rama; eliminar `border-b border-border`.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/SearchForm.astro
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts

- [x] 2.3 GREEN — Eliminar el plumbing muerto: `Layout.astro` (Props `searchSecondary` + passthrough), `lib/types/search-form.ts` (`secondaryBg`), páginas `productos/index.astro` y `productos/[slug].astro` (quitar `searchSecondary`).
  - **Priority**: P1 | **Layer**: n/a (types/config) | **Estimate**: S
  - **Suggested Path**: apps/web/src/layouts/Layout.astro (+ apps/web/src/lib/types/search-form.ts, apps/web/src/pages/productos/index.astro, apps/web/src/pages/productos/[slug].astro)
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts (+ apps/web/src/layouts/__tests__/Layout.test.ts si aserta el passthrough)

- [x] 2.4 Sanity — `header-scroll.css` SIN cambios: la regla `body[data-scrolled='true'] .site-search { background-color: var(--color-secondary) }` y `prefers-reduced-motion` se mantienen (SC-004); verificar tests de scroll en verde.
  - **Priority**: P2 | **Layer**: n/a | **Estimate**: XS
  - **Suggested Path**: no aplica (verificación only — header-scroll.css NO se edita)
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts

## 3. PanelHome: elevación desktop (Req 4 — SC-005)

- [x] 3.1 RED — `PanelHome.test.ts`: actualizar el assert/snapshot del `<section>`: lleva `-mt-2` uniforme y NO lleva `lg:mt-2` positivo (hoy el snapshot tiene `-mt-2 md:-mt-2 lg:mt-2` → falla).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/PanelHome.test.ts
  - **Test Path**: apps/web/src/components/__tests__/PanelHome.test.ts (+ __snapshots__/PanelHome.test.ts.snap)

- [x] 3.2 GREEN — `PanelHome.astro`: clases del `<section>` de `relative -mt-2 md:-mt-2 lg:mt-2 z-10` a `relative -mt-2 z-10` (desktop +8px → −8px = 16px más arriba; móvil/tablet intactos; `z-10` preservado). Actualizar snapshot.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/PanelHome.astro
  - **Test Path**: apps/web/src/components/__tests__/PanelHome.test.ts

## 4. Enlace "Nosotros" en el menú (Req 5 — SC-006)

- [x] 4.1 RED — Test de navegación: `NAVIGATION_ITEMS` incluye `{ label: 'Nosotros', href: '/nosotros' }` (hoy ausente → falla); la nav desktop y el menú móvil renderizan 6 ítems.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/lib/config/navigation.ts
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

- [x] 4.2 GREEN — `navigation.ts`: añadir `{ label: 'Nosotros', href: '/nosotros' }` tras "Inicio" (supuesto documentado: orden Inicio → Nosotros → Productos → Servicios → Marcas → Contacto; ajustable en review visual). `isActive('/nosotros', …)` ya soporta el href; ambas navs del Header renderizan desde la misma lista.
  - **Priority**: P1 | **Layer**: n/a (config) | **Estimate**: XS
  - **Suggested Path**: apps/web/src/lib/config/navigation.ts
  - **Test Path**: apps/web/src/components/__tests__/Header.test.ts

## 5. Botón flotante de WhatsApp (Req 6-7 — SC-007, SC-008)

- [x] 5.1 RED — Nuevo `WhatsAppButton.test.ts` (AstroContainer, patrón de los tests de componentes existentes): renderiza un `<a>` fijo (`fixed bottom-6 right-6 z-30`) con `href="https://wa.me/56937526162"`, `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="Contactar por WhatsApp"`, un único icono con `aria-hidden` y sin etiqueta de texto con el número. (El componente no existe → RED propio.)
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

- [x] 5.2 GREEN — Crear `WhatsAppButton.astro`: `<a>` fijo abajo-derecha (`fixed bottom-6 right-6 z-30` — bajo el overlay del menú móvil z-40 y el toggle z-50), `href="https://wa.me/56937526162"` (+56 9 3752 6162 → solo dígitos con código de país), `target="_blank"` + `rel="noopener noreferrer"`, icono `<Icon name="simple-icons:whatsapp" />` con `aria-hidden`, colores vía tokens (`bg-whatsapp` / `hover:bg-whatsapp-dark`), sin hex crudo.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/WhatsAppButton.astro
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

- [x] 5.3 Tokens + paridad — Añadir `--color-whatsapp: #25D366` y `--color-whatsapp-dark: #1EBE5D` a `apps/web/src/styles/globals.css` Y a `apps/admin/src/styles/globals.css` (mismos nombres y valores — el sync test rompe si solo se edita uno).
  - **Priority**: P1 | **Layer**: n/a (styles) | **Estimate**: XS
  - **Suggested Path**: apps/web/src/styles/globals.css (+ apps/admin/src/styles/globals.css)
  - **Test Path**: apps/admin/src/styles/__tests__/sync.test.ts

- [x] 5.4 Wire en `Layout.astro` — Importar y renderizar `<WhatsAppButton />` dentro del wrapper `div.w-full`, tras `<SiteCredits />`: aparece en todas las páginas (incl. 404) y sobrevive View Transitions (markup del layout).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/layouts/Layout.astro
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts (+ apps/web/src/layouts/__tests__/Layout.test.ts)

- [x] 5.5 Docs — Actualizar `docs/design/style-guide/README.md`: el catálogo de iconos documenta la segunda excepción (`simple-icons:whatsapp` — Lucide no provee la marca; precedente: `simple-icons:x`) y la tabla de tokens añade `--color-whatsapp` / `--color-whatsapp-dark`.
  - **Priority**: P2 | **Layer**: n/a (docs) | **Estimate**: XS
  - **Suggested Path**: docs/design/style-guide/README.md
  - **Test Path**: no aplica (docs)

## 6. Suite + gates (post-implementación)

- [x] 6.1 Suite completa `apps/web` (Vitest + snapshots) + `npm run lint` + `npm run typecheck`; también el sync test de tokens de `apps/admin`. Fix cualquier regresión.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: apps/web (suite completa) + apps/admin/src/styles/__tests__/sync.test.ts

- [x] 6.2 Ejecutar `verify` (evidencia en `openspec/state/verify-results.json`) y `adversarial-review` (veredicto en `openspec/state/adversarial-result.json`) para el change activo.
  - **Priority**: P1 | **Layer**: n/a | **Estimate**: M
  - **Suggested Path**: no aplica
  - **Test Path**: no aplica
  - **Nota**: gates ejecutados y re-ejecutados tras el fix z-index — verify `PASS` (2026-10-04T15:05:17Z), adversarial `SHIP` (confianza 0.85, 2026-10-04).

## 7. Cierre de brechas de evidencia (verify PARTIAL — SC-002/SC-004)

> Hallazgos de `/verify` (2026-10-04): SC-002 tenía evidencia débil (SC-002 solo en
> comentarios de SearchForm.test.ts) y SC-004 no tenía test con referencia. Se
> cierran con un rename y un test nuevo, luego se re-ejecuta `/verify` para
> emitir PASS.

- [x] 7.1 Rename — `SearchForm.test.ts`: el describe `'SearchForm — transparent mode (home hero full-bleed background)'` pasa a `'SearchForm — transparent mode (home hero full-bleed background, SC-002)'` para que el nombre de los tests del modo transparente contenga el ID (evidencia fuerte, convención 5c del skill verify). Sin cambio de comportamiento: los tests siguen pasando.
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/__tests__/SearchForm.test.ts
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts

- [x] 7.2 GREEN — Nuevo test `(SC-004)` en `SearchForm.test.ts`: guard de contrato que lee `apps/web/src/styles/header-scroll.css` y aserta la regla de scroll compacto del buscador intacta — contiene `body[data-scrolled='true'] .site-search` con `background-color: var(--color-secondary)`, la transición `300ms` y el bloque `prefers-reduced-motion` con `.site-search` y `transition: none`. (El archivo CSS NO se modifica; el test lo protege como regresión. No aplica RED: el contrato ya existe — es un guard, no TDD de comportamiento nuevo.)
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: S
  - **Suggested Path**: apps/web/src/components/__tests__/SearchForm.test.ts
  - **Test Path**: apps/web/src/components/__tests__/SearchForm.test.ts

## 8. Fix post-adversarial: z-index del FAB a z-20 (WARNING de SHIP)

> Hallazgo WARNING de `/adversarial-review` (2026-10-04, veredicto SHIP): el FAB
> `z-30` pintaba por encima del menú móvil abierto — el overlay `z-40` queda
> atrapado en el stacking context `z-30` del sticky shell (`position: sticky` +
> z-index), y el FAB, hermano posterior, ganaba. Se baja a `z-20`: sobre el
> contenido (≤ z-10) y bajo el grupo sticky (z-30) y su overlay del menú móvil.
> Así SC-007 ("bajo el overlay") se cumple en comportamiento, no solo en clases.

- [x] 8.1 GREEN — `WhatsAppButton.astro`: `fixed bottom-6 right-6 z-30` → `z-20` (clase del `<a>` + comentario interno SC-007).
  - **Priority**: P1 | **Layer**: dumb | **Estimate**: XS
  - **Suggested Path**: apps/web/src/components/WhatsAppButton.astro
  - **Test Path**: apps/web/src/components/__tests__/WhatsAppButton.test.ts

- [x] 8.2 GREEN — `WhatsAppButton.test.ts`: actualizar el nombre del test y la aserción de `z-30` → `z-20`.
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
