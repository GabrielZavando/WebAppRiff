# Verification — admin-tailwind-docker-fix

> Checklist de verificación end-to-end del admin de staging. Los bloques 2-4
> se ejecutan con participación del operador; este documento se completa con
> la evidencia conforme avanza la verificación (resultado, fecha y ejecutor).
> El bloque 1 (fix + docker build local) ya está verificado — ver design.md.

## 1. Fix del CSS en Docker (completado — bloque 1)

- Fix aplicado: `@source "../**/*.{html,ts}"` en
  `apps/admin/src/styles/globals.css:21` (tras `@import "tailwindcss";`).
- Verificado con `docker build` local (contexto raíz del monorepo, mismos
  build args que Coolify): CSS en la imagen de ~11 KB (solo tokens +
  preflight, sin utilidades) → ~50 KB con utilidades.
- Estado: **completado** (no se re-ejecuta; evidencia en design.md).

## 2. Despliegue (pendiente — operador)

- [ ] Redespliegue de `riff-admin-staging` en Coolify con el fix merged.
- [ ] `https://admin-staging.somosriff.cl/` muestra los estilos correctamente
      (tokens, tipografías Montserrat/Open Sans y utilidades en login y panel).
- Resultado: _(pendiente)_
- Fecha / ejecutor: _(pendiente)_

## 3. Verificación end-to-end (pendiente — operador)

Checklist desde el navegador en `https://admin-staging.somosriff.cl/`:

- [ ] Login con `soporte@gabrielzavando.cl` redirige a `/profile`.
- [ ] `/auth/me` devuelve **200** desde el navegador (Network tab).
- [ ] Header `Authorization: Bearer` presente en las peticiones al backend
      (Network tab, pestaña Request Headers).
- Resultado: _(pendiente)_
- Fecha / ejecutor: _(pendiente)_

## 4. Cierre de tareas bloqueadas (pendiente — tras confirmar el bloque 3)

Una vez el operador confirme el checklist del bloque 3:

- [ ] Marcar 5.2, 6.1 y 6.2 en
      `openspec/changes/archive/2026-10-13-backend-staging-deploy/tasks.md`.
- [ ] Marcar 7.5 en
      `openspec/changes/archive/2026-10-12-deploy-docker-hardening/tasks.md`.
- [ ] Actualizar el `verification.md` de ambos changes con: resultado del
      login real, resultado del `/auth/me` 200, fecha y ejecutor.
- Resultado: _(pendiente)_
- Fecha / ejecutor: _(pendiente)_
