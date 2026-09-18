# Tasks — configure-social-links

## Mandatory Steps

> **Rol de este documento**: es la **fuente única de verdad** del checklist
> obligatorio de implementación del ciclo SDD. El skill `plan-change` **inyecta
> su contenido** como sección `## Mandatory Steps` en todo `tasks.md` generado,
> leyéndolo en el momento de generación, de modo que la checklist viaja dentro
> del artefacto que el agente `build` ejecuta. Editar aquí actualiza todo
> `tasks.md` generado después; no duplicar esta lista dentro de skills ni
> agentes.

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de
implementación ejecutada vía `/apply`, tanto en el propio framework Specboot
(dogfooding) como en cualquier proyecto consumidor.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.

---

## 1. Environment & Configuration

- [x] 1.1 Actualizar `apps/web/.env.example` y el archivo local `apps/web/.env` con las tres URLs oficiales (Facebook, Instagram, LinkedIn) y `SOCIAL_X_URL` vacío
  - **Prioridad**: Alta
  - **Capa**: infrastructure/configuration
  - **Estimación**: XS
  - **Suggested Path**: `apps/web/.env.example`
  - **Test Path**: `apps/web/src/lib/config/__tests__/contact.test.ts`
  - **Subtareas**:
    - Incorporar `SOCIAL_FACEBOOK_URL=https://www.facebook.com/share/1DL9drgCDU/?mibextid=wwXIfr`
    - Incorporar `SOCIAL_INSTAGRAM_URL=https://www.instagram.com/somosriff.cl?igsi=MTU2YXhqaThoNnFydA%3D%3D&utm_source=qr`
    - Incorporar `SOCIAL_LINKEDIN_URL=https://www.linkedin.com/company/100252590`
    - Dejar `SOCIAL_X_URL=` en blanco
    - Sincronizar los mismos valores en `apps/web/.env`

## 2. Unit Tests & Domain Verification

- [x] 2.1 Escribir/actualizar tests unitarios TDD en `contact.test.ts`, `TopHeader.test.ts`, `Footer.test.ts` y `ContactBar.test.ts` para verificar las tres redes oficiales y la ausencia de X
  - **Prioridad**: Alta
  - **Capa**: smart/dumb components & config
  - **Estimación**: S
  - **Suggested Path**: `apps/web/src/lib/config/contact.ts`
  - **Test Path**: `apps/web/src/lib/config/__tests__/contact.test.ts`
  - **Subtareas**:
    - Actualizar `contact.test.ts` con la expectativa de las 3 URLs oficiales y la omisión de X
    - Actualizar `TopHeader.test.ts` con la expectativa de Facebook, Instagram, LinkedIn y sin icono/enlace de X
    - Actualizar `Footer.test.ts` para verificar que el footer renderiza únicamente las 3 redes oficiales
    - Verificar/actualizar `ContactBar.test.ts` para confirmar la fuente compartida en `/contacto`
    - Actualizar el snapshot de `TopHeader` y `Footer` si aplica

## 3. E2E Tests & Playwright Setup

- [x] 3.1 Actualizar `playwright.config.ts` y `top-header.spec.ts` para reflejar la presencia de Facebook, Instagram y LinkedIn sin la red X
  - **Prioridad**: Media
  - **Capa**: testing/e2e
  - **Estimación**: XS
  - **Suggested Path**: `apps/web/playwright.config.ts`
  - **Test Path**: `apps/web/e2e/top-header.spec.ts`
  - **Subtareas**:
    - Modificar las variables inyectadas en `playwright.config.ts` para usar las tres URLs oficiales y `SOCIAL_X_URL: ''`
    - Actualizar `top-header.spec.ts` para asertar la visibilidad de Facebook, Instagram y LinkedIn, y la ausencia de X

## 4. Deploy Documentation

- [x] 4.1 Documentar las variables de entorno sociales como variables de build para Astro SSG en Coolify dentro de `docs/deploy-standards.md`
  - **Prioridad**: Media
  - **Capa**: docs
  - **Estimación**: XS
  - **Suggested Path**: `docs/deploy-standards.md`
  - **Test Path**: no aplica
  - **Subtareas**:
    - Agregar `SOCIAL_FACEBOOK_URL`, `SOCIAL_INSTAGRAM_URL`, `SOCIAL_LINKEDIN_URL` y `SOCIAL_X_URL` a la tabla de variables de entorno
    - Documentar que son públicas, se inyectan en build time en Coolify y requieren redeploy para actualizar el HTML estático
