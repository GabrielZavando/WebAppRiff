# Backend Standards

> Personalizado para el proyecto Riff Catálogo Digital Headless.

## API Development

- RESTful con versioning explícito en la URL: `/api/v1/`
- Respuestas consistentes: `{ data, error, meta }`
- HTTP status codes correctos (200, 201, 400, 401, 403, 404, 422, 500)
- Validación de inputs en la capa de presentación (DTOs + class-validator)
- Nunca exponer stacktraces en producción

## Base de datos (Firebase Firestore)

- **No hay migraciones tradicionales**: Firestore es schemaless; la integridad referencial y restricciones se implementan en NestJS (validaciones explícitas antes de cada escritura)
- Reglas de integridad gestionadas en backend (ver Reglas de integridad más abajo):
  - Unicidad de SKU y slug de producto (consulta previa antes de guardar)
  - Unicidad compuesta de slug de subcategoría (categoriaId + slug)
  - Consistencia categoría/subcategoría: si producto tiene subcategoriaId, debe pertenecer a la categoriaId indicada
  - Bloqueo de borrado de categorías/subcategorías en uso (productos asociados)
  - Categoría "Sin categoría" (esDefault: true, id fijo "sin-categoria") protegida contra borrado
- Índices en Firestore para campos de filtrado/orden frecuentes: `publicado`, `destacado`, `categoriaId`, `slug`
- Nombres de colecciones en plural, camelCase (Firestore convention): `productos`, `categorias`, `subcategorias`, `usuarios`, `cotizaciones`

## Testing backend

- Unit tests para lógica de dominio y servicios (Jest)
- Integration tests para repositorios (Firebase Admin SDK) y adapters
- E2E tests para flujos críticos de negocio
- Mocks solo para servicios externos (Firebase Auth/Storage/Admin SDK en tests unitarios)
- Cobertura mínima: 90%

## Seguridad

- Nunca loguear datos sensibles (passwords, tokens, PII)
- Sanitizar todos los inputs antes de persistir (class-validator + class-transformer)
- Rate limiting en endpoints públicos (ThrottlerModule)
- CORS configurado explícitamente para orígenes del frontend (Astro, Angular)
- Variables de entorno para credenciales Firebase, nunca hardcodeadas
- Autenticación: Firebase Auth JWT con Custom Claims (roles: superadmin, admin, editor) sincronizados desde NestJS vía Firebase Admin SDK
- Autorización: Guards basados en Custom Claims del token verificado (sin consultar Firestore en cada request)

## Logging y errores

- Structured logging (JSON) con nivel: debug/info/warn/error (NestJS Logger + Pino opcional)
- Errors con contexto: qué ocurrió, dónde, con qué datos
- Health check endpoint: `GET /health` (público, sin auth)

## Principios de Diseño — Backend (NestJS)

### Estructura de carpetas obligatoria por módulo de negocio

```
<module>/
  domain/            # entidades, value objects, interfaces de puertos (ej. IProductRepository)
  application/       # casos de uso / services que orquestan lógica de negocio
  infrastructure/    # implementaciones concretas: repositories con Firebase Admin SDK, controllers, adapters HTTP
```

- **Regla dura:** ningún archivo dentro de `domain/` o `application/` puede importar un paquete de infraestructura (Firebase Admin SDK, `@nestjs/axios`, clientes HTTP, SDKs externos). Toda dependencia externa se declara como interfaz en `domain/` y se inyecta desde `infrastructure/` vía el sistema de DI de NestJS (`@Inject(TOKEN)`).
  - Ejemplo de violación: un Service en `application/` que hace `import { Firestore } from 'firebase-admin/firestore'` directamente, o un constructor que hace `new FirestoreRepository(...)` en vez de recibirlo inyectado por token.

### SRP (Single Responsibility)

- Una clase decorada con `@Injectable()` tiene una única razón de cambio. Si un service hace acceso a datos + valida reglas de negocio + formatea la respuesta HTTP, se separa en al menos tres piezas: **Repository** (acceso a Firestore), **Domain/Application Service** (reglas de negocio), **Mapper/Presenter** (formato de salida).
  - Ejemplo de violación: un `ProductService` que además de guardar en Firestore contiene la lógica de "validar consistencia categoría/subcategoría" y arma el DTO de respuesta.

### OCP (Open/Closed)

- Nuevas variantes de comportamiento (ej. distintos proveedores de storage, notificaciones) se implementan como **Strategy inyectada por token** (`@Inject('STORAGE_STRATEGY')`), nunca agregando una nueva rama `if/else` o `switch` a un método ya cubierto por tests existentes.

### LSP (Liskov Substitution)

- Toda clase que implemente una interfaz de dominio (ej. `IProductRepository`) debe pasar la misma suite de tests de contrato. Estos tests de contrato viven en un archivo compartido `*.contract.spec.ts` que se ejecuta contra cada implementación.

### ISP (Interface Segregation)

- Las interfaces de puertos (`domain/*.port.ts` o `domain/*.interface.ts`) **no deben superar 5 métodos**. Si un consumidor concreto solo necesita 1-2 métodos de una interfaz de 8, se divide en interfaces más pequeñas y específicas.

### DIP (Dependency Inversion)

- Ya cubierto arriba en la regla de estructura de carpetas — es la regla central de este documento. Refuerzo: **las capas superiores (domain, application) nunca dependen de las inferiores (infrastructure); las inferiores dependen de las abstracciones definidas arriba**.

### Umbrales objetivos (medibles por linters en CI)

- Máximo **300 líneas** por archivo de clase.
- Complejidad ciclomática máxima de **10 por método**.
- Máximo **3 parámetros por constructor** (si un constructor necesita más de 3 dependencias inyectadas, es señal de que la clase probablemente viola SRP y debe dividirse).
- Profundidad de herencia máxima: **2 niveles** (preferir composición sobre herencia salvo justificación explícita en el código).

## Stack específico del proyecto

```
Runtime: Node.js 20
Framework: NestJS 10+
Base de datos: Firebase Firestore (via Firebase Admin SDK)
Storage: Firebase Storage
Auth: Firebase Auth (Custom Claims para roles)
Tests: Jest
Validación: class-validator + class-transformer
Rate limiting: @nestjs/throttler
```

## Reglas de integridad de datos gestionadas por el backend (Firestore no las impone nativamente)

Firestore no ofrece llaves foráneas ni integridad referencial nativa. Todas las reglas de consistencia del sistema se implementan como validaciones explícitas en NestJS antes de cada escritura:

- **SKU y slug de producto**: unicidad validada por consulta previa antes de guardar
- **Slug de subcategoría**: unicidad compuesta (categoriaId + slug), no global
- **Consistencia categoría/subcategoría**: si el producto tiene subcategoriaId, debe pertenecer a la categoriaId indicada
- **Galería de imágenes**: máximo 10 elementos, validado en frontend y backend
- **Ficha técnica PDF**: se valida tipo de archivo (application/pdf) y tamaño máximo antes de subir a Storage
- **Borrado de categorías y subcategorías**: bloqueado si existen productos asociados. La categoría "Sin categoría" (esDefault: true, id: "sin-categoria") no puede eliminarse bajo ninguna circunstancia
- **ID interno vs identificador externo (Defontana)**: El ID de documento en Firestore es inmutable y de uso exclusivamente técnico. Cada producto incluye un campo editable independiente `idExterno` para futura vinculación con Defontana.
