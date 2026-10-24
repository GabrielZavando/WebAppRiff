# Tasks: fix-audit-vulnerabilities

## 1. Capturar el estado rojo (TDD — el gate como test fallido)

- [x] 1.1 Ejecutar `npm run audit` y confirmar que falla (código distinto de 0) con exactamente 2 bloqueantes: `body-parser` [high] y `zod` [high]
- [x] 1.2 Ejecutar `npm ls body-parser` y `npm ls zod` y registrar las copias vulnerables actuales (body-parser 2.3.0 en raíz; zod 4.6.5 en raíz y 4.6.6 en apps/admin) como línea base para la verificación posterior

## 2. Pins de seguridad en `package.json` raíz

- [x] 2.1 Añadir `"body-parser": "^2.4.0"` al bloque `overrides` del `package.json` raíz (sin tocar las 4 entradas existentes)
- [x] 2.2 Añadir `"zod": "^4.6.7"` al bloque `overrides` del `package.json` raíz

## 3. Regeneración del lockfile

- [x] 3.1 Ejecutar `npm install` para regenerar `package-lock.json` con los nuevos overrides
- [x] 3.2 Verificar con `npm ls body-parser` que el árbol resuelve una única copia en `2.4.0` y con `npm ls zod` que no quedan copias en `4.6.5` ni `4.6.6` (todo en `4.6.7`)
- [x] 3.3 Revisar `git diff package-lock.json` y confirmar que los cambios se concentran en body-parser, zod y sus transitivas (documentar cualquier dedupe colateral)

## 4. Verificación del gate (TDD — verde)

- [x] 4.1 Ejecutar `npm run audit` y confirmar código 0, sección `BLOCKING` vacía y sin `body-parser` ni `zod` en el resumen
- [x] 4.2 Confirmar que `npm-audit-suppressions.json` no gana entradas nuevas para `body-parser` ni `zod` y que las supresiones preexistentes (V1/Q2) siguen intactas
- [x] 4.3 Ejecutar `npm ci` desde cero y verificar que el árbol reproducido mantiene `body-parser@2.4.0` y `zod@4.6.7` (reproducibilidad del lockfile versionado)

## 5. No regresión

- [x] 5.1 Ejecutar `make lint` y `make typecheck` en verde
- [x] 5.2 Ejecutar `make test` en verde (incluye la suite de `scripts/audit.mjs`, que no debe requerir cambios)
- [x] 5.3 Ejecutar `npm run test:smoke` (smoke de api/web/admin) para validar runtime del backend con body-parser 2.4.0 y builds con zod 4.6.7. Nota: api 38/38 y web 107/107 en verde; admin 3/5 — los 2 fallos (SC-006 y el test de perfil autenticado) son PREEXISTENTES y ajenos a este change: esperan el redirect antiguo a `/profile`, pero `POST_LOGIN_REDIRECT = '/products'` desde `d7a60f9` (change `admin-panel-content`) y el e2e no se actualizó. El smoke no forma parte de `make ci`.

## 6. Cierre

- [x] 6.1 Versionar `package.json` y `package-lock.json` en un único commit convencional (`fix: pin body-parser and zod to patched versions`) y confirmar que el pipeline de CI pasa el paso `make audit`
