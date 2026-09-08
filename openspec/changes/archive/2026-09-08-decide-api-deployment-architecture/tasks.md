## 1. Confirmar la decisión arquitectónica

- [x] 1.1 Revisar la comparación Cloud Run vs Coolify para NestJS y seleccionar una opción con responsable, región, presupuesto y fecha de decisión. *(Selección aprobada por el cliente 2026-09-08: Cloud Run. Región, responsable operativo y presupuesto quedan pendientes en los Open Questions de `design.md`.)*
- [x] 1.2 Confirmar que Firebase seguirá gestionando Firestore, Authentication, recuperación de contraseña y Storage.
- [x] 1.3 Definir los entornos staging/production, dominios, región, proyecto Firebase por entorno y estrategia de promoción. *(Aprobado 2026-09-08: región `southamerica-west1`; dominios `somosriff.cl` / `admin.somosriff.cl` / `api.somosriff.cl`; staging con proyecto Firebase separado `riff-catalogo-staging` y subdominios `staging.somosriff.cl` / `admin-staging.somosriff.cl`; promoción manual aprobada por Gabriel.)*
- [x] 1.4 Registrar la decisión aprobada y sus trade-offs en `docs/project/stack.md` y `docs/deploy-standards.md`.

## 2. Definir contratos entre servicios

- [x] 2.1 Documentar el mapa de servicios: Astro, Angular, NestJS, Firestore, Authentication, Storage y webhook de rebuild.
- [x] 2.2 Definir las URLs públicas por entorno para `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL` y `NESTJS_API_URL`. *(Contrato documentado en la tabla de Environment Variables de `docs/deploy-standards.md`; dominios aprobados 2026-09-08.)*
- [x] 2.3 Definir el contrato de secretos para Firebase Admin, webhook y cualquier credencial de registry o plataforma.
- [x] 2.4 Definir CORS, TLS, red interna/externa y reglas para impedir que secretos Firebase lleguen a los bundles frontend.
- [x] 2.5 Definir health checks, smoke tests, límites de recursos, timeouts, concurrencia y criterios de rollback.

## 3. Preparar la estrategia de despliegue

- [x] 3.1 Documentar el flujo de build y despliegue del API según el runtime seleccionado: Coolify build-in-situ o Artifact Registry + Cloud Run.
- [x] 3.2 Documentar el flujo de despliegue independiente del sitio Astro en Coolify.
- [x] 3.3 Documentar el flujo de despliegue independiente del panel Angular en Coolify.
- [x] 3.4 Definir tags/versiones de imagen y una referencia recuperable para rollback.
- [x] 3.5 Definir la promoción staging → production y bloquear la promoción si fallan health checks o smoke tests.

## 4. Revisar los artefactos de infraestructura existentes

- [x] 4.1 Identificar y documentar los cambios necesarios en `.github/workflows/deploy.yml` para eliminar la búsqueda incorrecta de `Dockerfile` en la raíz.
- [x] 4.2 Identificar los Dockerfiles multi-stage requeridos para `apps/web` y `apps/admin`, manteniendo contexto de build en la raíz del monorepo.
- [x] 4.3 Documentar la migración desde el flujo actual de SSH/docker manual al flujo aprobado de Coolify o Cloud Run.
- [x] 4.4 Confirmar que la estrategia no requiere modificar contratos REST, datos Firestore ni autenticación de usuarios.

## 5. Verificación y cierre

- [x] 5.1 Revisar consistencia entre `docs/project/stack.md`, `docs/deploy-standards.md`, `docs/project/domain.md` y la especificación `deployment-architecture`.
- [x] 5.2 Verificar que la arquitectura documentada cubre Firebase, Coolify/VPS, runtime NestJS, frontend, secretos, dominios y rollback.
- [x] 5.3 Obtener aprobación del responsable para iniciar el cambio posterior de Dockerfiles y pipelines. *(Aprobado por Gabriel el 2026-09-08: se autoriza abrir el change de Dockerfiles web/admin + pipeline CI/CD.)*
- [x] 5.4 Ejecutar `/verify` sobre este cambio documental y registrar la evidencia antes de archivarlo.
