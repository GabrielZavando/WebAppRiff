# admin-app-shell Specification

## Purpose
Layout y navegación del panel de administración (Angular): shell con sidebar colapsable, header con usuario y logout, rutas protegidas bajo el shell, redirect raíz al destino post-login y página 404. Los changes posteriores (contenido y operaciones) montan sus módulos sobre este esqueleto.
## Requirements
### Requirement: Shell de aplicación con sidebar, header y contenido
El panel SHALL renderizar, para todas las rutas protegidas, un layout shell basado en TailAdmin (copiado y adaptado según design.md D1) compuesto por: un sidebar colapsable con la navegación principal, un header superior con el nombre del módulo activo, el usuario actual y la acción de logout, y un área de contenido con `<router-outlet/>` anidado. En Foundation el sidebar SHALL listar únicamente las secciones implementadas (Perfil); los changes posteriores añadirán sus secciones. El shell SHALL usar exclusivamente utilities generadas del `@theme` de design tokens Riff (flat design: sin `rounded*`, sin sombras) y el logo de Riff (sin importar CSS ni assets del template).

#### Scenario: El shell envuelve una ruta protegida
- **WHEN** el usuario navega a `/profile` autenticado
- **THEN** el DOM contiene el sidebar con la sección Perfil, el header (con el usuario y la acción de logout) y el contenido de la página dentro del `router-outlet` anidado
- **AND** el logo de Riff es visible en el shell

#### Scenario: El sidebar colapsa y expande
- **WHEN** el usuario activa el control de colapso del sidebar
- **THEN** el sidebar alterna entre estado expandido y colapsado
- **AND** el estado elegido persiste durante la sesión de navegación (no se resetea al cambiar de ruta)

#### Scenario: El ítem activo de navegación se marca
- **WHEN** el usuario está en `/profile`
- **THEN** el ítem «Perfil» del sidebar se distingue visualmente como activo (clase/token diferenciado) y los demás no

#### Scenario: Los componentes copiados de TailAdmin no introducen estilos ajenos
- **WHEN** se inspeccionan los componentes de shell copiados de TailAdmin
- **THEN** no importan `styles.css` del template ni referencian paletas `brand-*`/`gray-*` de TailAdmin
- **AND** sus templates usan utilities de los tokens Riff y no contienen clases `rounded*` ni `shadow*`

### Requirement: Página 404 con vuelta al panel
La página 404 (basada en la de TailAdmin, adaptada a tokens Riff) SHALL informar que la ruta no existe con un mensaje claro y SHALL ofrecer un enlace visible hacia `/profile` para recuperar la navegación.

#### Scenario: El enlace de la 404 vuelve al perfil
- **WHEN** el usuario activa el enlace de la página 404
- **THEN** el router navega a `/profile`
### Requirement: Configuración de rutas y redirecciones
El panel SHALL configurar el router con: redirect `'' → /products` (`pathMatch: 'full'`; el destino post-login es la lista de productos — el dashboard prometido inicialmente queda diferido sin fecha, ver `admin-panel-content`), las rutas de catálogo `/products`, `/products/new`, `/products/:id`, `/categories`, `/categories/new`, `/categories/:id`, `/categories/:id/subcategories/new` y `/categories/:id/subcategories/:subId` protegidas por el `AuthGuard` y renderizadas dentro del shell, la ruta `/profile` protegida y renderizada dentro del shell (sin cambios), `/login` público y sin shell, y una ruta wildcard (`**`) que renderiza la página 404. El destino del redirect SHALL tener una única fuente (`POST_LOGIN_REDIRECT` en `app-navigation.ts`, importada por `app.routes.ts`; elimina la duplicación previa en `app.routes.ts`). Las páginas SHALL cargarse lazy (`loadComponent`/`loadChildren`). Los changes posteriores añadirán sus rutas bajo el shell.

#### Scenario: La raíz redirige al listado de productos
- **WHEN** el usuario autenticado visita `/`
- **THEN** el router redirige a `/products`

#### Scenario: La página protegida carga lazy dentro del shell
- **WHEN** el usuario navega a `/profile` autenticado
- **THEN** la página de perfil se carga en un chunk separado (`loadComponent`) dentro del `router-outlet` del shell

#### Scenario: Las rutas de catálogo viven bajo el shell y están protegidas
- **WHEN** el usuario autenticado navega a `/products` o a `/categories/c1/subcategories/new`
- **THEN** la página se renderiza dentro del shell (sidebar + header) y en un chunk separado
- **AND** si no hay sesión, el `AuthGuard` redirige a `/login`

#### Scenario: Wildcard muestra 404
- **WHEN** el usuario navega a una ruta inexistente (ej. `/no-existe`) autenticado
- **THEN** se renderiza la página 404 sin romper el shell

### Requirement: Secciones de catálogo en el sidebar
El sidebar SHALL listar las secciones del panel en el orden: Productos (`/products`), Categorías (`/categories`) y Perfil (`/profile`), añadiendo los ítems de catálogo a los existentes (`navItems` de `app-sidebar.component.ts`). Los ítems nuevos SHALL seguir el patrón actual de `NavItem` (icono SVG inline renderizado vía `SafeHtmlPipe`, coherente con el icono de Perfil existente y con los design tokens Riff). El ítem activo SHALL distinguirse visualmente igual que en Foundation.

#### Scenario: El sidebar muestra las tres secciones en orden
- **WHEN** un usuario autenticado visualiza el shell
- **THEN** el sidebar lista, en este orden, Productos, Categorías y Perfil

#### Scenario: El ítem activo de catálogo se marca
- **WHEN** el usuario navega a `/categories/c1`
- **THEN** el ítem «Categorías» del sidebar se distingue como activo
