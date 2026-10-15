# Delta admin-app-shell

## REMOVED Requirements

### Requirement: Estructura de rutas base y redirecciones
**Reason**: El comportamiento del bloque cambió por completo: el redirect raíz pasa de `/profile` a `/products` (dashboard diferido, ver `admin-panel-content`), se añaden las rutas de catálogo bajo el shell y el destino del redirect se unifica en una sola fuente. Uno de sus escenarios («La raíz redirige al perfil») llevaba el destino en el título — identificador estable que la validación estricta no permite alterar dentro de un MODIFIED — por lo que el bloque se retira y se reemplaza íntegramente en lugar de dejar título y cuerpo desalineados.
**Migration**: El nuevo requirement «Configuración de rutas y redirecciones» de este mismo change lo sustituye al archivarse; conserva los invariantes vigentes (lazy loading, wildcard 404, shell protegido por `AuthGuard`) y añade las rutas de catálogo.

## ADDED Requirements

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
