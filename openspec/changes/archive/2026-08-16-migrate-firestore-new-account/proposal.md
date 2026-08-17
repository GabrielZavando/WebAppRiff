## Why

El proyecto Riff debe migrarse desde su cuenta Firebase actual a una cuenta nueva
con un `projectId` distinto. "Migrar la base de datos" en esta arquitectura abarca
cuatro subsistemas acoplados: Firestore (datos), Firebase Auth (usuarios + roles),
Firebase Storage (blobs) y Reglas/Índices. La migración debe preservar la
integridad referencial del catálogo (IDs de documento) y dejar la nueva cuenta con
reglas e índices versionados como código en el repo.

## What Changes

- Se crea un script de migración (Admin SDK) que copia `categorias`,
  `subcategorias`, `productos` y `cotizaciones` preservando los IDs de documento.
- Se excluye la colección `usuarios` del script; el superadmin se recrea en
  destino con el comando `bootstrap:superadmin` (sus IDs = UID de Auth viejo).
- Se migran los blobs de Storage (imágenes de galería / fichas PDF) de forma
  **condicional** (pre-check del bucket origen), reescribiendo `url`/`storagePath`.
- Se versionan en el repo `firebase.json`, `firestore.rules` (lockdown de cliente) y
  `firestore.indexes.json` (vacío a propósito: los repos usan filtros de igualdad + sort
  en memoria, sin índices compuestos) y se despliegan con Firebase CLI.
- **BREAKING (entorno/credenciales)**: el backend y el panel admin apuntarán a un
  `projectId` nuevo. Se actualizan las variables de entorno del backend (Coolify)
  y la config de Firebase del panel Angular.

## Capabilities

### New Capabilities
- `firestore-migration`: Script y proceso para copiar las colecciones del catálogo
  entre proyectos Firebase preservando IDs, idempotente, excluyendo `usuarios` y con
  copia condicional de Storage y modo `--dry-run`.
- `firebase-infra-config`: Reglas de seguridad Firestore (lockdown de cliente) y
  configuración de índices como código en el repo (vacía: sin compuestos) desplegable vía Firebase CLI.

### Modified Capabilities
<!-- Ninguna capacidad existente cambia a nivel de requisito; es tooling operativo aditivo. -->

## Impact

- **Backend**: nuevas variables `SOURCE_FIREBASE_*`; cambio de
  `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` en Coolify
  (staging/prod).
- **Panel admin (Angular)**: actualización de config de Firebase (`apiKey`,
  `authDomain`, `projectId`, `storageBucket`, `appId`).
- **Nuevos archivos**: `apps/backend/firebase.json`, `apps/backend/firestore.rules`,
  `apps/backend/firestore.indexes.json`, `apps/backend/scripts/migrate-firestore.ts`.
- **Firebase**: nuevo proyecto con Firestore/Auth/Storage habilitados, dominios
  autorizados, Service Account con rol adecuado.
- **Sitio Astro (web)**: sin cambios de Firebase; requiere rebuild para refrescar el
  catálogo desde el backend ya apuntando a la nueva cuenta.
