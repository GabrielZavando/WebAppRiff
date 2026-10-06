# product-detail-page Specification (delta)

## MODIFIED Requirements

### Requirement: Product info section

El sistema SHALL render la información del producto en este orden vertical exacto:

1. **Chip de categoría** con el nombre de la categoría resuelto server-side.
2. **Título** (`titulo`) como encabezado `<h1>`.
3. **Descripción breve** (`descripcionBreve`) como párrafo.
4. **Caja de especificaciones** con los `atributos` del producto renderizados como una grilla de pares icono+etiqueta.
5. **Fila de CTAs** con dos botones:
   - "SOLICITAR COTIZACIÓN" → `/cotizacion?producto={slug}` (tratamiento visual primario).
   - "CONTACTAR ASESOR" → `/contacto` (tratamiento visual secundario).

El chip de categoría SHALL omitirse cuando la categoría no se encuentra (p.ej. `sin-categoria`).

(MODIFIED en este change: la CTA "CONTACTAR ASESOR" pasa de `mailto:contacto@somosriff.cl` a navegar a `/contacto`.)

#### Scenario: Full product info

- **WHEN** el producto tiene `titulo="Medidor Ultrasónico"`, `categoriaId="cat-fluidos"`, `descripcionBreve="..."` y `atributos=[{nombre:"Precisión", valor:"±2%"}]`
- **THEN** el HTML renderizado contiene:
  1. El chip de categoría "MEDICIÓN DE FLUIDOS"
  2. Un `<h1>` con "Medidor Ultrasónico"
  3. El párrafo de descripción breve
  4. Una caja de especificaciones con "Precisión: ±2%"
  5. Dos botones CTA con los href correctos

#### Scenario: Category not found

- **WHEN** el producto tiene `categoriaId="sin-categoria"` y la lista de categorías no la contiene
- **THEN** el chip de categoría se omite
- **AND** el resto de la información se renderiza con normalidad

#### Scenario: Contact advisor CTA uses the somosriff.cl mailto

(MODIFIED en este change: la CTA "CONTACTAR ASESOR" pasa de `mailto:contacto@somosriff.cl` a navegar a `/contacto`. La variante mailto sigue disponible vía la ContactBar del propio `/contacto`.)

- **WHEN** la página de detalle de producto renderiza con un producto
- **THEN** el HTML renderizado contiene un anchor con `href="/contacto"` para la CTA "CONTACTAR ASESOR"
- **AND** el HTML renderizado NO contiene `href="mailto:contacto@somosriff.cl"` ni `href="mailto:contacto@riff.cl"` para esa CTA