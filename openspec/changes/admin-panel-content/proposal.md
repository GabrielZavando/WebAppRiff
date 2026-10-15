# Proposal: admin-panel-content

## Why

El change `admin-panel-foundation` dejó el panel con shell, login y perfil, pero sin ninguna pantalla que consuma los endpoints CRUD de catálogo que el backend ya expone (`/categories`, `/subcategories`, `/products`). La operación del catálogo (crear, editar, publicar productos) solo es posible hoy vía Firestore/API directa, lo que bloquea el uso real del panel por parte del equipo de Riff.

## What Changes

- **CRUD de productos**: página `/products` con tabla paginada server-side (`?page&limit`, default 24), contador total leído de `meta.total`, buscador server-side (`?search=`) y filtro por categoría server-side (`?categoriaId=`); formulario dedicado en página (`/products/new`, `/products/:id`) que cubre el DTO completo del backend, con galería y ficha técnica editadas como data (`url`, `storagePath`, `alt`, `orden`) — **sin subida de archivos** (no existe endpoint HTTP de uploads; se difiere a un change de backend futuro como dominio pendiente `admin-uploads`).
- **CRUD de categorías**: página `/categories` (tabla + buscador + acciones) y formulario en `/categories/new` y `/categories/:id`; delete con modal y mapeo de 409 (slug duplicado, categoría default, categoría con productos).
- **CRUD de subcategorías anidado**: la página de detalle de categoría (`/categories/:id`) muestra el formulario de la categoría + la lista de sus subcategorías, con "Añadir subcategoría" → `/categories/:id/subcategories/new` y edición → `/categories/:id/subcategories/:subId`; unicidad de slug por categoría (409 a mapear por campo).
- **UX transversal**: banners inline de éxito post-guardar/post-eliminar (no toast), modales de confirmación de borrado, errores 409 y de validación mostrados por campo (patrón de `login-page.component.ts`), breadcrumb y botón de vuelta al listado.
- **Visibilidad por rol (principio D6 de Foundation, requirement en `admin-role-access`)**: `editor` puede editar pero no ve botones Crear ni Eliminar (ocultar, no deshabilitar); admin/superadmin ven todo. Usa el `RoleService`/`hasRole()` existente.
- **Infraestructura de frontend** (sin tocar backend): extensión de `ApiClientService` con `getWithMeta` (expone `meta` para la paginación de productos), modelos/DTOs espejo por workspace (no se comparten con `apps/web`), servicios de dominio según el patrón `features/profile/profile.service.ts`, extracción y adaptación de `ui/table`, `ui/modal` y `ui/alert` desde TailAdmin, items de sidebar (Productos, Categorías, Perfil) y rutas hijas bajo el shell.
- **Routing**: redirect raíz re-apuntado a `/products` (no se crea dashboard) y unificación de la constante duplicada `POST_LOGIN_REDIRECT` (`app.routes.ts` + `app-navigation.ts`) en una sola fuente.

## Capabilities

### New Capabilities

- `admin-catalog-crud`: pantallas y consumo CRUD del catálogo en el panel (listado paginado de productos con búsqueda/filtro/total, CRUD de categorías, CRUD de subcategorías anidadas, CRUD de productos con DTO completo, manejo de errores 409 por campo, confirmación de éxito inline).

### Modified Capabilities

- `admin-app-shell`: nuevas rutas hijas bajo el shell (`/products`, `/products/new`, `/products/:id`, `/categories`, `/categories/new`, `/categories/:id`, `/categories/:id/subcategories/new`, `/categories/:id/subcategories/:subId`), redirect raíz re-apuntado a `/products` (difiere el `/dashboard` prometido) y sidebar con las secciones Productos, Categorías y Perfil.
- `admin-role-access`: nuevo requirement de consumo de la UI (ADDED): ocultamiento de acciones Crear/Eliminar para `editor` en el catálogo, centralizado en esta capability para que `admin-panel-operations` lo extienda a sus dominios sin duplicar el principio.
- `admin-login`: destino post-login y redirect raíz re-apuntados a `/products` (el spec prometía `/profile` temporal y re-punteo futuro a `/dashboard`; se difiere el dashboard).

## Impact

- **Código**: solo `apps/admin/src/` (features `catalog/` nuevos con pages/components/services/models, `shared/api/api-client.service.ts`, `shared/components/ui/` con table/modal/alert, `shared/layout/app-sidebar/`, `app.routes.ts`, `app-navigation.ts`).
- **Backend**: sin cambios. Los endpoints consumidos ya existen y están verificados (Fase 2): CRUD completo de categories/subcategories/products con `RolesGuard`. Brecha documentada: no existe endpoint HTTP de uploads (el único código de Storage es el CLI `apps/backend/src/cli/migrate-imagenes/`).
- **Deuda conocida documentada (no se toca)**: `GET /quotes` admin-only mientras `editor` puede PATCH en cotizaciones — corresponde a `admin-panel-operations`.
- **Fuera de alcance**: uploads (`admin-uploads`, change de backend futuro), dashboard, cotizaciones/usuarios (`admin-panel-operations`), marcas (`marcas-page`), E2E, edición de perfil.
