# page-headings Specification

## Purpose
Comportamiento tipográfico de los títulos principales (`<h1>`) de las páginas del sitio — Inicio, Nosotros, Productos, Servicios, Representaciones y Contacto — que deben renderizarse completamente en mayúsculas mediante la utilidad `uppercase`, sin alterar el copy subyacente, la jerarquía de encabezados ni el color de la palabra destacada.

## Requirements
### Requirement: Primary page headings render fully uppercase
The primary `<h1>` heading of Inicio, Nosotros, Productos, Servicios, Representaciones and Contacto SHALL render fully uppercase. The uppercase transformation SHALL be applied to the whole heading, including any highlighted `<span>`, via the `uppercase` utility on the `<h1>` element (the underlying copy MAY keep sentence case). The change SHALL NOT alter the heading level, the visible wording, the highlight color or the existing page structure.

#### Scenario: Inicio hero heading
- **WHEN** the home page hero renders with the headline "Innovación que Fluye"
- **THEN** the `<h1>` carries the `uppercase` utility and displays "INNOVACIÓN QUE FLUYE"

#### Scenario: Nosotros hero heading
- **WHEN** the Nosotros hero renders with the title "SOMOS RIFF"
- **THEN** the `<h1>` carries the `uppercase` utility

#### Scenario: Productos page heading
- **WHEN** the Productos page header renders with the title "Catálogo de Productos"
- **THEN** the `<h1>` carries the `uppercase` utility and displays "CATÁLOGO DE PRODUCTOS"

#### Scenario: Servicios hero heading
- **WHEN** the Servicios hero renders with the headline "Portafolio industrial de soluciones & Servicios Industriales"
- **THEN** the `<h1>` carries the `uppercase` utility and displays "PORTAFOLIO INDUSTRIAL DE SOLUCIONES & SERVICIOS INDUSTRIALES"
- **AND** the highlighted "Servicios Industriales" span keeps `text-primary`

#### Scenario: Representaciones hero heading
- **WHEN** the Representaciones hero renders with the headline "Alianzas Estratégicas y Representación Exclusiva"
- **THEN** the `<h1>` carries the `uppercase` utility

#### Scenario: Contacto hero heading
- **WHEN** the Contacto hero renders with the headline "Conecte con la Ingeniería de Precisión"
- **THEN** the `<h1>` carries the `uppercase` utility and displays "CONECTE CON LA INGENIERÍA DE PRECISIÓN"
