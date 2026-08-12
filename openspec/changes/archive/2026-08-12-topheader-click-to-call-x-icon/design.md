## Context

El TopHeader (`apps/web/src/components/TopHeader.astro`) ya implementa click-to-call vía `tel:` (línea 24: regex que preserva `+` y dígitos; línea 41: `<a href={phoneHref}>`). El componente está oculto en móvil (`hidden sm:flex`). El Footer (`Footer.astro`) replica el mismo `socialIconMap` con un comentario explícito de sincronización (Decision 4 de design.md: single social presence across chrome).

Estándar actual: "set único Lucide" para iconos de UI y marcas sociales (`docs/frontend-standards.md` líneas 88, 129; `docs/design/style-guide/README.md` línea 71). Lucide no provee el logo oficial actual de X (Twitter); `lucide:x` es el icono de "cerrar", no la marca.

## Goals / Non-Goals

**Goals:**
- Verificar y añadir test de regresión al click-to-call existente (formato E.164 sin espacios).
- Cambiar icono de red social X de `lucide:twitter` a `simple-icons:x` en TopHeader y Footer.
- Instalar `@iconify-json/simple-icons` como source set local para SSR (paridad con `@iconify-json/lucide`).
- Documentar la excepción al set único Lucide en style guide y frontend-standards.
- Mantener sincronización del `socialIconMap` entre TopHeader y Footer.

**Non-Goals:**
- Hacer visible el teléfono en móvil (TopHeader sigue `hidden sm:flex`).
- Refactor del `socialIconMap` duplicado a módulo compartido (deuda técnica separada).
- Actualizar comentario obsoleto de `astro.config.mjs` sobre `material-symbols`.
- Cambios en Header.astro, api-spec.yml, data-model.md.

## Decisions

| Decisión | Alternativa considerada | Rationale |
|---|---|---|
| **Icono X: `simple-icons:x`** | Mantener `lucide:twitter` (pájaro antiguo); probar alias Lucide inexistente | `simple-icons:x` es el logo oficial actual de X, disponible en Iconify. Lucide no tiene marca X. Única excepción documentada. |
| **Instalar `@iconify-json/simple-icons`** | Depender solo de Iconify API online en build | Consistencia con `@iconify-json/lucide` ya instalado; SSR determinista, sin dependencia de red en CI. |
| **Excepción documentada (no relajar regla general)** | Cambiar estándar a "Lucide + excepciones case-by-case" | La regla "set único Lucide" sigue vigente para UI y otras marcas. Solo X carece de logo en Lucide. Excepción puntual, trazable, auditada. |
| **Cambiar TopHeader + Footer** | Solo TopHeader (lo que pidió el usuario) | Decision 4 de design.md: single social presence across chrome. Footer comenta explícitamente que debe sincronizarse. Inconsistencia visible si no se toca ambos. |
| **Test de regresión tel:** | Sin test (confiar en implementación existente) | Test vitest barato, valida regex E.164 y previene regresiones silenciosas. El usuario lo aprobó. |

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| `simple-icons:x` no resuelve en build SSG (icono inexistente o paquete no instalado) | Instalar `@iconify-json/simple-icons` antes de cambiar el código; validar con `npm run build` en apps/web. |
| Diferencia visual: Simple Icons es fill-based, Lucide brands son stroke-based → logo X puede verse más "sólido" | Esperado y aceptado. Los logos de marca suelen ser fill; la excepción se documenta. No afecta usabilidad. |
| Snapshots existentes en tests de TopHeader/Footer fallan tras cambio de icono | Regenerar snapshots con `vitest -u` si los tests usan snapshot matching. |
| `@iconify-json/simple-icons` version incompatibility con astro-icon | Usar misma versión mayor que `@iconify-json/lucide` (`^1.2.0`). astro-icon 1.x compatible con iconify-json 1.x. |

## Migration Plan

1. **Pre-deploy**: `npm install` en apps/web (instala `@iconify-json/simple-icons`).
2. **Deploy**: Cambios de código (icono) + docs atómicos en mismo commit.
3. **Post-deploy**: `npm run build` en apps/web → verifica resolución de `simple-icons:x` en SSG.
4. **Rollback**: Revert commit único; `@iconify-json/simple-icons` se desinstala con `npm install` posterior (no rompe nada si queda instalado sin uso).

## Open Questions

- Ninguna. Todas las decisiones confirmadas con el usuario antes de entrar a build mode.