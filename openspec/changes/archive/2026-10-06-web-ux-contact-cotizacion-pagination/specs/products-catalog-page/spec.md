# products-catalog-page Specification (delta)

## ADDED Requirements

### Requirement: Pagination scrolls to top on page change

Al cambiar de página en el listado de productos (click en un número, en anterior o en siguiente), el runtime del catálogo SHALL llevar el scroll de la ventana al top de forma instantánea (sin smooth-scroll) tras aplicar la nueva página, de modo que el contenido se muestre como si el usuario acabara de entrar. Los filtros de búsqueda activos (q, categoriaId, subcategoriaIds, view) SHALL mantenerse al cambiar de página.

#### Scenario: Click en un número de página

- **WHEN** el usuario hace click en el número de página 2 estando en `/productos`
- **THEN** la lista muestra la página 2 del listado
- **AND** la posición de scroll de la ventana vuelve al top (0)
- **AND** el desplazamiento es instantáneo (sin animación smooth-scroll)

#### Scenario: Filtros activos preservados al cambiar de página

- **WHEN** el usuario está en `/productos?q=flujometro&categoriaId=cat-fluidos&page=1` y hace click en la página 3
- **THEN** la URL pasa a `/productos?q=flujometro&categoriaId=cat-fluidos&page=3`
- **AND** el listado refleja los mismos filtros en la página 3

#### Scenario: Comportamiento consistente en desktop y mobile

- **WHEN** el usuario cambia de página desde cualquier viewport (mobile o desktop)
- **THEN** el scroll de la ventana vuelve al top en ambos casos
- **AND** no hay parpadeo ni salto visual incómodo durante la transición

#### Scenario: Botones anterior/siguiente también llevan al top

- **WHEN** el usuario usa "Página anterior" o "Página siguiente"
- **THEN** se aplica la página correspondiente
- **AND** el scroll de la ventana vuelve al top (0)