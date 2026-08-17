## Context

El backend NestJS (BFF) accede a Firestore/Auth/Storage con `firebase-admin` usando
tres variables de entorno (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`). El panel Angular solo usa `@angular/fire` para obtener el ID
token (auth); NO lee/escribe Firestore ni Storage por cliente. El sitio Astro (web)
no usa Firebase: consume el BFF vía `NESTJS_API_URL`.

Hoy no existen en el repo `firebase.json`, `firestore.rules` ni `firestore.indexes.json`;
reglas e índices presumiblemente se gestionan en la consola de la cuenta vieja. El
modelo de datos exige índices en `publicado`, `destacado`, `categoriaId`, `slug`.

La decisión acordada: nuevo `projectId`, migración solo de Firestore (excluyendo
`usuarios`), Auth solo vía bootstrap de superadmin, Storage condicional, y reglas/
índices versionados en el repo con despliegue por CLI.

## Goals / Non-Goals

**Goals:**
- Copiar Firestore preservando IDs de documento (sin romper `categoriaId`/`subcategoriaId`).
- Tener reglas e índices como código versionado (lockdown de cliente); el despliegue es
  opcional porque un proyecto Firestore nuevo ya viene bloqueado por defecto.
- Actualizar backend y panel admin para el nuevo `projectId`.
- Recrear el superadmin en destino.
- Migrar Storage solo si hay blobs, reescribiendo rutas.

**Non-Goals:**
- No migrar cuentas de Auth reales con contraseñas (solo bootstrap de superadmin).
- No migrar la colección `usuarios` (sus IDs = UID de Auth viejo inexistente).
- No cambiar la lógica de negocio ni los contratos de API (`docs/api-spec.yml`).

## Decisions

- **Script con Admin SDK dual**: `initializeApp` con dos apps nombradas (`SOURCE`,
  `DEST`) usando `SOURCE_FIREBASE_*` y `FIREBASE_*` respectivamente. Permite leer de
  origen y escribir a destino en un solo proceso, preservando IDs.
  - Alternativa descartada: exportación gestionada a GCS + import — no migra Auth ni
    Storage y requiere IAM entre proyectos; el script da control total y alineado con
    el estándar de DI del proyecto.
- **Exclusión de `usuarios`**: se omite para evitar documentos huérfanos (UID de Auth
  viejo); el superadmin se recrea con `bootstrap:superadmin`.
- **Reglas en lockdown**: `allow read, write: if false` — todo el acceso es vía Admin
  SDK del backend.
- **Storage condicional**: pre-check lista el bucket origen; si hay blobs referenciados
  se copian y se reescriben `url`/`storagePath`; si no, se omite con log.
- **Nuevo projectId**: cambian URLs de Storage, `authDomain` y config de frontend.
- **Índices**: NO se requieren índices compuestos. Los repos usan solo filtros de
  igualdad (`==`) y resuelven orden/búsqueda en memoria (`ProductoRepository.findAll`),
  por lo que Firestore usa sus índices automáticos de un campo. `firestore.indexes.json`
  queda vacío a propósito (`indexes: []`, `fieldOverrides: []`).
- **Dry-run + idempotencia**: el script soporta `--dry-run` y omite docs existentes
  (re-ejecutable).
- **Validación de integridad post-copia NO implementada**: los datos ya fueron migrados y
  confirmados en la console del destino (5 categorías, 24 subcategorías, 70 productos;
  `categorias/sin-categoria` preservado por ID). El destino es ahora la fuente de verdad,
  por lo que el chequeo automático de conteos/unicidad `sku`/`slug` y el exit ≠ 0 en
  discrepancia se removieron del spec. La unicidad `sku`/`slug` sigue garantizada por las
  reglas de negocio del backend y se valida en smoke tests (Fase 6).

## Risks / Trade-offs

- **Referencias `creadoPor` muertas** → Los productos referencian UIDs de Auth viejo
  que no existirán. Es solo trazabilidad (no FK en Firestore). Mitigación: documentar
  como limitación conocida; no bloquea.
- **Índices**: no se necesitan compuestos (igualdad + sort en memoria). Mitigación:
  `firestore.indexes.json` vacío a propósito; validar en smoke tests que el listado
  responde sin error de índice.
- **Bucket grande** → Mitigación: alternativa `gsutil cp` bucket-a-bucket en vez de copia
  byte-a-byte dentro del script.
- **Secretos en logs** → Mitigación: enmascarar `FIREBASE_PRIVATE_KEY` (igual que los
  seeds actuales).
- **Sobre-escritura accidental en destino** → Mitigación: idempotencia (omitir existentes)
  y `--dry-run` previo; la migración es por COPIA, el origen queda intacto para rollback.

## Migration Plan

1. **Preparación (cuenta destino)**: crear proyecto, habilitar Firestore/Auth/Storage,
   crear Service Account, agregar dominios autorizados, obtener config web.
2. **Infra como código**: crear `firebase.json`, `firestore.rules` (lockdown),
   `firestore.indexes.json` (índices compuestos) en `apps/backend`.
3. **Script**: `apps/backend/scripts/migrate-firestore.ts` (Admin SDK dual, dry-run,
   exclusión `usuarios`, Storage condicional).
4. **STAGING primero**: `--dry-run` → ejecución → `firebase deploy --only firestore` →
   verificar conteos.
5. **Config de entornos**: env backend (Coolify) + config Angular + rebuild Astro.
6. **Bootstrap + smoke tests**: `bootstrap:superadmin`, health, listados, login, crear
   producto (+ imagen si aplica).
7. **PRODUCCIÓN**: repetir 4–6. Rollback = revertir env vars a cuenta origen.

**Rollback**: la migración es por copia (no destructiva). Si falla, revertir las
variables de entorno del backend/admin a la cuenta origen. Mantener el proyecto origen
intacto hasta confirmar producción verde.

## Open Questions

- ¿El bucket origen tiene blobs? El pre-check del script lo determina; si los hay,
  confirmar si se copian byte-a-byte o vía `gsutil`.
- ¿Dónde se inicializa exactamente la config de Firebase en el panel Angular
  (`environment.ts` vs `app.config.ts`)? Tarea de localización en Fase 4.
