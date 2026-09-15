# Requirements — fix-cloud-run-runtime-configuration

1. **R1 — Servicio por repo var.** El lane de staging usa `vars.CLOUD_RUN_SERVICE`
   para el servicio y crea el servicio si no existe. (SC-001)
2. **R2 — Runtime service account.** `deploy-cloudrun` inyecta el runtime SA vía
   `--service-account=${{ vars.GCP_RUNTIME_SA }}`. (SC-002)
3. **R3 — ADC sin JSON.** No se añaden `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`
   ni claves; el contenedor autentica por ADC con el runtime SA. (SC-003)
4. **R4 — Env vars del runtime.** Se configuran `FIREBASE_PROJECT_ID`,
   `FIREBASE_STORAGE_BUCKET`, `NODE_ENV=production`, `ASTRO_SITE_URL` y
   `ANGULAR_ADMIN_URL`; no se define `PORT` manualmente. (SC-004)
5. **R5 — Acceso público staging.** El deploy pasa `--allow-unauthenticated`.
   (SC-005)
6. **R6 — Secrets desde Secret Manager.** `CATALOG_REBUILD_WEBHOOK_URL` y
   `CATALOG_REBUILD_WEBHOOK_TOKEN` se inyectan vía el input `secrets` del action,
   jamás escritos en workflow/logs; la ausencia falla el deploy con error claro.
   (SC-006)
7. **R7 — Rutas parametrizadas.** La imagen usada `${GCP_REGION}-docker.pkg.dev/
   ${GCP_PROJECT}/${GCP_ARTIFACT_REPOSITORY}/riff-backend:sha-<commit>` en los puntos
   que hoy repiten literales. (SC-007)
8. **R8 — Aislamiento staging/producción.** Staging usa solo repo vars de staging;
   producción permanece no-op hasta que `vars.CLOUD_RUN_SERVICE_PRODUCTION` y
   `vars.FIREBASE_PROJECT_ID_PRODUCTION` estén definidas. (SC-008, SC-009)
9. **R9 — Gate CI y orden conservados.** CI sigue antes del deploy; el backend
   staging y su smoke preceden al trigger de frontends. (SC-010)
10. **R10 — Docs operativas.** `docs/deploy-standards.md` documenta secretos por
    crear, IAM del runtime SA, acceso cruzado webappriff ↔ riff-catalogo-staging, y
    seed mínimo de Firestore staging; la tabla de env refleja el runtime configurado
    y las nuevas vars de producción vacías. (SC-011)