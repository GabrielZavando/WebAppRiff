## Why

El proyecto tiene servicios Firebase definidos para Firestore, Authentication y Storage, pero todavía no existe una decisión formal sobre dónde ejecutar el API NestJS ni una arquitectura de despliegue coherente para los tres consumidores/servicios. El workflow actual de deploy apunta a un `Dockerfile` inexistente en la raíz, solo contempla el backend y no representa el objetivo de ejecutar los frontends en Coolify. Esta decisión debe cerrarse antes de crear Dockerfiles, pipelines y configuración de entornos para evitar rehacer la infraestructura.

## What Changes

- Definir y documentar la arquitectura de despliegue objetivo:
  - Firebase gestionado para Firestore, Authentication, recuperación de contraseña y Storage.
  - VPS gestionado con Coolify para el sitio Astro y el panel Angular.
  - Ubicación de ejecución del API NestJS: Cloud Run como opción prioritaria a evaluar frente a un contenedor en Coolify; Cloud Functions queda como alternativa secundaria.
- Comparar Cloud Run y Coolify mediante criterios explícitos: compatibilidad con el Dockerfile actual, coste, cold starts, operación, escalabilidad, seguridad, latencia hacia Firebase y portabilidad.
- Seleccionar una opción para el API NestJS o dejar una decisión diferida con criterios y un límite claro para resolverla antes del despliegue.
- Definir los límites de responsabilidad de cada servicio, sus dependencias y el flujo de comunicación entre Astro, Angular, NestJS y Firebase.
- Actualizar la documentación de stack/deploy para que refleje la decisión y no contradiga el diseño objetivo.
- Establecer los requisitos que deberán cumplir los futuros Dockerfiles, variables de entorno, health checks, smoke tests, dominios, TLS, staging, producción y rollback.
- Identificar el reemplazo o rediseño necesario para el workflow de deploy actual, sin implementar todavía los Dockerfiles ni el pipeline completo.

## Capabilities

### New Capabilities

- `deployment-architecture`: Arquitectura documentada y aprobada para ejecutar el sitio Astro, el panel Angular y el API NestJS junto con los servicios gestionados de Firebase.

### Modified Capabilities

<!-- No se modifica todavía el comportamiento de una capacidad funcional existente. La implementación posterior podrá crear cambios separados para Dockerfiles, CI/CD y despliegue. -->

## Impact

- **Documentación**: `docs/project/stack.md`, `docs/deploy-standards.md` y documentación operativa relacionada.
- **Infraestructura**: `.github/workflows/deploy.yml`, `apps/backend/Dockerfile` y futuros Dockerfiles para `apps/web` y `apps/admin`.
- **Configuración**: contrato de variables de entorno, dominios, URLs públicas, secretos Firebase y webhook de rebuild Astro.
- **Operación**: Coolify/VPS, posible Google Cloud Run, Artifact Registry, health checks, smoke tests, staging, producción y rollback.
- **Aplicaciones**: no se cambia el comportamiento funcional del backend, sitio público ni panel en este ticket; se fijan las restricciones para cambios de infraestructura posteriores.
