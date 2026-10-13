# Tasks: admin-tailwind-docker-fix

> Estructura en 4 bloques. Los bloques 2 y 3 son acciones del operador
> (Coolify + navegador); el bloque 4 (cierre de changes archivados) se ejecuta
> **solo tras la confirmación del operador** de la verificación del bloque 3.

## 1. Fix del CSS en Docker (plugin PostCSS en la imagen)

- [x] 1.1 Añadir `@source "../**/*.{html,ts}"` en `apps/admin/src/styles/globals.css` justo después de `@import "tailwindcss";` — **ya aplicado** (línea 21), no re-implementar; sigue siendo correcto y necesario (escaneo explícito cuando el plugin corre)
- [x] 1.2 Verificación previa con `docker build` local por tamaño de CSS (~50 KB) — **insuficiente**: no comprobaba utilidades (la causa real es la falta de `.postcssrc.json` en la imagen, ver 1.3); la verificación definitiva es 1.4
- [x] 1.3 Añadir `COPY apps/admin/.postcssrc.json ./apps/admin/` a `apps/admin/Dockerfile` junto a los demás COPY de configuración (antes de `COPY apps/admin/src`): sin ese archivo Angular CLI no ejecuta PostCSS y el plugin `@tailwindcss/postcss` no procesa `globals.css` (directivas `@theme`/`@source`/`@layer`/`@font-face` emitidas en crudo)
- [x] 1.4 Verificar con `docker build` local (`docker build -f apps/admin/Dockerfile -t riff-admin:debug --build-arg FIREBASE_API_KEY=test --build-arg FIREBASE_AUTH_DOMAIN=test.firebaseapp.com --build-arg FIREBASE_PROJECT_ID=test --build-arg FIREBASE_APP_ID=test --build-arg API_BASE_URL=http://localhost:3000/api/v1 .`) + `docker run` grep del bundle: utilidades presentes (`.flex`/`.grid`/`.bg-primary`), sin directivas en crudo (`@theme`/`@source` ausentes del CSS compilado) y tamaño ~50 KB

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
