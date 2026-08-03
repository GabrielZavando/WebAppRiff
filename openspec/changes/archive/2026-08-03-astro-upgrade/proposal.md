## Why

El sitio público `apps/web/` está en Astro `^4.0.0`, **tres versiones major** atrás de la versión objetivo `7.1.6`. Astro 7 trae el compilador Rust (builds 15–61% más rápidos), queued rendering (~2.4× más rápido) y estabiliza features experimentales — todo alineado con `docs/frontend-standards.md` que exige un sitio Astro SSG performante. Aprovechar este update para cumplir el mismo estándar que declara **"Tailwind CSS v4"** como stack objetivo del proyecto: hoy el repo usa Tailwind v3 vía `@astrojs/tailwind`, integración **deprecated desde Astro 5+**, lo que tech-debt que crecería con cada releases. Migrar ahora minimiza el costo y bloquea futuros updates antes de que el sitio crezca.

## What Changes

- **BREAKING** (paquete, no API): Bump `astro` de `^4.0.0` → `7.1.6` **pinneado exacto** en `apps/web/package.json` (sin caret)
- **BREAKING** (tooling): Bump `@astrojs/check` a versión compatible con Astro 7; bump `eslint-plugin-astro` a compatible; bump `@typescript-eslint/*` a `^8.x`; bump `typescript` a `^5.5+`
- **BREAKING** (test runner): Bump `vitest` de `^1.0.0` → `^2.x`+ (Vite 8 rompe compat con vitest 1.x)
- **BREAKING** (e2e): Bump `playwright` de `^1.40.0` → `^1.50+`
- **BREAKING** (Node): Subir `engines.node` de `>=20.19.0` → `>=22.12.0` en `package.json` raíz y `apps/web/package.json` (alinea con Vite 8 + Rust compiler toolchain)
- **REMOVE** `@astrojs/tailwind` (deprecado desde Astro 5+)
- **REMOVE** `apps/web/tailwind.config.mjs` (migración a configuración CSS-first)
- **ADD** `tailwindcss@^4` como dependencia directa
- **ADD** `@tailwindcss/vite@^4` como plugin Vite (reemplaza a `@astrojs/tailwind`)
- **MIGRATE** `brand-navy`, `brand-navy-light`, `brand-orange` de `tailwind.config.mjs` → bloque `@theme {}` en `apps/web/src/styles/globals.css`
- **MIGRATE** directivas `@tailwind base/components/utilities` → `@import "tailwindcss"` en `globals.css`
- **ADOPT** `compressHTML: 'jsx'` (nuevo default de Astro 7) — colapsa whitespace entre inline elements siguiendo reglas JSX en vez de HTML-aware
- **REGEN** snapshots de `Header.test.ts` y `TopHeader.test.ts` (cambios de whitespace por `'jsx'` + serialización CSS del Rust compiler)
- **AUDIT** `Header.astro` y `TopHeader.astro` para detectar inline elements que pierdan separación visual con `'jsx'` (aliviar con `flex gap-*` o `{' '}` si aplica)

## Capabilities

### New Capabilities
- `astro-upgrade`: Requisitos de no-regresión e integridad de infraestructura para el upgrade de Astro 4 → 7.1.6 + migración de Tailwind v3 → v4 + bump de tooling, asegurando que el sitio público siga compilando, visualmente idéntico y funcionalmente equivalente

### Modified Capabilities
<!-- Ninguna — `site-header` y `top-header` NO cambian a nivel de requisitos funcionales;
     los snapshots y la Container API son detalles de implementación cubiertos por
     los requisitos de no-regresión de la nueva capability `astro-upgrade`. -->

## Impact

**Archivos modificados:**
- `apps/web/package.json` — bump astro/eliminar `@astrojs/tailwind`/añadir `@tailwindcss/vite`/bump tooling
- `package.json` (raíz) — bump `engines.node`
- `apps/web/astro.config.mjs` — eliminar `@astrojs/tailwind` integration; añadir plugin `@tailwindcss/vite` en `vite.plugins`; mantener `output: 'static'`
- `apps/web/src/styles/globals.css` — `@import "tailwindcss"` + `@theme` con tokens de marca
- `apps/web/tsconfig.json` — solo si la nueva versión de TypeScript exige ajuste
- `apps/web/.eslintrc.cjs` — solo si @typescript-eslint v8 lo requiere
- `apps/web/src/components/__tests__/Header.test.ts` — ajustar import de Container API si el nombre cambió en Astro 7 (de `experimental_AstroContainer` a `AstroContainer` si aplica)
- `apps/web/src/components/__tests__/TopHeader.test.ts` — ídem
- `apps/web/src/components/__tests__/*.snap` (o `__snapshots__/`) — regenerados
- `apps/web/e2e/site-header.spec.ts` y `apps/web/e2e/top-header.spec.ts` — re-ejecutar, ajustar selectores si HTML cambió por whitespace
- `apps/web/src/components/Header.astro` y `TopHeader.astro` — **solo** si auditoría de whitespace con `'jsx'` detecta inline elements que pierden separación visual

**Archivos eliminados:**
- `apps/web/tailwind.config.mjs`

**No se tocan (out of scope):**
- `apps/backend/**`, `apps/admin/**` (no hay dependencias compartidas con apps/web que se vean afectadas)
- `docs/api-spec.yml`, `docs/data-model.md` (no hay cambios de API ni modelo de dominio)

**Dependencias/sistemas externos impactados:**
- Pipeline de build SSG (Coolify/VPS): Node runtime debe subirse a `>=22.12.0` para soportar Astro 7 + Vite 8
- Sin cambios en Firebase, sin cambios en NestJS BFF
