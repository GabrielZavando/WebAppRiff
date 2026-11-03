## Context

El sitio público de Riff (apps/web, Astro SSG) utiliza Tailwind CSS con breakpoints responsivos. Varios componentes presentan problemas de layout específicos en el breakpoint `lg:` (1024px): el logo del header choca visualmente con el buscador, el botón de búsqueda se siente comprimido, la caja flotante del inicio (PanelHome) se superpone mal al banner, y varias secciones de tarjetas (productos destacados, pilares de Nosotros, servicios en terreno, valor prop de Representaciones) usan 4 columnas en desktop cuando el diseño aprobado pide 2 columnas en `lg:`. El título de alianzas en Representaciones es excesivamente grande en desktop.

Este change es transversal: toca múltiples componentes y páginas del sitio público sin modificar lógica de negocio, solo clases de Tailwind con prefijo `lg:`.

## Goals / Non-Goals

**Goals:**
- Corregir el espaciamiento y alineación en el breakpoint `lg:` (1024px) en todos los componentes listados en la propuesta.
- Usar exclusivamente clases de Tailwind con prefijo `lg:` para los ajustes.
- No alterar el comportamiento, el contenido ni la estructura HTML de los componentes.
- No introducir nuevos breakpoints ni modificar el archivo de configuración de Tailwind.

**Non-Goals:**
- Cambios en breakpoints distintos a `lg:` (sm, md, xl, etc.).
- Refactor de componentes o extracción de estilos a CSS personalizado.
- Cambios de comportamiento interactivo (JS, animaciones, contadores).
- Modificación de contenido (textos, imágenes, enlaces).

## Decisions

| Decisión | Razón | Alternativa considerada |
| --- | --- | --- |
| Capability path `web/lg-breakpoint-layout` | Agrupa bajo un solo capability todos los ajustes transversales del breakpoint `lg:` en el sitio público. | Capabilities separados por componente (fragmentaría el change y dificultaría su validación como un solo ajuste de breakpoint). |
| `lg:mt-20` para el desplazamiento de PanelHome | 5rem = 80px, cumple el mínimo de "al menos 5rem" solicitado. | Usar `lg:mt-24` (6rem) — excede el mínimo y desplaza demasiado la caja. |
| `lg:grid-cols-2` para grids de 4 tarjetas | Cumple el requisito de 2 columnas en `lg:` sin afectar mobile (1 col) ni tablet (2 cols ya). | Mantener `lg:grid-cols-4` y reducir el ancho de tarjeta — no cumple el requisito de 2 columnas. |
| Reducir tamaño de fuente de valores de stats en `lg:` | Los valores (30.000+) son largos y pueden apretarse en desktop; reducir el tamaño mejora la legibilidad. | Mantener `md:text-4xl` en `lg:` — no cumple el requisito de reducción. |
| No modificar specs existentes en `openspec/specs/` | El cambio es de implementación (clases Tailwind), no de requisitos de comportamiento. | Crear delta specs para `site-header`, `search-form`, etc. — innecesario porque no cambian los requisitos funcionales. |

## Risks / Trade-offs

| Riesgo | Mitigación |
| --- | --- |
| `lg:mt-20` en PanelHome podría crear un espacio excesivo entre el banner y la caja en pantallas muy anchas. | Verificar visualmente en escritorio; ajustar a `lg:mt-16` si `lg:mt-20` resulta demasiado. |
| Reducir el tamaño de fuente de los valores de stats podría afectar la jerarquía visual con las etiquetas. | Mantener las etiquetas en `text-xs md:text-sm` sin cambios; solo se reduce el valor (`text-2xl sm:text-3xl md:text-4xl` → agregar `lg:text-3xl`). |
| Cambiar `lg:grid-cols-4` a `lg:grid-cols-2` en DestacadosSection podría dejar un segundo row con celdas vacías si hay más de 4 tarjetas. | La página limita a 8 productos; con 2 columnas en `lg:` se usan 4 filas para 8 tarjetas, comportamiento aceptable. |
| El botón de búsqueda más ancho en `lg:` podría comprimir el input y el select en pantallas justo en el umbral 1024px. | El input y select usan `sm:flex-1` y ceden espacio; el botón es `shrink-0`, por lo que no se comprime. |

## Migration Plan

No se requiere migración de datos ni cambios en la base de datos. Los cambios son puramente de estilos (Tailwind classes) y se despliegan con la siguiente versión del sitio público en Cloud Run. Rollback: revertir las clases `lg:` modificadas en los componentes afectados.

## Open Questions

Ninguna.
