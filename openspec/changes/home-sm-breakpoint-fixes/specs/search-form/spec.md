## MODIFIED Requirements

### Requirement: SearchForm layout is responsive

El search-form SHALL organizar sus controles con enfoque mobile-first:

- **Below `sm` (< 640px)**: el `<select>` SHALL ocupar una fila completa y el `<input>` y el `<button>` SHALL compartir una segunda fila, con el botón pegado al costado derecho del input y sin separación horizontal entre ellos. El formulario SHALL usar una grilla de dos columnas (`grid-cols-[minmax(0,1fr)_auto]`), el select SHALL abarcar ambas columnas (`col-span-2`), el contenedor del input SHALL declarar `min-w-0` y el botón SHALL declarar `shrink-0`.
- **From `sm` (≥ 640px)**: los tres controles SHALL volver a una sola fila horizontal. El contenedor del `<select>` SHALL reservar un ancho fijo suficiente para mostrar completo el texto de su opción más larga y SHALL declarar `sm:shrink-0` para que no se comprima; el contenedor del `<input>` SHALL declarar `sm:flex-1 min-w-0` y ocupar todo el espacio restante.
- **Short viewports (height <= 400px)**: los tres controles SHALL mantenerse en una sola fila con padding vertical reducido, preservando el presupuesto de altura del grupo sticky. El ancho compacto de 176px del select SHALL aplicar solo por debajo de `sm` (< 640px), donde además SHALL declarar `shrink-0` para que el input no lo comprima; desde `sm` el select conserva `sm:w-64` (256px) aunque la altura sea <= 400px, para no truncar "Todas las categorías".

El layout móvil SHALL permanecer contenido dentro del ancho del viewport sin scroll horizontal. En `sm` el texto del select NO SHALL truncarse ni quedar oculto por el ancho asignado.

#### Scenario: Desktop single row (>= 768px)

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` usa `flex-row`
- **AND** el `<select>`, el `<input>` y el `<button>` comparten una fila horizontal
- **AND** el input se expande para llenar el espacio disponible

#### Scenario: Mobile stacked layout (< 768px)

- **WHEN** el SearchForm se renderiza en un viewport `< 640px`
- **THEN** el `<select>` ocupa su propia fila
- **AND** el `<input>` y el `<button>` comparten una segunda fila
- **AND** no hay separación horizontal entre input y botón

#### Scenario: Mobile keeps select on its own row and input + button together

- **WHEN** el SearchForm se renderiza en un viewport de 375×667
- **THEN** el `<form>` usa una grilla de dos columnas
- **AND** el `<select>` ocupa la fila superior completa
- **AND** el `<input>` y el `<button>` comparten la fila inferior
- **AND** la separación horizontal entre el borde derecho del input y el borde izquierdo del botón es de 0px (tolerancia de 1px por borde)
- **AND** existe una separación vertical de 12px entre la fila del select y la fila del input/botón

#### Scenario: From sm the three controls share one row

- **WHEN** el SearchForm se renderiza en un viewport `>= 640px`
- **THEN** el `<form>` usa `flex-row`
- **AND** el `<select>`, el `<input>` y el `<button>` comparten una sola fila horizontal
- **AND** el input se expande para llenar el espacio disponible

#### Scenario: Select keeps its full label and input takes the remaining width at sm

- **WHEN** el SearchForm se renderiza en el viewport `640×800`
- **THEN** el contenedor del `<select>` declara `sm:w-64` y `sm:shrink-0`
- **AND** el ancho renderizado del `<select>` es de al menos 256px menos el borde (±1px)
- **AND** el texto "Todas las categorías" se muestra completo, sin truncarse
- **AND** el contenedor del `<input>` declara `sm:flex-1` y `min-w-0`
- **AND** el `<input>` ocupa el espacio restante de la fila
- **AND** los tres controles permanecen dentro del ancho del viewport

#### Scenario: Short viewports keep a single compact row

- **WHEN** el SearchForm se renderiza en un viewport de 568×320
- **THEN** los tres controles comparten una sola fila
- **AND** el padding vertical del contenedor interno es menor que en portrait
- **AND** el contenedor del select declara el ancho compacto de 176px (`w-44`) porque el ancho es `< 640px`
- **AND** el ancho renderizado del `<select>` es de al menos 170px, sin ser comprimido por el input
- **AND** no hay scroll horizontal

#### Scenario: Large phone in landscape keeps the full select label

- **WHEN** el SearchForm se renderiza en el viewport `640×375` (altura <= 400px, ancho `>= 640px`)
- **THEN** los tres controles comparten una sola fila
- **AND** el padding vertical del contenedor interno se mantiene reducido
- **AND** el contenedor del select NO aplica el ancho compacto de 176px
- **AND** el ancho renderizado del `<select>` es de al menos 256px menos el borde (±1px)
- **AND** el texto "Todas las categorías" se muestra completo, sin truncarse
- **AND** no hay scroll horizontal

#### Scenario: No horizontal overflow at 320px

- **WHEN** se carga cualquier página con buscador en un viewport de 320×568
- **THEN** `document.documentElement.scrollWidth` no supera `document.documentElement.clientWidth + 1`
- **AND** el `boundingBox` del `<form>` queda dentro del ancho del viewport
