# Design

## Context

`Layout.astro` renderiza hoy `TopHeader` + `Header` + `SearchForm` + slot, más `WhatsAppButton` como acción flotante global. `TopHeader` aporta el teléfono y redes en desktop, pero añade 32 px de chrome no sticky y deja el teléfono sin acción directa en mobile. El logo actual (`logo-web.webp`, 600×243) se reemplaza por el nuevo `logo-web.png` (1080×542), que ya existe en el repositorio y no debe alterarse. El icono de WhatsApp hereda el color de texto del `body` (azul marino) y pierde contraste sobre el verde.

Este change aborda solo el chrome global y el logo. Las correcciones responsive detectadas en la exploración (desbordes a 320 px, header 1024–1204, catálogo en modo lista, etc.) quedan para un segundo change.

## Goals / Non-Goals

**Goals**

- Retirar `TopHeader` y su spec completa.
- Dar al teléfono una acción global visible también en mobile mediante `PhoneFab`.
- Corregir el color del icono de WhatsApp.
- Migrar Header y Footer al PNG nuevo sin distorsión ni cambios de altura percibida.
- Mantener una única fuente de contacto (`getContactInfo()`).
- Dejar specs, tests y snapshots coherentes con el chrome nuevo.

**Non-Goals**

- No se implementa ninguna corrección responsive del segundo change.
- No se rediseña el Header, el Footer ni el menú móvil.
- No se modifica el backend, el admin, la API ni las dependencias.
- No se elimina `logo-web.webp` del repositorio; solo se dejan de usar sus referencias en `apps/web`.
- No se extrae una abstracción compartida para el pulso de los FABs; cada componente conserva su CSS scoped para mantener el cambio aislado.

## Decisions

### 1. Retirar `top-header` como capability completa

Se usa un delta `## REMOVED Requirements` con los 11 requisitos y `retire_capabilities: true` en `.openspec.yaml`. Al archivar, la spec `openspec/specs/top-header/` se elimina y no queda una capability vacía.

**Alternativa descartada**: dejar la spec y marcar todo como obsoleto. Mantendría documentación muerta y contradicciones en el orden DOM.

### 2. Mover los tipos de contacto a un módulo neutral

`lib/types/top-header.ts` contiene `ContactInfo`, `SocialLink`, `SocialNetworkName` y `getSocialLinks()`. Se trasladan a `lib/types/contact.ts` para que Footer, ContactBar y formularios no dependan del nombre de un componente retirado. Se actualizan todos los imports y tests. No cambia el contrato de datos ni la configuración.

### 3. `PhoneFab` como componente presentacional

`PhoneFab.astro` recibe `phone: string` desde `Layout.astro` (`contact.phone`), normaliza el `href` conservando un `+` inicial y eliminando el resto de no-dígitos, y no renderiza nada si el teléfono está vacío. Marcado:

- `fixed bottom-24 right-6 z-20 h-14 w-14 bg-accent text-white hover:bg-accent-dark`
- `lucide:phone h-7 w-7` con `aria-hidden="true"`
- `aria-label="Llamar a Riff"` y foco visible
- mismo pulso CSS de 2 s que WhatsApp, desactivado con `prefers-reduced-motion`

`bottom-24` (96 px) deja 16 px entre el FAB de teléfono (56 px) y el de WhatsApp (`bottom-6`, 24 px + 56 px = 80 px). Ambos comparten `z-20`; el FAB de teléfono queda arriba por posición, no por z-index. El menú móvil (`z-40` dentro del shell `z-30`) sigue cubriendo ambos.

### 4. Logo PNG con dimensiones que preservan la altura percibida

El PNG mide 1080×542 (ratio ≈1.99:1). Para conservar la altura renderizada anterior:

| Contexto | Antes (WebP 600×243) | Nuevo (PNG 1080×542) |
| --- | --- | --- |
| Header móvil | 200 px de ancho ≈81 px de alto | 160 px de ancho ≈80.4 px de alto |
| Header desktop | 300 px de ancho ≈121.5 px de alto | 240 px de ancho ≈120.5 px de alto |
| Header compacto scroll | 100 px de alto ≈247 px de ancho | 100 px de alto ≈199 px de ancho |
| Footer | 165×67 px | 165×83 px |

Header usa `<Image width={330} height={166}>` (2× del ancho máximo desktop), `max-w-[160px] sm:max-w-[240px]` y conserva `pb-10 lg:pb-4` y `overflow-visible`. El desborde leve aceptado en desktop pasa de ~9.5 px a ~8.5 px. Footer usa `<Image width={165} height={83}>`. El asset se importa tal cual; no se copia, mueve ni sobrescribe.

**Riesgo**: el logo es horizontal con texto blanco; sobre fondos navy (Header/Footer) funciona, pero no debe colocarse sobre blanco sin un contenedor oscuro. Este change no lo mueve a fondos claros.

### 5. WhatsApp: solo el color del icono

Se añade `text-white` al `<Icon name="simple-icons:whatsapp">`. No se toca el href, la talla, la posición ni la animación. El test de componente debe verificar la clase y que no herede el color del `body`.

### 6. Orden DOM y specs dependientes

El orden global queda: `Header` → `SearchForm` (si aplica) → slot. Los FABs viven fuera de ese stack, al final del layout. Se actualizan las specs que fijaban `TopHeader` (`search-form`, `home-hero-shell`, `hero-banner`, `panel-home`, `solution-section`, `services-section`, `site-header-scroll`, `design-tokens`, `configure-social-links`, `contact-page`, `representaciones-page`, `astro-upgrade`, `web-e2e-critical-flows`) y se retiran los escenarios de `top-header` en `astro-upgrade`.

### 7. Estrategia TDD

1. Añadir tests fallidos de `PhoneFab` (href, posición, tamaño, etiqueta, pulso, vacío) y del icono blanco de WhatsApp.
2. Actualizar tests de Header/Footer para el PNG y las dimensiones nuevas; actualizar snapshots solo después de que el render cambie.
3. Añadir E2E `phone-fab.spec.ts` y ajustar los E2E de orden DOM para exigir ausencia de `TopHeader`.
4. Eliminar `TopHeader.test.ts`, su snapshot y `e2e/top-header.spec.ts` cuando el componente ya no exista.
5. Cerrar con `npm run test`, `typecheck`, `lint`, `test:smoke` y `openspec validate --all --strict`.

## Risks / Trade-offs

- **Logo más pequeño en ancho**: se prioriza no alterar la altura del header. Si el cliente prefiere el ancho anterior, habrá que aceptar más desborde vertical o aumentar el header en un change posterior.
- **PNG sin trackear**: `logo-web.png` está en el working tree pero no en git. Antes de commitear hay que asegurarse de incluirlo; el change no lo modifica.
- **Pulso duplicado**: dos bloques CSS similares. Se acepta para no acoplar los FABs ni cambiar la spec de WhatsApp más allá del color.
- **Tests E2E de orden DOM**: varias suites asumen `TopHeader`; hay que actualizarlas en el mismo commit para que el gate quede verde.
- **Accesibilidad**: el teléfono deja de estar visible como texto en desktop. El FAB conserva `aria-label` y el Footer mantiene el teléfono visible; no se pierde el dato, solo cambia la forma de acceso.

## Migration Plan

1. Crear/mover tipos de contacto y actualizar imports.
2. Añadir `PhoneFab`, integrarlo en `Layout`, retirar `TopHeader` y su render.
3. Corregir el icono de WhatsApp.
4. Migrar Header y Footer al PNG con las dimensiones acordadas; ajustar comentarios de `header-scroll.css`.
5. Actualizar tests, snapshots, specs dependientes y E2E.
6. Validar el change y, tras aprobación, archivar para eliminar `openspec/specs/top-header/`.

Rollback: revertir el commit del change restaura `TopHeader`, el WebP y los tests anteriores; no hay migraciones de datos ni cambios de infraestructura.

## Open Questions

- Ninguna bloqueante. La única decisión visual pendiente es validar en `apply` que el logo a 160/240 px se vea bien en Header y a 165 px en Footer; si no, se ajusta el tope antes de archivar.
