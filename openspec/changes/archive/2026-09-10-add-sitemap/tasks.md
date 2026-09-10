# Tasks — Add Sitemap

> Capa: infraestructura (deps + config) del sitio público. Sugerencias de ruta bajo la
> raíz de `apps/web` (`.specboot.json` services = `["."]` → servicio único `apps/web`).
> Arquitectura colindante: ASTRO SSG; alinea con `docs/frontend-standards.md` (Astro SEO).

## 1. Dependencia `@astrojs/sitemap`

- [x] 1.1 [SC-206] Escribir test de contrato (RED) que afirma `@astrojs/sitemap` declarado en `apps/web/package.json` y `sitemap()` en `astro.config.mjs`. Suggested Path: `apps/web/src/config/__tests__/sitemap-config.test.ts` · Test Path: `apps/web/src/config/__tests__/sitemap-config.test.ts`.
- [x] 1.2 [SC-206] Añadir `@astrojs/sitemap@^3.7.4` a `apps/web/package.json` e instalarlo (compatible con `astro 7.1.6`, sin peer range). Suggested Path: `apps/web/package.json` · Test Path: `apps/web/src/config/__tests__/sitemap-config.test.ts`.
- [x] 1.3 Ejecutar los tests del módulo de config (RED→GREEN). Suggested Path: `apps/web/src/config/__tests__/*` · Test Path: `apps/web/src/config/__tests__/*`.

## 2. Integración `sitemap()`

- [x] 2.1 [SC-206] Añadir `sitemap()` al array `integrations` de `astro.config.mjs`. Suggested Path: `apps/web/astro.config.mjs` · Test Path: `apps/web/src/config/__tests__/sitemap-config.test.ts`.
- [x] 2.2 Ejecutar `vitest` del módulo (integración + validación prod). Suggested Path: `apps/web/src/config/__tests__/*` · Test Path: `apps/web/src/config/__tests__/*`.

## 3. Validación del contrato de dominio canónico

- [x] 3.1 [SC-203][SC-206] Añadir test que valida que en producción el `site`/`SITE_URL` no queda en `localhost`. Implementado en `sitemap-config.test.ts` (co-localizado con los tests del change y donde se lee `astro.config.mjs`, la fuente del contrato `site`); sigue el patrón de lectura de archivo de `env-example.test.ts`. Suggested Path: `apps/web/src/config/__tests__/sitemap-config.test.ts` · Test Path: `apps/web/src/config/__tests__/sitemap-config.test.ts`.
- [x] 3.2 Ejecutar la suite de config completa. Suggested Path: `apps/web/src/config/__tests__/*` · Test Path: `apps/web/src/config/__tests__/*`.

## 4. Verificación del build y de los artefactos

- [x] 4.1 [SC-201][SC-202][SC-203] Ejecutar `astro build` con `SITE_URL=https://somosriff.cl` y comprobar `dist/sitemap-index.xml` + `dist/sitemap-0.xml` y que los slugs de productos aparecen con `<loc>` absolutos (sin localhost). Suggested Path: `apps/web/dist/` · Test Path: `apps/web/src/config/__tests__/*`.
- [x] 4.2 [SC-204] Confirmar que `apps/web/nginx.conf` sirve el XML vía `try_files` sin cambio. Suggested Path: `apps/web/nginx.conf` · Test Path: no aplica.

## 5. Cierre e integridad

- [x] 5.1 `openspec validate add-sitemap`. Suggested Path: no aplica · Test Path: no aplica.
- [x] 5.2 `bash check-refs.sh` → 0 errores. Suggested Path: no aplica · Test Path: no aplica.
- [x] 5.3 `bash specboot.sh --ci` → 0 errores. Suggested Path: no aplica · Test Path: no aplica.

## Mandatory Steps

### Pre-implementación

- [x] La rama activa sigue la convención vigente del proyecto (ej. `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama principal.
- [x] Estado git limpio: sin cambios sin commitear (ni staged) antes de empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] Test nuevo que falla antes de implementar (RED): escribir el test del escenario (`SC-NNN`) y verificar que falla antes de escribir código de producción.
- [x] Ejecutar los tests unitarios del módulo tocado mientras se itera (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

- [x] Ejecutar `verify`: la verificación del change corre y produce evidencia persistente (`openspec/state/verify-results.json`).
- [x] Ejecutar `adversarial-review`: la auditoría adversarial corre y produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.