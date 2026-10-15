# Tasks: admin-panel-content

> TDD en todo el change: cada tarea de código va precedida de su test fallido
> (Vitest + jsdom, patrón de `features/auth/login/login-page.component.test.ts`).
> Referencias: design.md (D1–D11) y specs/ (admin-catalog-crud, admin-app-shell,
> admin-login, admin-role-access).

## 1. Infraestructura de transporte y UI compartida

- [x] 1.1 Test fallido + implementación de `getWithMeta<T>(path)` en `ApiClientService` que devuelva `{ data, meta }` sin romper `get/post/put/patch/delete` (design D1; verificación del descarte de `meta` en `unwrap` actual).
- [x] 1.2 Extraer `ui/alert` de TailAdmin a `shared/components/ui/alert/` y adaptarla a tokens Riff (variantes success/error, flat design, sin `rounded*`/`shadow*`/`dark:`); test de render por variante.
- [x] 1.3 Extraer `ui/modal` de TailAdmin a `shared/components/ui/modal/` y adaptarla (confirmación de borrado: focus trap, cierre con Esc/cancelar); tests de confirmar/cancelar/Esc.
- [x] 1.4 Extraer `ui/table` de TailAdmin a `shared/components/ui/table/` y adaptarla (base de los tres listados, slot para acciones por fila, estado vacío); test de render con filas y vacío.

## 2. Rutas, redirect y sidebar

- [x] 2.1 Test fallido: `POST_LOGIN_REDIRECT` definido una sola vez en `app-navigation.ts` con valor `/products` e importado por `app.routes.ts` (elimina la duplicación en `app.routes.ts:15`).
- [x] 2.2 Test fallido + registro de las rutas hijas lazy bajo el shell en el orden del design D8 (`products`, `products/new`, `products/:id`, `categories`, `categories/new`, `categories/:id`, `categories/:id/subcategories/new`, `categories/:id/subcategories/:subId`), literales antes que `:id`, con `authGuard` heredado del padre.
- [x] 2.3 Test fallido + ampliación de `navItems` del sidebar: Productos, Categorías, Perfil en ese orden, con iconos SVG inline coherentes (patrón `USER_ICON` + `SafeHtmlPipe`); test de orden y de ítem activo.

## 3. Modelos y servicios de dominio

- [x] 3.1 Crear `features/catalog/models.ts` con los tipos espejo del backend: `Categoria`, `Subcategoria`, `Producto`, `ProductoCard`, `Atributo`, `GaleriaItem`, `FichaTecnica`, `Precio`, `Stock` y payloads `*Create`/`*Update` (design D2); test de tipos vía compilación y de payload de ejemplo.
- [x] 3.2 Test fallido + `categoria.service.ts`: `findAll()`, `findById(id)`, `create`, `update` (PATCH), `remove` sobre el patrón de `profile.service.ts`; assertions de método y URL.
- [x] 3.3 Test fallido + `subcategoria.service.ts`: `findByCategoria(categoriaId)` (`GET /subcategories?categoriaId=`), `create`, `update` (PATCH), `remove`.
- [x] 3.4 Test fallido + `product.service.ts`: `findAll(params)` con query `page/limit/search/categoriaId` usando `getWithMeta` (devuelve `{ items, meta }`), `findById`, `create`, `update` (PATCH), `remove`.

## 4. CRUD de categorías (establece los patrones de página)

- [x] 4.1 Test fallido + página `/categories`: tabla (nombre, slug, orden, activa), buscador client-side, estado vacío, banner de error ante fallo de carga (specs: CRUD de categorías; Listado).
- [x] 4.2 Test fallido + acciones del listado: «Añadir categoría» → `/categories/new`, «Editar» → `/categories/:id`, «Eliminar» con `ui/modal` → DELETE → permanencia en `/categories` con banner de éxito; 409 de delete (default / con productos) → banner de error en español (design D9).
- [x] 4.3 Test fallido + formulario `/categories/new` y `/categories/:id` (nombre obligatorio, slug, orden, activa; precarga por id en edición; POST/PATCH; volver al listado con banner; breadcrumb).
- [x] 4.4 Test fallido + mapeo 409 → campo: «Slug already in use» marca el campo `slug` con mensaje en español (design D9; patrón touched+invalid de `login-page.component.ts`).

## 5. Subcategorías anidadas

- [x] 5.1 Test fallido + composición de `/categories/:id`: formulario de la categoría + lista de subcategorías (`GET /subcategories?categoriaId=`) con acciones Editar/Eliminar y «Añadir subcategoría».
- [x] 5.2 Test fallido + formulario `/categories/:id/subcategories/new` y `.../:subId`: nombre obligatorio, slug, orden, activa; `categoriaId` desde la ruta (sin selector); POST/PATCH; volver a `/categories/:id` con banner y lista refrescada.
- [x] 5.3 Test fallido + manejo de errores de subcategoría: 409 «Slug already in use within this category» → campo `slug`; 409 de delete con productos → banner de error.

## 6. Listado y formulario de productos

- [x] 6.1 Test fallido + página `/products` con `ui/table`: columnas título (con SKU), categoría, precio, stock, publicado, destacado, acciones; estado vacío; banner de error ante fallo.
- [x] 6.2 Test fallido + contador total sobre la tabla leído de `meta.total` («N productos en total»); sin contador cuando `meta.total` no es numérico (sin valor de respaldo; spec: Listado de productos con paginación y total server-side).
- [x] 6.3 Test fallido + paginación server-side (controles prev/next, `page/limit` default 24) y reset a página 1 al cambiar búsqueda/filtro.
- [x] 6.4 Test fallido + buscador server-side (`?search=`, debounce) y filtro por categoría server-side (`?categoriaId=` desde `GET /categories` completo, opción «Todas las categorías»), combinables entre sí.
- [x] 6.5 Test fallido + acciones del listado: «Añadir producto» → `/products/new`, «Editar» → `/products/:id`, «Eliminar» con modal → DELETE → banner de éxito sin salir de `/products`.
- [x] 6.6 Test fallido + formulario `/products/new` y `/products/:id`: sku/titulo obligatorios, slug, descripcionBreve/descripcionLarga (texto), precio {valor, visible}, stock {disponible, cantidad}, destacado, publicado; precarga en edición; POST/PATCH; breadcrumb y «Volver al listado».
- [x] 6.7 Test fallido + cascada categoría→subcategoría en el formulario (design D7): carga con `?categoriaId=`, limpieza de subcategoría al cambiar de categoría.
- [x] 6.8 Test fallido + edición de galería como data (filas {url, storagePath, alt, orden} con añadir/quitar) y ficha técnica {url, storagePath, nombreArchivo} opcional; sin `<input type="file">`.
- [x] 6.9 Test fallido + manejo de errores de producto: 409 «SKU already in use» → campo `sku`; 409 «Slug already in use» → campo `slug`; validación por campo y botón de guardar deshabilitado con form inválido.

## 7. Visibilidad por rol y notificaciones inline

- [x] 7.1 Test fallido + ocultamiento de acciones de creación y eliminación para rol `editor` en los tres listados y formularios (usando `RoleService.hasRole`; ocultar, no deshabilitar), manteniendo «Editar» visible (spec `admin-role-access`: Visibilidad por rol en las acciones de la UI).
- [x] 7.2 Test fallido + banners inline de éxito vía `state` del Router (design D5): post-guardar redirige al listado con banner; post-eliminar permanece con banner; el banner no reaparece al recargar; sin toasts.

## 8. Verificación final

- [x] 8.1 Cobertura de specs: recorrer `specs/admin-catalog-crud/spec.md` escenario por escenario y confirmar test o verificación manual que lo ejercita.
- [x] 8.2 `npm run lint && npm run typecheck && npm run test` en `apps/admin` en verde.
- [x] 8.3 `make ci` en verde (gate completo: openspec-validate + lint + typecheck + test + audit).
- [ ] 8.4 Verificación manual contra staging: flujo completo crear/editar/eliminar categoría, subcategoría y producto con usuario `admin` y con `editor` (validar ocultamiento y 403 del backend si se fuerza).
  - **Diferida parcialmente (2026-10-15):** flujo completo verificado con usuario `admin` contra staging (`riff-admin-staging`). La verificación con rol `editor` (ocultamiento de Crear/Eliminar, 403 al forzar) se difiere al change `admin-panel-operations`, que introduce la gestión de usuarios y permite crear un editor real. No bloquea el archive; se documenta como deuda.
- [x] 8.5 Confirmar que no existe ninguna petición a endpoints inexistentes (p. ej. uploads) en la pestaña Network de la verificación manual.
  - **Verificada (2026-10-15):** recorrido completo contra staging — login, `/auth/me`, listado de productos (con `?search` y `?categoriaId`), formulario de producto (categories + subcategories cascade), edición de producto, listado de categorías, formulario de categoría, subcategorías anidadas. Sin 404 por endpoints inexistentes. `meta.total` presente y correcto en listado de productos.
