# Delta admin-role-access

## ADDED Requirements

### Requirement: Visibilidad por rol en las acciones de la UI
Las acciones de escritura de la UI del panel SHALL respetar la jerarquía `editor < admin < superadmin` mediante el `RoleService` existente (`hasRole`), aplicando el principio de OCULTAR (no solo deshabilitar) las acciones no permitidas. En este change el consumo se materializa en las pantallas de catálogo (`admin-catalog-crud`): un usuario con rol `editor` SHALL ver las acciones «Editar» pero SHALL NOT ver los botones de creación («Añadir producto», «Añadir categoría», «Añadir subcategoría») ni las acciones «Eliminar»; los roles `admin` y `superadmin` SHALL ver todas las acciones. Los changes posteriores (p. ej. `admin-panel-operations`) SHALL extender esta regla a sus dominios con requirements propios, sin duplicar el principio.

#### Scenario: Editor no ve crear ni eliminar pero sí editar en el catálogo
- **GIVEN** un usuario autenticado con rol `editor`
- **WHEN** visita `/products` o `/categories`
- **THEN** no ve «Añadir producto», «Añadir categoría» ni ningún botón «Eliminar»
- **AND** ve las acciones «Editar» de cada fila

#### Scenario: Admin ve todas las acciones en el catálogo
- **GIVEN** un usuario autenticado con rol `admin`
- **WHEN** visita `/products` o `/categories`
- **THEN** ve los botones de creación, «Editar» y «Eliminar» en todas las filas
