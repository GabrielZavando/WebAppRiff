# Change Proposal: migrate-product-images

- **Ticket ID**: upload-images
- **Ticket title**: [backend] Migración de imágenes de productos a Firebase Storage en staging
- **Tag**: [backend]
- **Enriched artifact**: openspec/tickets/upload-images-enriched.md

## Summary

Los productos del catálogo no muestran imágenes en el sitio público porque el seed sembró los datos en Firestore con `galeria: []` intencionalmente y la migración de imágenes (`npm run migrate:productos:imagenes`) solo se ejecutó parcialmente (~28 migrados, ~40 omitidos, según `apps/backend/migracion-imagenes-reporte.json` del 16-08-2026). Además, el CLI actual no valida que las URLs persistidas sean accesibles públicamente ni dispara el rebuild del sitio estático (Astro SSG) al terminar — el webhook `CATALOG_REBUILD_WEBHOOK_URL` solo se dispara en writes vía API.

## Motivation

Completar y robustecer el pipeline de migración de imágenes (descarga desde WordPress legacy → WebP → Firebase Storage → `galeria[]` en Firestore) para ejecutarlo en staging con garantías: validación de accesibilidad pública (HEAD request), reintento/reporte claro de omitidos, disparo automático del rebuild del sitio estático, y fallo rápido si falta configuración. El resultado verificable: sitio staging mostrando imágenes WebP (HTTP 200) en cards y páginas de detalle.

## Scope

In scope (apps/backend, CLI `src/cli/migrate-imagenes/`):
- Validación de accesibilidad pública de cada URL antes de persistirla (HEAD request, puerto de dominio).
- `RebuildNotifierService` en el CLI que dispara `CATALOG_REBUILD_WEBHOOK_URL` al finalizar con cambios.
- Reintento de productos omitidos previos y reporte final sin omitidos sin motivo.
- Fail-fast explícito si falta `FIREBASE_STORAGE_BUCKET` u otra config requerida.
- Ejecución verificada en staging + rebuild del sitio y verificación visual/HTTP.

Out of scope:
- Cambios en el frontend Astro (no se requieren).
- Cambios en API contract ni data model (el schema `galeria: [{url, storagePath, alt, orden}]` ya existe).
- Decisión final de ACL del bucket (documentada como pregunta; default: `makePublic()` por objeto validado con HEAD).
