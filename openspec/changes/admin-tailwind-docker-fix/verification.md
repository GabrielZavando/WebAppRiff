# Verification — admin-tailwind-docker-fix

> Checklist de verificación end-to-end del admin de staging. Los bloques 2-4
> se ejecutan con participación del operador; este documento se completa con
> la evidencia conforme avanza la verificación (resultado, fecha y ejecutor).
> El bloque 1 (fixes + docker build local) se verifica por contenido — ver
> design.md.

## 1. Fix del CSS en Docker (bloque 1)

- Fix 1 aplicado: `@source "../**/*.{html,ts}"` en
  `apps/admin/src/styles/globals.css:21` (tras `@import "tailwindcss";`).
  Se mantiene: escaneo explícito necesario cuando el plugin corre.
- Fix 2 (causa raíz real): `COPY apps/admin/.postcssrc.json ./apps/admin/` en
  `apps/admin/Dockerfile` — sin ese archivo Angular CLI no ejecuta PostCSS y
  el plugin `@tailwindcss/postcss` no procesa `globals.css` (directivas en
  crudo en el CSS desplegado).
- Verificación previa por tamaño (~11 KB → ~50 KB) resultó **insuficiente**;
  la verificación definitiva (tarea 1.4) comprueba contenido: utilidades
  presentes, sin directivas en crudo.
- Estado: **completado** (2026-10-13, build local del aplicador):
  `docker build -f apps/admin/Dockerfile -t riff-admin:debug ...` →
  BUILD_EXIT=0; bundle `/usr/share/nginx/html/styles-SUHRPZBT.css` de
  49 249 bytes (~48 KB); utilidades presentes (`.flex{`, `.bg-primary{`,
  `.bg-primary-100{`); sin directivas en crudo (`@theme`/`@source`: 0
  coincidencias en el CSS compilado). El `@source` de globals.css no se tocó.

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
