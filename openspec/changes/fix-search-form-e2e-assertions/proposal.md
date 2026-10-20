## Why

Dos tests E2E preexistentes de `apps/web/e2e/search-form.spec.ts` siguen afirmando que el wrapper de búsqueda usa el gradiente antiguo (`bg-linear-to-r` y `from-secondary`), aunque el componente `SearchForm.astro` ya renderiza un fondo sólido `bg-secondary` desde `ui-chrome-polish`. El resultado es una suite E2E en rojo y un `make ci` bloqueado por aserciones obsoletas, no por un fallo del producto.

## What Changes

- Actualizar las aserciones de `search-form.spec.ts` para que verifiquen el estado real del wrapper: `bg-secondary` sólido en `/productos` y en `/productos/{slug}`.
- Eliminar de los tests la expectativa de las clases eliminadas `bg-linear-to-r` y `from-secondary`.
- Mantener la aserción negativa de que el wrapper no usa `bg-white`.
- No se modifica el componente `SearchForm.astro` ni ningún otro código de aplicación.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `web-e2e-critical-flows`: se documenta que el spec E2E de búsqueda debe validar el wrapper sólido `bg-secondary` y no las clases del gradiente retirado.

## Impact

- Tests: `apps/web/e2e/search-form.spec.ts` (solo expectativas de clases CSS del wrapper).
- CI: desbloquea el gate `make ci` al poner en verde los dos tests E2E afectados.
- Sin cambios de comportamiento, API, dependencias ni código de producción.
