# Tasks: admin-tailwind-docker-fix

> Estructura en 4 bloques. Los bloques 2 y 3 son acciones del operador
> (Coolify + navegador); el bloque 4 (cierre de changes archivados) se ejecuta
> **solo tras la confirmación del operador** de la verificación del bloque 3.

## 1. Fix del CSS en Docker (ya aplicado)

- [x] 1.1 Añadir `@source "../**/*.{html,ts}"` en `apps/admin/src/styles/globals.css` justo después de `@import "tailwindcss";` — **ya aplicado** (línea 21), no re-implementar
- [x] 1.2 Verificar con `docker build` local (`docker build -f apps/admin/Dockerfile -t riff-admin:ci --build-arg FIREBASE_API_KEY=... --build-arg FIREBASE_AUTH_DOMAIN=... --build-arg FIREBASE_PROJECT_ID=... --build-arg FIREBASE_APP_ID=... --build-arg API_BASE_URL=<url>/api/v1 .`) que el CSS de la imagen pasa de ~11 KB a ~50 KB con utilidades — **verificado**

## 2. Despliegue (operador)

- [ ] 2.1 En Coolify, redesplegar `riff-admin-staging` con la rama del fix merged (si el CSS servido siguiera sin utilidades por caché de capas, relanzar el build con `--no-cache`)
- [ ] 2.2 Verificar en `https://admin-staging.somosriff.cl/` que los estilos se ven correctamente (tokens, tipografías y utilidades aplicadas en login y panel)

## 3. Verificación end-to-end (operador)

- [ ] 3.1 Ejecutar el checklist completo de `verification.md`: login con `soporte@gabrielzavando.cl` → redirección a `/profile`; `/auth/me` → 200 desde el navegador (Network tab); header `Authorization: Bearer` presente en las peticiones al backend
- [ ] 3.2 Confirmar al aplicador el resultado del checklist (habilita el bloque 4)

## 4. Cierre de tareas bloqueadas (tras confirmación del bloque 3)

- [ ] 4.1 Marcar 5.2 en `openspec/changes/archive/2026-10-13-backend-staging-deploy/tasks.md`
- [ ] 4.2 Marcar 6.1 en `openspec/changes/archive/2026-10-13-backend-staging-deploy/tasks.md`
- [ ] 4.3 Marcar 6.2 en `openspec/changes/archive/2026-10-13-backend-staging-deploy/tasks.md`
- [ ] 4.4 Marcar 7.5 en `openspec/changes/archive/2026-10-12-deploy-docker-hardening/tasks.md`
- [ ] 4.5 Actualizar `verification.md` de `2026-10-13-backend-staging-deploy`: resultado del login real, resultado del `/auth/me` 200, fecha y ejecutor (sustituir la sección 5 "Estado bloqueado" por la evidencia)
- [ ] 4.6 Actualizar `verification.md` de `2026-10-12-deploy-docker-hardening`: resultado del login real, resultado del `/auth/me` 200, fecha y ejecutor (cerrar la sección 6 "Pendiente post-merge")
