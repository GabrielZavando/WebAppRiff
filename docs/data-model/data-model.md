# Data Model

> Entidades reales del proyecto Riff Catálogo Digital Headless MVP (Fase 1).
> Fuente: `docs/source/Arquitectura-Catalogo-Digital-MVP.docx` (Sección 4).

## Entidades del dominio (Colecciones Firestore)

### 1. productos
Colección central del catálogo. Cada documento representa un producto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| idExterno | string \| null | Identificador externo editable, reservado para futuro ID de Defontana. |
| sku | string | Código de producto, editable, único, requerido. |
| titulo | string | Nombre del producto. |
| slug | string | URL amigable, autogenerada desde el título, editable y única. |
| descripcionBreve | string | Resumen corto para listados. **Texto plano**: el backend elimina todo HTML al guardar (sanitización en escritura vía `@riff/html-sanitize`). |
| descripcionLarga | string (HTML saneado) | Descripción completa (editor de texto enriquecido). **HTML saneado** en escritura con allowlist (p, br, strong, b, em, i, u, ul, ol, li, a, blockquote, h2-h4); sin scripts, styles ni handlers `on*`. |
| categoriaId | string | Referencia a `categorias`. Obligatoria (default: "sin-categoria"). |
| subcategoriaId | string \| null | Referencia a `subcategorias`. Opcional. |
| atributos | array<{nombre: string, valor: string}> | Especificaciones técnicas de longitud libre (ej. Fluido, Diámetro, Presión Nominal). |
| precio.valor | number | Precio en pesos chilenos (CLP), sin decimales. |
| precio.visible | boolean | Controla si el precio se muestra públicamente. |
| stock.disponible | boolean | Disponibilidad del producto. En uso desde Fase 1. |
| stock.cantidad | number \| null | Cantidad numérica. Reservado para sincronización futura con Defontana. |
| galeria | array<{url, storagePath, alt, orden}> | Hasta 10 imágenes. La primera del array es la imagen principal. |
| fichaTecnica | {url, storagePath, nombreArchivo} \| null | PDF descargable con la ficha técnica del producto. |
| destacado | boolean | Permite construir listados de productos destacados sin recorrer atributos. |
| publicado | boolean | Controla la visibilidad del producto en el sitio público. |
| creadoEn | timestamp | Trazabilidad de creación. |
| actualizadoEn | timestamp | Trazabilidad de última edición. |

**Nota de diseño**: Los campos que requieren filtrarse u ordenarse (`destacado`, `publicado`, `categoriaId`) se modelan como campos de primer nivel, indexables por Firestore. El array `atributos` se reserva exclusivamente para datos descriptivos que solo se muestran en la ficha del producto, no para datos que el sistema necesite consultar.

**Política de saneo de descripciones**: `descripcionLarga` y `descripcionBreve` se sanea en escritura (create/update) en el backend vía el paquete compartido `@riff/html-sanitize` (allowlist de tags, sin `script`/`style`/`on*`, decodificación de entidades doblemente escapadas). `descripcionLarga` se guarda como HTML permitido; `descripcionBreve` se guarda como texto plano (sin tags). El sitio público (Astro) reaplica el mismo saneo en tiempo de build como defensa en profundidad. Los documentos existentes se normalizan con `npm run migrate:descriptions` (idempotente, con `--dry-run`).

### 2. categorias

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre visible de la categoría. |
| slug | string | URL amigable, única de forma global. |
| orden | number | Orden de despliegue en menús y filtros. |
| activa | boolean | Permite ocultar la categoría sin eliminarla. |
| esDefault | boolean | `true` únicamente en la categoría "Sin categoría". Protegida contra borrado. |
| creadoEn | timestamp | Trazabilidad. |
| actualizadoEn | timestamp | Trazabilidad. |

El documento "Sin categoría" se crea con identificador fijo (`sin-categoria`) en lugar de uno autogenerado, para que el backend pueda referenciarlo de forma confiable como constante.

### 3. subcategorias

| Campo | Tipo | Descripción |
|-------|------|-------------|
| categoriaId | string | Referencia obligatoria a la categoría padre. |
| nombre | string | Nombre visible de la subcategoría. |
| slug | string | URL amigable, única dentro de su categoría padre (no global). |
| orden | number | Orden de despliegue. |
| activa | boolean | Permite ocultar la subcategoría sin eliminarla. |
| creadoEn | timestamp | Trazabilidad. |
| actualizadoEn | timestamp | Trazabilidad. |

### 4. usuarios
El identificador del documento corresponde directamente al UID de Firebase Auth del usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre del usuario. |
| email | string | Correo asociado a la cuenta de Firebase Auth. |
| rol | "superadmin" \| "admin" \| "editor" | Nivel de acceso del usuario. |
| activo | boolean | Permite desactivar una cuenta sin eliminarla. |
| creadoPor | string | UID del usuario que creó esta cuenta, para trazabilidad. |
| creadoEn | timestamp | Trazabilidad. |
| actualizadoEn | timestamp | Trazabilidad. |

### 5. cotizaciones
Captura de solicitudes de cotización desde el sitio público (formulario sin auth).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre del solicitante. |
| email | string | Email de contacto. |
| telefono | string | Teléfono (opcional). |
| nombre_empresa | string | Nombre de la empresa. |
| mensaje | string | Mensaje / detalle de la cotización. |
| estado | "pendiente" \| "atendida" | Estado de gestión por el admin. Default: "pendiente". |
| creadoEn | timestamp | Fecha de creación. |

## Relaciones

```
categorias 1--N subcategorias
categorias 1--N productos
subcategorias 1--N productos
usuarios 1--N productos (creadoPor trazabilidad)
usuarios 1--N usuarios (creadoPor trazabilidad)
productos --N cotizaciones (NO referenciado directamente en MVP; cotización es formulario libre)
```

## Reglas de negocio del dominio

> Reglas que el agente debe respetar al generar código (implementadas como validaciones en NestJS, no en Firestore):

- **Unicidad**: SKU y slug de producto son únicos globalmente. Slug de subcategoría es único dentro de su categoría padre (compuesto: categoriaId + slug).
- **Consistencia categoría/subcategoría**: Si un producto tiene `subcategoriaId`, ésta debe pertenecer a la `categoriaId` indicada.
- **Categoría por defecto**: Todo producto debe tener categoría; si no se especifica, se asigna automáticamente "sin-categoria" (id fijo, esDefault: true, protegida contra borrado).
- **Galería de imágenes**: Máximo 10 elementos por producto (validado en frontend y backend).
- **Ficha técnica**: Solo PDF (`application/pdf`), tamaño máximo configurable, subido a Firebase Storage.
- **Borrado protegido**: No se puede eliminar una categoría o subcategoría que tenga productos asociados. La categoría "sin-categoria" nunca se puede eliminar.
- **Roles y permisos**:
  - Superadmin: CRUD total + gestión de todos los usuarios (crear admin/editor, cambiar roles, desactivar)
  - Admin: CRUD catálogo + crear usuarios editor + desactivar editors
  - Editor: CRUD catálogo solamente
  - Regla: Un admin no puede desactivarse a sí mismo ni a otro admin. El sistema nunca puede quedar sin al menos un superadmin activo.
- **Custom Claims**: El rol vive en Firestore como fuente de verdad. Al crear/modificar usuario, NestJS sincroniza el rol como Custom Claim en Firebase Auth. Autorización en cada request se resuelve leyendo el claim del token verificado (sin consultar Firestore).
- **ID interno vs externo**: El ID de documento Firestore es inmutable y técnico. `idExterno` en productos es editable e independiente del SKU, reservado para futura vinculación con Defontana.

## Convenciones de nombres (Firestore)

- Colecciones: plural, camelCase (`productos`, `categorias`, `subcategorias`, `usuarios`, `cotizaciones`)
- Documentos: ID autogenerado por Firestore, excepto `categorias/sin-categoria` (id fijo)
- Campos: camelCase (`categoriaId`, `subcategoriaId`, `precio.valor`, `stock.disponible`, `creadoEn`, `actualizadoEn`)
- Timestamps: `creadoEn` y `actualizadoEn` (Firestore server timestamps)
- Subcolecciones: no se usan en MVP (referencias por ID en campos de primer nivel)

## Modelo de dominio

- Decisión del proyecto: **modelo anémico** — las entidades (interfaces TypeScript en `domain/`) solo transportan datos y mapean documentos Firestore; la lógica de negocio vive en Domain/Application Services (patrón típico NestJS).
- Los "decoradores" de Firestore (tipos de datos, conversión timestamps) **no deben mezclarse con validación de negocio compleja** en la misma clase; la validación va en el Service o en value objects dedicados.
- Repositories en `infrastructure/` implementan interfaces de `domain/` (ej. `IProductRepository`) usando Firebase Admin SDK.

## Índices compuestos (Firestore)

Los listados públicos de productos filtran por `publicado` y ordenan por `creadoEn DESC`. Para soportar los escenarios de listado sin escaneos completos, se declaran los siguientes índices compuestos en la colección `productos`:

| Índice | Campos | Uso |
|--------|--------|-----|
| 1 | `publicado` ASC + `creadoEn` DESC | Listado general de productos publicados |
| 2 | `publicado` ASC + `categoriaId` ASC + `creadoEn` DESC | Filtrado por categoría |
| 3 | `publicado` ASC + `subcategoriaId` ASC + `creadoEn` DESC | Filtrado por subcategoría |
| 4 | `publicado` ASC + `destacado` ASC + `creadoEn` DESC | Listado de productos destacados |

Los índices se declaran en `apps/backend/firestore.indexes.json` y se despliegan con `firebase deploy`.

### Conteo con `count()` aggregation

El campo `meta.total` de la respuesta de paginación se obtiene mediante `count()` de Firestore (aggregation query), **sin** `orderBy` ni `limit`. Ejemplo:

```ts
const snapshot = await collection.where('publicado', '==', true).count().get();
const total = snapshot.data().count;
```

Esto evita escanear documentos innecesariamente; el conteo es una operación optimizada en Firestore que no depende del orden de los resultados.

### Tradeoff: paginación por offset

La paginación por offset (`skip = (page - 1) * limit`, `limit`) tiene un costo conocido en Firestore: **cada documento saltado se carga y descarta** (se paga una lectura por documento escaneado hasta el offset). Esto impacta el rendimiento en páginas profundas (ej. página 50 de 24 items = 1176 documentos cargados).

Alternativas viables si el volumen lo exige en el futuro:

- **Cursor-based pagination** (empezar desde el último documento de la página anterior) — evita el escaneo de documentos saltados.
- **Resolución en memoria**: para `search` y `sortBy` en campos no indexados (`titulo`, `precio.valor`, `actualizadoEn`), el backend realiza un fetch completo del subconjunto filtrado, ordena y pagina en memoria. Esto es aceptable en MVP porque el catálogo es pequeño (~miles de productos, no millones).

En MVP se usa offset por simplicidad. El camino en memoria para búsqueda y sort alternativo mitiga el costo al trabajar sobre el conjunto ya filtrado.
