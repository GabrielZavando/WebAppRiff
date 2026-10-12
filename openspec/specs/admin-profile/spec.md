# admin-profile Specification

## Purpose
Página de perfil del panel de administración: datos de solo lectura del usuario autenticado (nombre, email, rol) obtenidos de GET /api/v1/auth/me, sin controles de edición.
## Requirements
### Requirement: Perfil de solo lectura
La página `/profile` SHALL mostrar los datos del usuario autenticado obtenidos de `GET /api/v1/auth/me`: nombre, email y rol. La página SHALL NOT ofrecer edición de ningún campo (sin formulario).

#### Scenario: El perfil muestra los datos del usuario autenticado
- **GIVEN** un usuario autenticado con perfil en Firestore
- **WHEN** navega a `/profile`
- **THEN** se muestran su nombre, email y rol tal como los devuelve `GET /api/v1/auth/me`

#### Scenario: El perfil no es editable
- **WHEN** el usuario ve la página de perfil
- **THEN** no existen inputs ni acciones de edición en el DOM

