# admin-role-access Specification

## Purpose
Base del control de acceso por rol en la UI del panel: RoleService con hasRole(...) y jerarquía editor < admin < superadmin, leído del perfil del usuario autenticado. El consumo (ocultar acciones, guards por ruta) se especifica en los changes posteriores; el principio es ocultar, no solo deshabilitar.
## Requirements
### Requirement: Servicio de roles del usuario actual
La app SHALL exponer un `RoleService` que lea el rol del usuario autenticado (desde el perfil cargado por `AuthService`, fuente `GET /api/v1/auth/me`) y ofrezca `hasRole(...roles)` y el rol actual como signal. La jerarquía de roles SHALL ser `editor` < `admin` < `superadmin`. En Foundation este servicio es la base del control de acceso por rol en la UI; su consumo para ocultar acciones CRUD y los guards de ruta por rol se especifican en los changes posteriores (`admin-panel-content`, `admin-panel-operations`), que aplicarán el principio de OCULTAR (no solo deshabilitar) las acciones no permitidas.

#### Scenario: hasRole evalúa correctamente para cada rol
- **GIVEN** un usuario con rol `editor`
- **WHEN** se invoca `hasRole('admin', 'superadmin')`
- **THEN** el resultado es `false`
- **AND** `hasRole('editor')` es `true`
- **AND** para un usuario con rol `admin`, `hasRole('admin', 'superadmin')` es `true`
- **AND** para un usuario con rol `superadmin`, `hasRole('admin', 'superadmin')` es `true`

#### Scenario: Sin perfil cargado hasRole es false
- **GIVEN** un usuario autenticado cuyo perfil (`/auth/me`) aún no cargó
- **WHEN** se invoca `hasRole` con cualquier rol
- **THEN** el resultado es `false` (nunca se concede un rol por defecto)
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
