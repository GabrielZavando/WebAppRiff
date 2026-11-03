## 1. Header - logo centrado verticalmente en lg:

- [x] 1.1 Agregar clases `lg:pt-*` y `lg:pb-*` al contenedor del header (`site-header`) para centrar el logo verticalmente y agregar espacio arriba/abajo en `lg:`, sin afectar la alineación a la izquierda.
- [x] 1.2 Verificar que el logo no choque con el buscador en el breakpoint `lg:` (1024px).

## 2. Buscador - botón más ancho en lg:

- [x] 2.1 Modificar la clase del botón de búsqueda en `SearchForm.astro` para que sea al menos 18px más ancho en `lg:` (ej. `lg:max-w-[78px]` en lugar de `sm:max-w-[60px]`).
- [x] 2.2 Verificar que el input y el select sigan ocupando el espacio restante (`sm:flex-1`) sin comprimirse.

## 3. PanelHome - caja flotante y estadísticas en lg:

- [x] 3.1 Cambiar el margen superior de PanelHome de `-mt-2` a `lg:mt-20` (5rem) para desplazar la caja flotante hacia abajo en `lg:`.
- [x] 3.2 Reducir el tamaño de fuente de los valores de las estadísticas (40+, 30.000+, 5+, 9+) en `lg:` (agregar `lg:text-3xl` a `text-2xl sm:text-3xl md:text-4xl`).

## 4. DestacadosSection - productos en 2 columnas en lg:

- [x] 4.1 Cambiar el grid de tarjetas de productos de `lg:grid-cols-4` a `lg:grid-cols-2` en `DestacadosSection.astro` para mostrar 2 columnas en `lg:`.

## 5. NosotrosValueProp - pilares en 2 columnas en lg:

- [x] 5.1 Cambiar el grid de tarjetas de pilares de `lg:grid-cols-4` a `lg:grid-cols-2` en `NosotrosValueProp.astro` para mostrar 2 columnas en `lg:`.

## 6. ServiciosTerrenoSection - servicios en terreno en 2 columnas en lg:

- [x] 6.1 Cambiar el contenedor de tarjetas de `flex flex-col gap-12` a un grid con `lg:grid-cols-2` en `ServiciosTerrenoSection.astro` para mostrar 2 columnas en `lg:`.

## 7. Representaciones - título y tarjetas de valor prop en lg:

- [x] 7.1 Reducir el tamaño de fuente del título "Alianzas Estratégicas y Representación Exclusiva" al menos 1rem en `lg:` en `representaciones.astro`.
- [x] 7.2 Cambiar el grid de las 4 tarjetas de valor prop de `lg:grid-cols-4` a `lg:grid-cols-2` en `representaciones.astro` para mostrar 2 columnas en `lg:`.

## 8. Verificación final

- [x] 8.1 Revisar visualmente todos los ajustes en el breakpoint `lg:` (1024px) en el sitio público.
- [x] 8.2 Confirmar que no hay regresiones en breakpoints menores (`sm`, `md`) ni mayores (`xl`).
