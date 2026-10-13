# Design: Fix CSS del admin en build Docker (plugin PostCSS/Tailwind en la imagen)

## Context

El admin de staging (`https://admin-staging.somosriff.cl/`) carga sin estilos.
Diagnóstico confirmado empíricamente (dos iteraciones):

- **Síntoma**: el CSS desplegado desde la imagen Docker contiene las
  directivas de Tailwind **en crudo** (`@theme`, `@source`, `@layer`,
  `@font-face`) y no tiene utilidades. Es decir: **Tailwind no se está
  ejecutando** durante el build Docker.
- **Causa raíz confirmada**: `apps/admin/.postcssrc.json` declara el plugin
  `@tailwindcss/postcss` y existe en local, pero el `Dockerfile` del admin
  **no lo copia a la imagen**. Sin ese archivo en el working directory de la
  app, Angular CLI no configura PostCSS, el plugin de Tailwind nunca procesa
  `globals.css` y las directivas se emiten tal cual. En local funciona porque
  el archivo sí está junto a `angular.json`.
- **Hipótesis previa descartada**: la primera iteración atribuyó el bug a la
  detección automática de fuentes de Tailwind basada en la raíz git (`.git/`
  excluido por `.dockerignore`). Era insuficiente: la verificación se hizo
  solo por tamaño de archivo (11 KB → 50 KB) sin comprobar utilidades, y el
  CSS resultante seguía conteniendo directivas en crudo. El tamaño creció por
  el CSS de @fontsource + tokens, no porque Tailwind hubiera corrido.
- **Fix 1 (ya aplicado, se mantiene)**: directiva explícita
  `@source "../**/*.{html,ts}"` en `apps/admin/src/styles/globals.css:21`,
  justo después de `@import "tailwindcss";`. Es correcto y necesario: cuando
  el plugin sí corre, sustituye la heurística de detección automática por un
  escaneo explícito de los fuentes del admin. Sin el plugin, no tiene efecto.
- **Fix 2 (esta corrección)**: copiar `.postcssrc.json` a la imagen:

  ```
  COPY apps/admin/.postcssrc.json ./apps/admin/
  ```

  Verificación definitiva por **contenido** (no solo tamaño):

  ```
  docker build -f apps/admin/Dockerfile \
    --build-arg FIREBASE_API_KEY=test \
    --build-arg FIREBASE_AUTH_DOMAIN=test.firebaseapp.com \
    --build-arg FIREBASE_PROJECT_ID=test \
    --build-arg FIREBASE_APP_ID=test \
    --build-arg API_BASE_URL=http://localhost:3000/api/v1 \
    -t riff-admin:debug .
  docker run --rm --entrypoint sh riff-admin:debug -c \
    "grep -c '\\.flex\\|\\.grid\\|\\.bg-primary' /usr/share/nginx/html/*.css"
  # Esperado: conteo > 0, sin directivas en crudo, ~50 KB
  ```

- **Impacto en cambios archivados**: este bug bloquea 5.2, 6.1 y 6.2 de
  `backend-staging-deploy` (tasks.md con nota "BLOQUEADA" y su verification.md
  sección 5 "Estado bloqueado") y 7.5 de `deploy-docker-hardening`
  (verification.md sección 6 "Pendiente post-merge").

## Goals / Non-Goals

**Goals:**

- Corregir el build Docker del admin para que PostCSS/Tailwind se ejecuten:
  copiar `.postcssrc.json` a la imagen (única pieza que faltaba).
- Documentar la causa raíz real con la evidencia empírica (directivas en
  crudo, verificación por contenido) y dejar registro de la hipótesis previa
  descartada.
- Dejar trazado el camino de despliegue (Coolify) y verificación end-to-end
  (login real contra el backend de staging) como acciones del operador.
- Cerrar las tareas bloqueadas de los dos changes archivados, con resultado,
  fecha y ejecutor, **solo tras confirmación del usuario**.

**Non-Goals:**

- No tocar el `@source` de `globals.css` (sigue siendo correcto y necesario).
- No tocar otros Dockerfiles (backend, web), `.dockerignore`, nginx, configs
  de Angular/Tailwind ni gates de CI.
- No cambiar requisitos de specs existentes ni producir deltas de specs
  (`skip_specs: true`; el CSS correcto ya es el comportamiento especificado
  del admin, no un requisito nuevo).
- No desplegar ni verificar en este repo: el despliegue en Coolify y el login
  son acciones del operador (usuario).

## Decisions

- **D1 — `@source` explícito en `globals.css`** (aplicado, se mantiene):
  declarar las rutas de escaneo en el CSS en lugar de confiar en la detección
  automática. Necesario pero insuficiente: solo tiene efecto cuando el plugin
  de Tailwind corre.
- **D2 — `COPY` de `.postcssrc.json` en el Dockerfile** (esta corrección):
  añadir `COPY apps/admin/.postcssrc.json ./apps/admin/` junto a los demás
  COPY de configuración, antes de `COPY apps/admin/src`. Es la pieza que hace
  que Angular CLI ejecute PostCSS con el plugin `@tailwindcss/postcss`,
  garantizando paridad exacta entre el build local y el de Docker.
  - Alternativas descartadas: inline de la config PostCSS en `angular.json`
    (duplicaría la config y divergería del setup local); `RUN echo` del JSON
    dentro del Dockerfile (frágil, duplica el archivo); declarar el plugin en
    el package.json (mecanismo no soportado por Angular CLI).
- **D3 — Verificación por contenido, no por tamaño**: la verificación previa
  (peso del CSS) resultó insuficiente y enmascaró el bug. La verificación
  definitiva comprueba utilidades presentes (`.flex`/`.grid`/`.bg-primary`),
  ausencia de directivas en crudo (`@theme`/`@source` no deben aparecer en el
  CSS compilado) y tamaño ~50 KB.
- **D4 — Cierre de tareas bloqueadas condicionado a verificación manual**: las
  tareas 5.2/6.1/6.2 (`backend-staging-deploy`) y 7.5
  (`deploy-docker-hardening`) solo se marcan `[x]` cuando el usuario confirme
  el checklist del bloque 3 (login real, `/auth/me` → 200, header
  `Authorization: Bearer`). La verificación no es replicable desde el repo
  (requiere navegador + credenciales), así que la confirmación del operador es
  la única fuente de verdad.

## Risks / Trade-offs

- [Coolify redespliega con caché de capas y sirve el CSS viejo] → verificar el
  CSS servido en `https://admin-staging.somosriff.cl/` tras el redeploy; si
  sigue en crudo, relanzar el build con `--no-cache` (mismo protocolo de
  contingencia del change `deploy-docker-hardening`).
- [`@source` duplica implícitamente el layout de carpetas de `apps/admin`] →
  el patrón `../**/*.{html,ts}` es relativo al propio CSS y estable ante
  reorganizaciones menores; si se moviera `src/`, el build lo evidenciaría
  inmediatamente (mismo síntoma, diagnóstico directo).
- [`.postcssrc.json` se renombra/mueve a futuro y el build Docker vuelve a
  perder el plugin en silencio] → mitigado por la verificación por contenido
  (D3, tarea 1.4) y por el gate `make docker-build` de CI que compila el
  admin en cada pipeline; `.dockerignore` no excluye el archivo (verificado).
- [Cierre prematuro de tareas bloqueadas sin verificación real] → mitigado por
  restricción explícita: bloque 4 ejecutado solo tras confirmación del usuario
  del checklist de verification.md (bloque 3).
- [El login end-to-end falla por causas ajenas al CSS (credenciales, Firebase
  project, CORS)] → fuera del alcance de este change: el backend ya está
  verificado (`/health` ok, `/auth/me` → 401 sin token, CORS del admin OK en
  el verification.md de `backend-staging-deploy`); si apareciera un fallo
  nuevo, se trataría en un change aparte.

## Migration Plan

1. Commit del fix (Dockerfile + artefactos del change) y PR — el usuario hace
   commit y PR; no se commitea desde el apply.
2. Merge de la rama → Coolify detecta el push en `riff-admin-staging` y
   redespliega (acción del operador).
3. Verificación visual de estilos en `https://admin-staging.somosriff.cl/`
   (operador).
4. Checklist end-to-end de verification.md: login con
   `soporte@gabrielzavando.cl` → `/profile`, `/auth/me` → 200 en Network tab,
   header `Authorization: Bearer` presente (operador).
5. Con la confirmación del operador: marcar tareas bloqueadas en los tasks.md
   de los changes archivados y actualizar sus verification.md con resultado,
   fecha y ejecutor.
6. Rollback: revertir el COPY del Dockerfile (una línea); si el redeploy
   fallara, Coolify permite relanzar el build con `--no-cache` o volver al
   despliegue anterior desde su historial.

## Open Questions

- Ninguna pendiente de decisión técnica. Único dependencia externa: la
  confirmación del operador tras ejecutar el checklist de verification.md
  (bloques 2-3) para habilitar el cierre del bloque 4.
