## ADDED Requirements

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

### Requirement: Estructura de rutas base y redirecciones
El panel SHALL configurar el router con: redirect `'' → /profile` (`pathMatch: 'full'`; destino post-login temporal hasta que el change de contenido introduzca `/dashboard`), la ruta `/profile` protegida por el `AuthGuard` y renderizada dentro del shell, `/login` público y sin shell, y una ruta wildcard (`**`) que renderiza la página 404. Las páginas SHALL cargarse lazy (`loadComponent`/`loadChildren`). Los changes posteriores añadirán sus rutas bajo el shell.

#### Scenario: La raíz redirige al perfil
- **WHEN** el usuario autenticado visita `/`
- **THEN** el router redirige a `/profile`

#### Scenario: La página protegida carga lazy dentro del shell
- **WHEN** el usuario navega a `/profile` autenticado
- **THEN** la página de perfil se carga en un chunk separado (`loadComponent`) dentro del `router-outlet` del shell

#### Scenario: Wildcard muestra 404
- **WHEN** el usuario navega a una ruta inexistente (ej. `/no-existe`) autenticado
- **THEN** se renderiza la página 404 sin romper el shell

### Requirement: Página 404 con vuelta al panel
La página 404 (basada en la de TailAdmin, adaptada a tokens Riff) SHALL informar que la ruta no existe con un mensaje claro y SHALL ofrecer un enlace visible hacia `/profile` para recuperar la navegación.

#### Scenario: El enlace de la 404 vuelve al perfil
- **WHEN** el usuario activa el enlace de la página 404
- **THEN** el router navega a `/profile`
