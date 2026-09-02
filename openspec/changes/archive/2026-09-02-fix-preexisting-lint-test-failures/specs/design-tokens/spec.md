# design-tokens — Delta Spec

## ADDED Requirements

### Requirement: Sombra específica de componente — scroll shell

El bloque `@theme {}` SHALL declarar el token `--shadow-scroll-shell` con valor `0 10px 30px rgba(22, 32, 46, 0.3)` en **ambos** `globals.css` (`apps/web/src/styles/globals.css` y `apps/admin/src/styles/globals.css`). Es una sombra de elevación específica del header/scroll-shell y de `PanelHome` (no una de las 5 sombras de capas flotantes `shadow-1..5`), y por tanto SHALL mantenerse sincronizada entre web y admin.

#### Scenario: Token presente en web
- **WHEN** se parsea el bloque `@theme {}` de `apps/web/src/styles/globals.css`
- **THEN** contiene `--shadow-scroll-shell: 0 10px 30px rgba(22, 32, 46, 0.3)`

#### Scenario: Token presente en admin
- **WHEN** se parsea el bloque `@theme {}` de `apps/admin/src/styles/globals.css`
- **THEN** contiene `--shadow-scroll-shell: 0 10px 30px rgba(22, 32, 46, 0.3)`

#### Scenario: Paridad web ↔ admin (sync test)
- **WHEN** se ejecuta el test de sincronización de tokens (`apps/admin/src/styles/__tests__/sync.test.ts`)
- **THEN** reporta paridad exacta de tokens entre web y admin (incluido `--shadow-scroll-shell`)
- **AND** el test pasa
