## Context

El sitio público Astro (apps/web/) acaba de ser bootstrapped (Fase A). Necesita el componente `TopHeader` como primera pieza de UI real. La imagen de referencia `docs/design/components/TopHeader.png` muestra una utility bar azul oscuro degradado con:
- Izquierda: teléfono `+56 2 29079067`
- Derecha: 4 íconos de redes sociales (Facebook, X, Instagram, LinkedIn)

Decisiones ya confirmadas:
- Solo 1 teléfono (sin secundario)
- 4 redes sociales fijas (el 5° ícono de la imagen se ignora)
- Mobile (<640px): oculto completamente
- Global: aparece en todas las páginas vía Layout.astro
- Datos desde `.env` via `import.meta.env`

## Goals / Non-Goals

**Goals:**
- Componente `TopHeader.astro` presentacional puro (dumb), sin estado ni fetching
- Configuración tipada en `lib/config/contact.ts` leída desde `.env`
- Integración en `Layout.astro` encima del `<slot />`
- Tests Vitest cubriendo renderizado, props, mobile, accesibilidad
- Snapshot test para regresión visual

**Non-Goals:**
- No hay estado de "dismissible" (el ícono X de la imagen era mal identificado)
- No hay fetch desde API backend
- No hay variaciones por página (siempre igual)
- No hay animaciones complejas

## Decisions

1. **Presentational component (dumb)**: TopHeader no hace fetching ni tiene estado. Recibe datos via props (aunque en Astro SSG las props vienen del layout que lee `import.meta.env` directamente). Esto cumple SRP de `frontend-standards.md` § "Principios de Diseño — Astro".

2. **Config tipada separada**: `lib/config/contact.ts` exporta `getContactInfo(): ContactInfo` que lee `import.meta.env`. Permite testear la lógica de config aislada del componente.

3. **Tipos en `lib/types/top-header.ts`**: Interfaces `ContactInfo` y `SocialLink` compartidas entre config y componente.

4. **Mobile-first con Tailwind**: `hidden sm:flex` oculta toda la barra en <640px. Simple, sin JS.

5. **Accesibilidad nativa**: Cada link social tiene `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`. Nav con `aria-label="Redes sociales"`.

6. **Colores**: Usar `bg-brand-navy` y `bg-brand-navy-light` definidos en `tailwind.config.mjs` (ya creado en Fase A).

## Risks / Trade-offs

- **Risk**: Variables de entorno no definidas en build → **Mitigation**: `getContactInfo()` retorna strings vacíos; componente omite links sin URL.
- **Risk**: Cambio de branding (colores) → **Mitigation**: Colores centralizados en `tailwind.config.mjs` y clases semánticas `brand-navy`.
- **Trade-off**: Hardcoded 4 redes sociales (no dinámico) → Simplicidad y tipos estrictos; si se añade red, se toca código (aceptable para MVP).