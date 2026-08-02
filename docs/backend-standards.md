# Backend Standards

> Personalizar este archivo con el stack backend real del proyecto.

## API Development

- RESTful o GraphQL según arquitectura del proyecto
- Versioning explícito en la URL: `/api/v1/`
- Respuestas consistentes: `{ data, error, meta }`
- HTTP status codes correctos (200, 201, 400, 401, 403, 404, 422, 500)
- Validación de inputs en la capa de presentación
- Nunca exponer stacktraces en producción

## Base de datos

- Migraciones versionadas y reversibles
- Nunca modificar migraciones ya ejecutadas en producción
- Índices en campos usados en WHERE frecuentes
- Transacciones para operaciones multi-tabla
- Nombres de tablas en plural, snake_case, inglés

## Testing backend

- Unit tests para lógica de dominio y servicios
- Integration tests para repositorios y adapters
- E2E tests para flujos críticos de negocio
- Mocks solo para servicios externos (no para el propio código)
- Cobertura mínima: 90%

## Seguridad

- Nunca loguear datos sensibles (passwords, tokens, PII)
- Sanitizar todos los inputs antes de persistir
- Rate limiting en endpoints públicos
- CORS configurado explícitamente
- Variables de entorno para credenciales, nunca hardcodeadas

## Logging y errores

- Structured logging (JSON) con nivel: debug/info/warn/error
- Errors con contexto: qué ocurrió, dónde, con qué datos
- Health check endpoint: `/health`

## Principios de Diseño — Backend (NestJS)

### Estructura de carpetas obligatoria por módulo de negocio

```
<module>/
  domain/            # entidades, value objects, interfaces de puertos (ej. IUserRepository)
  application/       # casos de uso / services que orquestan lógica de negocio
  infrastructure/    # implementaciones concretas: repositories con TypeORM/Prisma, controllers, adapters HTTP
```

- **Regla dura:** ningún archivo dentro de `domain/` o `application/` puede importar un paquete de infraestructura (TypeORM, Prisma, Mongoose, `@nestjs/axios`, clientes HTTP, SDKs externos). Toda dependencia externa se declara como interfaz en `domain/` y se inyecta desde `infrastructure/` vía el sistema de DI de NestJS (`@Inject(TOKEN)`).
  - Ejemplo de violación: un Service en `application/` que hace `import { Repository } from 'typeorm'` directamente, o un constructor que hace `new TypeOrmRepository(...)` en vez de recibirlo inyectado por token.

### SRP (Single Responsibility)

- Una clase decorada con `@Injectable()` tiene una única razón de cambio. Si un service hace acceso a datos + valida reglas de negocio + formatea la respuesta HTTP, se separa en al menos tres piezas: **Repository** (acceso a datos), **Domain/Application Service** (reglas de negocio), **Mapper/Presenter** (formato de salida).
  - Ejemplo de violación: un `UserService` que además de guardar el usuario en DB contiene la lógica de "si el email es corporativo aplicar descuento" y arma el DTO de respuesta con `pick`/`omit` por cada endpoint.

### OCP (Open/Closed)

- Nuevas variantes de comportamiento (ej. distintos métodos de pago, distintos proveedores de notificación) se implementan como **Strategy inyectada por token** (`@Inject('PAYMENT_STRATEGY')`), nunca agregando una nueva rama `if/else` o `switch` a un método ya cubierto por tests existentes.
  - Ejemplo de violación: un `processPayment(method: 'card' | 'paypal' | 'transfer')` con `switch` que crece cada vez que se agrega un medio de pago, rompiendo los tests del method anterior.

### LSP (Liskov Substitution)

- Toda clase que implemente una interfaz de dominio (ej. `IUserRepository`) debe pasar la misma suite de tests de contrato. Estos tests de contrato viven en un archivo compartido `*.contract.spec.ts` que se ejecuta contra cada implementación.
  - Ejemplo de violación: un `MockUserRepository` que implementa `findAll`/`save` pero lanza `NotImplemented` en `findByIds`, rompiendo la sustitución en cualquier Service que dependa de `IUserRepository`.

### ISP (Interface Segregation)

- Las interfaces de puertos (`domain/*.port.ts` o `domain/*.interface.ts`) **no deben superar 5 métodos**. Si un consumidor concreto solo necesita 1-2 métodos de una interfaz de 8, se divide en interfaces más pequeñas y específicas.
  - Ejemplo de violación: una interfaz `INotificationRepository` con 8 métodos (`save`, `findAll`, `findByUser`, `markRead`, `markUnread`, `delete`, `archive`, `countUnread`) cuando el Service que envía emails solo usa `save` y `findByUser`.

### DIP (Dependency Inversion)

- Ya cubierto arriba en la regla de estructura de carpetas — es la regla central de este documento. Refuerzo: **las capas superiores (domain, application) nunca dependen de las inferiores (infrastructure); las inferiores dependen de las abstracciones definidas arriba**.
  - Ejemplo de violación: un Caso de Uso en `application/` que importa `import { UserEntity } from '../infrastructure/database/user.entity'` en vez de depender de una interfaz `domain/user.entity.ts`.

### Umbrales objetivos (medibles por linters en CI, definidos en un ticket posterior)

- Máximo **300 líneas** por archivo de clase.
- Complejidad ciclomática máxima de **10 por método**.
- Máximo **3 parámetros por constructor** (si un constructor necesita más de 3 dependencias inyectadas, es señal de que la clase probablemente viola SRP y debe dividirse).
- Profundidad de herencia máxima: **2 niveles** (preferir composición sobre herencia salvo justificación explícita en el código).

## Stack específico del proyecto

> Reemplazar con el stack real:

```
Runtime: Node.js 20 / PHP 8.2 / Python 3.11
Framework: Express / Laravel / FastAPI
ORM: Prisma / Eloquent / SQLAlchemy
Base de datos: PostgreSQL / MySQL
Cache: Redis
Tests: Jest / PHPUnit / pytest
```

> Cuando se active el stack Python/Django + LangChain/LangGraph/LangSmith, ver
> ticket de implementación separado para `docs/backend-standards-python.md`. No
> crear ese archivo todavía — se documentará cuando el primer proyecto Python
> arranque.
