# Requirements: configure-social-links

1. **R1 — Redes oficiales en TopHeader**: `TopHeader.astro` debe renderizar únicamente Facebook, Instagram y LinkedIn con las URLs oficiales configuradas cuando `SOCIAL_X_URL` esté vacío. (SC-001)
2. **R2 — Redes oficiales en Footer**: `Footer.astro` debe renderizar únicamente Facebook, Instagram y LinkedIn con las URLs oficiales desde la fuente compartida, omitiendo X. (SC-002)
3. **R3 — Redes oficiales en ContactBar**: `ContactBar.astro` en `/contacto` debe renderizar únicamente Facebook, Instagram y LinkedIn reutilizando la misma fuente común. (SC-003)
4. **R4 — Seguridad y accesibilidad**: Todo enlace social debe incluir `target="_blank"`, `rel="noopener noreferrer"` y `aria-label` correcto. (SC-004)
5. **R5 — Fuente única de verdad**: Las URLs sociales deben resolverse exclusivamente vía `getContactInfo()` y `getSocialLinks()`, sin duplicar URLs en componentes. (SC-005)
6. **R6 — Configuración local de entorno**: `apps/web/.env.example` y el `.env` local deben registrar las URLs oficiales y `SOCIAL_X_URL` vacío. (SC-006)
7. **R7 — Documentación de build SSG en Coolify**: `docs/deploy-standards.md` debe documentar que las variables sociales se configuran como variables de build en Coolify y requieren rebuild. (SC-007)
8. **R8 — Cobertura de pruebas unitarias y E2E**: El suite de Vitest y las pruebas E2E de Playwright deben actualizarse para validar las tres redes oficiales sin esperar la presencia de X. (SC-008)

Traceability: R1→SC-001; R2→SC-002; R3→SC-003; R4→SC-004; R5→SC-005; R6→SC-006; R7→SC-007; R8→SC-008.
