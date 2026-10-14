# Design: admin-panel-content

## Contexto

- `apps/admin` es Angular 22 (standalone, signals, `OnPush`, control flow `@if`/`@for`), Tailwind v4 con tokens Riff en `@theme` (`globals.css`), Vitest + jsdom, ESLint. Foundation entregó: login real, shell TailAdmin adaptado, `/profile`, `authGuard` fail-closed, `authInterceptor` (Bearer + logout ante 401), `RoleService.hasRole()` y `ApiClientService` con envelope `{data, error, meta}`.
- El backend ya expone CRUD completo para `categories`, `subcategories` y `products` (verificado en Fase 2; ver tabla abajo). No se toca el backend en esta entrega.
- Componentes TailAdmin `ui/table`, `ui/modal`, `ui/alert` **no** fueron copiados en Foundation (su design D1 los reserva explícitamente para este change).
- Brecha verificada: **no existe endpoint HTTP de uploads** — el único código de Storage es el CLI `apps/backend/src/cli/migrate-imagenes/`. Las imágenes de producto se gestionan como data `{url, storagePath, alt, orden}` (galería) y `{url, storagePath, nombreArchivo}` (ficha técnica).
- `ApiClientService.unwrap()` (`shared/api/api-client.service.ts:83-96`) devuelve solo `envelope.data` y descarta `meta`; el listado de productos entrega la paginación en `meta {page, limit, total}` (contrato `api-products-pagination`).
- Deuda heredada: `POST_LOGIN_REDIRECT = '/profile'` está duplicado en `app.routes.ts:15` y `app-navigation.ts:9`.
- Contrato de respuesta: envelope `{data, error, meta}`; errores 4xx con `{error: {message, code}}` que `ApiClientService` normaliza a `ApiError{status, code}`.

## Objetivos / No-Objetivos

**Objetivos:**

- CRUD completo en la UI de productos, categorías y subcategorías (listado + formulario + eliminación con confirmación), consumiendo exclusivamente los endpoints existentes.
- Listado de productos con paginación, búsqueda y filtro server-side y total visible desde `meta.total`.
- Visibilidad por rol (ocultar Crear/Eliminar a `editor`) y banners inline de éxito; errores 409/validación por campo.
- Infra reutilizable: `getWithMeta`, `ui/table`/`ui/modal`/`ui/alert` adaptadas a tokens, servicios y modelos por dominio, rutas y sidebar.

**Non-Goals:**

- Uploads de archivos (sin endpoint backend; dominio pendiente `admin-uploads` en un change de backend futuro).
- Dashboard (diferido; el redirect raíz va a `/products`).
- Cotizaciones y usuarios (`admin-panel-operations`), marcas (`marcas-page`), edición de perfil, E2E, cualquier cambio de backend (incluida la deuda `GET /quotes` admin-only vs editor con PATCH — solo documentada en el proposal).

## Decisiones

### D1 — Extensión de `ApiClientService` con `getWithMeta`

`unwrap()` descarta `meta` (`api-client.service.ts:83-96`), pero el listado de productos requiere `meta.total` para el contador (y `meta.page/limit` para los controles). Se añade un método que expone ambos sin romper la API actual:

```ts
getWithMeta<T>(path: string): Observable<{ data: T; meta: Record<string, unknown> | null }>
```

Misma extracción de URL/errores que `request()`; solo cambia el paso final de unwrap (devuelve `{data, meta}`). *Alternativa descartada*: devolver el envelope crudo (`ApiEnvelope<T>`) — expone `error` ya normalizado dos veces y acopla a los servicios a la forma del wire; y duplicar lógica HTTP en el servicio de productos — rompería la única fuente de manejo de errores/401.

### D2 — Estructura de features: un módulo `features/catalog/` con servicios por dominio

Siguiendo D7 de Foundation (`features/<modulo>/{pages/, components/, <modulo>.service.ts, models.ts}`), se crea **un** módulo `features/catalog/` (los tres dominios comparten UI, patrones y referencias cruzadas — cascada categoría→subcategoría) con:

- `models.ts`: tipos espejo del backend (`Categoria`, `Subcategoria`, `Producto`, `GaleriaItem`, `FichaTecnica`, `Precio`, `Stock`, `Atributo` + payloads de create/update). Copia por workspace — **no** se importa desde `apps/web` (monorepo sin package compartido; duplicación deliberada, misma práctica que `CategoriaApi` en `apps/web/src/lib/api/categories.ts`).
- `product.service.ts`, `categoria.service.ts`, `subcategoria.service.ts`: inyectan `ApiClientService` y devuelven `Observable<T>` (patrón `features/profile/profile.service.ts`).

*Alternativa descartada*: módulos separados `features/products/` + `features/categories/` — duplicarían el servicio de subcategorías necesario en ambos (la cascada del form de producto y el listado anidado del detalle de categoría).

### D3 — Método de actualización: `PATCH`

El backend acepta `PUT` y `PATCH` indistintamente para los tres dominios; se usa **`PATCH`** en toda la UI porque es el único permitido al rol `editor` (requisito de visibilidad) y evita dos rutas de código para lo mismo.

### D4 — Extracción y adaptación de TailAdmin: `ui/table`, `ui/modal`, `ui/alert`

Mismo método que Foundation D1: copiar los archivos del template (https://github.com/TailAdmin/free-angular-tailwind-dashboard) en `apps/admin/src/app/shared/components/ui/{table,modal,alert}/`, adaptando: paletas `brand-*`/`gray-*` → utilities de `@theme` Riff; eliminar `rounded*`, `shadow*` y variantes `dark:` (flat design, light-only); sin CSS del template. `ui/modal` se usa para confirmaciones de borrado (focus trapped, cierre con Esc/cancelar); `ui/alert` para banners inline de éxito/error (variantes success/error); `ui/table` como base de los tres listados (con slots para acciones por fila).

### D5 — Banners inline: estado de navegación, no URL

El mensaje de éxito post-guardar/post-eliminar viaja en el `state` de la navegación de Angular Router (`Router.navigate(..., { state: { flash: 'created' | 'updated' | 'deleted' } })`), leído por la página destino en `ngOnInit` para mostrar el banner una sola vez. *Alternativa descartada*: query param (`?flash=created`) — el banner reaparecería en cada recarga (F5), contradiciendo el requerimiento. El texto exacto del banner es responsabilidad de la página destino (español, genérico por operación).

### D6 — Búsqueda de categorías en cliente

El backend de `GET /categories` solo soporta `?activa`; no existe `?search`. El buscador de la página `/categories` filtra en cliente sobre el arreglo cargado. Para el listado y selects se pide la lista **completa** (sin `?activa`): el admin necesita ver también categorías/subcategorías inactivas (verificado en Fase 2: sin filtro el backend devuelve todas).

### D7 — Cascada categoría → subcategoría en el formulario de producto

Al cambiar `categoriaId`, el servicio de subcategorías emite `GET /subcategories?categoriaId=<id>` y el select se repobla; si había `subcategoriaId` seleccionado se limpia (evita referencias inválidas; el backend valida consistencia y respondería 404 «Parent category not found»/regla de negocio). En el formulario de subcategoría el `categoriaId` **no** es editable: viene del parámetro `:id` de la ruta.

### D8 — Routing y unificación del redirect

- Rutas hijas del shell (orden: literales antes que `:id`): `products`, `products/new`, `products/:id`, `categories`, `categories/new`, `categories/:id`, `categories/:id/subcategories/new`, `categories/:id/subcategories/:subId`, todas lazy (`loadComponent`) y cubiertas por el `canActivate: [authGuard]` del padre. Sin `roleGuard` por ruta (el editor necesita acceso de lectura/edición; el ocultamiento de acciones cubre el control).
- `POST_LOGIN_REDIRECT` pasa a ser `/products` y queda con **una única definición** en `app-navigation.ts`, importada por `app.routes.ts` (elimina la duplicación `app.routes.ts:15` / `app-navigation.ts:9`).
- La página de detalle de categoría (`/categories/:id`) compone el formulario de la categoría + la lista de subcategorías anidadas (una sola carga de `GET /categories/:id` + `GET /subcategories?categoriaId=`).

### D9 — Errores del backend → mensajes de campo

Mapeo determinista de `ApiError` a campos (los mensajes del backend son estables, verificados en Fase 2):

| `ApiError.message` (backend) | Campo destino | Mensaje UI (español) |
| --- | --- | --- |
| `SKU already in use` | `sku` (producto) | «El SKU ya está en uso.» |
| `Slug already in use` | `slug` (categoría/producto) | «El slug ya está en uso.» |
| `Slug already in use within this category` | `slug` (subcategoría) | «El slug ya está en uso dentro de esta categoría.» |
| `Cannot delete the default category` | banner error (lista) | «No se puede eliminar la categoría por defecto.» |
| `Cannot delete a category with associated products` | banner error (lista) | «No se puede eliminar: la categoría tiene productos asociados.» |
| `Cannot delete a subcategoria with associated products` | banner error (lista) | «No se puede eliminar: la subcategoría tiene productos asociados.» |

Cualquier otro 4xx/5xx se muestra como banner de error con el `message` del backend (o texto genérico). Los errores de validación cliente siguen el patrón `login-page.component.ts` (touched + invalid → `border-error` + `text-error` por campo; botón de guardar deshabilitado con el form inválido).

### D10 — Sidebar

Se amplía `navItems` (`app-sidebar.component.ts:35-37`) con los ítems en el orden Productos → Categorías → Perfil, iconos SVG inline (misma técnica que `USER_ICON`: string SVG + `SafeHtmlPipe`), trazos coherentes con el estilo existente y sin assets nuevos.

### D11 — Visibilidad por rol centralizada en `admin-role-access`

El requirement de ocultamiento de acciones (principio D6 de Foundation: ocultar, no deshabilitar) vive en la capability `admin-role-access` (delta ADDED), no en `admin-catalog-crud`: es una regla transversal de la UI que `admin-panel-operations` reutilizará para cotizaciones/usuarios sin acoplarse a una capability de catálogo. `admin-catalog-crud` describe qué acciones existen y qué hacen; `admin-role-access` gobierna quién las ve (analogía backend: controladores vs `RolesGuard`).

## Endpoints consumidos ↔ Requirements

Fuente de verdad de los contratos: `docs/api/api-spec.yml` + controladores (`apps/backend/src/*/infrastructure/*.controller.ts`). Auth: `FirebaseAuthGuard` + `RolesGuard` (`@Roles`); lecturas públicas de catálogo (el admin las consume con Bearer vía interceptor para obtener proyección completa).

| Endpoint (bajo `/api/v1`) | Uso en la UI | Roles backend | Requirement |
| --- | --- | --- | --- |
| `GET /products?page&limit&search&categoriaId` | Listado paginado + buscador + filtro | público (anónimo=card; Bearer=full) | Listado de productos con paginación y total server-side; Búsqueda y filtro de productos server-side |
| `GET /products/:id` | Precarga del formulario de edición | público (Bearer=full) | Formulario de producto en página dedicada |
| `POST /products` | Crear producto (guardar) | superadmin, admin | Formulario de producto en página dedicada; Visibilidad por rol (`admin-role-access`) |
| `PATCH /products/:id` | Editar producto (guardar) | superadmin, admin, editor | Formulario de producto en página dedicada; Visibilidad por rol (`admin-role-access`) |
| `DELETE /products/:id` | Eliminar producto (modal) | superadmin, admin | Acciones del listado de productos; Visibilidad por rol (`admin-role-access`) |
| `GET /categories` (sin filtro) | Listado, fuente del filtro de productos y de la cascada | público | CRUD de categorías; Búsqueda y filtro de productos server-side; Formulario de producto (cascada) |
| `GET /categories/:id` | Precarga del detalle de categoría | público | CRUD de categorías |
| `POST /categories` | Crear categoría | superadmin, admin | CRUD de categorías; Visibilidad por rol (`admin-role-access`) |
| `PATCH /categories/:id` | Editar categoría | superadmin, admin, editor | CRUD de categorías; Visibilidad por rol (`admin-role-access`) |
| `DELETE /categories/:id` | Eliminar categoría (modal) | superadmin, admin | CRUD de categorías; Visibilidad por rol (`admin-role-access`) |
| `GET /subcategories?categoriaId=` | Lista anidada del detalle + cascada del form de producto | público | Subcategorías anidadas en el detalle de categoría; Formulario de producto (cascada) |
| `POST /subcategories` | Crear subcategoría (`categoriaId` de la ruta) | superadmin, admin | Subcategorías anidadas; Visibilidad por rol (`admin-role-access`) |
| `PATCH /subcategories/:id` | Editar subcategoría | superadmin, admin, editor | Subcategorías anidadas; Visibilidad por rol (`admin-role-access`) |
| `DELETE /subcategories/:id` | Eliminar subcategoría (modal) | superadmin, admin | Subcategorías anidadas; Visibilidad por rol (`admin-role-access`) |

No consumidos (y por qué): `GET /products/slug/:slug` (el admin navega por id), `GET /categories?activa=`/`GET /subcategories?activa=` (se listan también las inactivas), `PUT /{domain}/:id` (se usa `PATCH`, D3), `sortBy/sortDir` de productos (sin requerimiento de orden por columna en este change), y todos los endpoints de quotes/users/contacts (otros changes).

> Los requirements citados sin calificar viven en `admin-catalog-crud`; «Visibilidad por rol» vive en `admin-role-access` (D11).

## Riesgos / Trade-offs

- [El modal de confirmación o la tabla adaptados pierden accesibilidad del template] → Verificar focus trap/Esc en `ui/modal` y semántica de tabla en los tests de componente (los tests de estilos existentes de admin no tocan componentes, mismo supuesto verificado en Foundation).
- [`meta` con forma inesperada (sin `total`)] → `getWithMeta` tipa `meta` como `Record<string, unknown> | null`; el contador se muestra únicamente si `meta.total` es numérico; si no lo es, el contador NO se renderiza (decisión cerrada: sin valor de respaldo; la tabla sigue renderizando con normalidad).
- [Duplicación de tipos admin ↔ backend] → Aceptada por workspace (misma práctica que `apps/web`); los DTOs del backend están cubiertos por tests del backend. Cualquier deriva se detecta en verificación manual contra staging.
- [Editor intenta crear/eliminar vía devtools] → El backend ya lo rechaza (403 por `RolesGuard`); la UI oculta las acciones (D6) pero no es la barrera de seguridad — el backend lo es.
- [`descripcionLarga` es HTML en producción] → Se edita como texto plano en el textarea (sin editor WYSIWYG en este change); el render seguro lo resuelve el sitio público (spec `product-description-html`).
- [Banner por `state` de Router se pierde si la página destino redirige dos veces] → El flash se lee solo en la página de listado destino inmediata; en el flujo normal (form → listado) hay un solo salto. Cubierto por test de componente.

## Plan de despliegue

1. Build del admin en Coolify (pipeline existente, `admin.somosriff.cl`); sin cambios de variables de entorno (reutiliza `FIREBASE_*` + `API_BASE_URL`).
2. Rollback = revert del deploy (sin migraciones ni cambios de datos).

## Preguntas abiertas

- Ninguna bloqueante. Nota menor registrada: el buscador de categorías filtra en cliente (D6) porque el backend no expone `?search` para ese dominio — comportamiento ya fijado en la spec del change.
