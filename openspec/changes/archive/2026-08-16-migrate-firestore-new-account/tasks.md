# Tasks — Migración a nueva cuenta Firebase

## 1. Preparación de la cuenta destino

- [ ] 1.1 Crear nuevo proyecto Firebase (nuevo `projectId`)
- [ ] 1.2 Habilitar Firestore, Authentication (proveedor Email/Password) y Storage
- [ ] 1.3 Crear Service Account con rol Firestore Admin + Storage Admin y descargar JSON
- [ ] 1.4 Agregar dominios autorizados en Auth: `riff.cl`, `admin.riff.cl`, `localhost`
- [ ] 1.5 Obtener config web del nuevo proyecto (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `appId`)

## 2. Infraestructura como código en repo

- [x] 2.1 Crear `apps/backend/firebase.json` referenciando `firestore.rules` e `indexes`
- [x] 2.2 Crear `apps/backend/firestore.rules` con lockdown (deny all cliente)
- [x] 2.3 Crear `apps/backend/firestore.indexes.json` (vacío a propósito: los repos usan filtros de igualdad + sort en memoria, sin índices compuestos)
- [x] 2.4 Test: validar JSON de reglas/índices y que el lockdown deniega acceso cliente

## 3. Script de migración

- [x] 3.1 Crear `apps/backend/src/cli/migrate/` (use-case + adaptador Firebase) y `src/cli/migrate-firestore.ts` (Admin SDK dual SOURCE/DEST) + script npm `migrate:firestore`
- [x] 3.2 Migrar `categorias`, `subcategorias`, `productos`, `cotizaciones` preservando IDs
- [x] 3.3 Excluir `usuarios`; omitir docs existentes en destino (idempotente)
- [x] 3.4 Copia condicional de Storage con rewrite de `url`/`storagePath` (solo si hay blobs en origen)
- [x] 3.5 Modo `--dry-run` (solo conteos y reporte, sin escrituras)
   - [x] 3.6 Reporte de conteos por colección (read/written/skipped). La existencia de `categorias/sin-categoria` y la unicidad `sku`/`slug` ya se confirmaron manualmente en la console destino; se siguen validando en smoke tests (Fase 6). (Requerimiento automático de validación post-copia removido del spec: datos ya migrados y confirmados.)
   - [x] 3.7 Test unitario con Firestores mockeados (mapeo, exclusión `usuarios`, rewrite Storage) — 4/4 pass
   - Nota: el requisito "Post-migration integrity validation" se removió del spec (opción 2 acordada): los datos ya están migrados y confirmados en destino, por lo que la validación automática post-copia no aporta valor.

## 4. Ejecución en STAGING

- [x] 4.1 Configurar credenciales: origen vía `apps/backend/.env`, destino vía `.migration-secrets.json`
- [x] 4.2 `migrate:firestore --dry-run` y revisar reporte
- [x] 4.3 `migrate:firestore` (copia real: 5 categorias, 24 subcategorias, 70 productos, 0 cotizaciones; usuarios excluida)
- [ ] 4.4 (opcional/diferido) `firebase deploy --only firestore` contra destino: no es estrictamente necesario porque un proyecto Firestore nuevo viene bloqueado por defecto; las reglas ya están como código versionado en Fase 2.
- [x] 4.5 Verificar conteos y existencia de `categorias/sin-categoria` en destino (confirmado por el usuario en console: 5 categorías, 24 subcategorías, 70 productos)

## 5. Configuración de entornos

- [ ] 5.1 Backend (Coolify): actualizar `FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY`
- [ ] 5.2 (diferida) Config de Firebase del admin: el panel hoy es solo un shell sin auth implementada (no usa `@angular/fire` aún), así que no hay nada que actualizar. Se hará al construir el login del admin, apuntando al nuevo `projectId`. Ver explicación en la conversación.
- [ ] 5.3 Astro web: reconstruir para refrescar catálogo desde backend destino

## 6. Bootstrap y smoke tests

- [x] 6.1 `bootstrap:superadmin` contra destino (ejecutado por el usuario)
- [ ] 6.2 Smoke: `/health` (firebase up), listado productos/categorías, login admin, crear producto (+ imagen si aplica)

## 7. Promoción a PRODUCCIÓN y cutover

- [ ] 7.1 Repetir Fases 4–6 en producción
- [ ] 7.2 Rollback documentado: revertir env vars a cuenta origen (migración es por copia)
- [ ] 7.3 Mantener proyecto origen intacto hasta confirmar producción verde
