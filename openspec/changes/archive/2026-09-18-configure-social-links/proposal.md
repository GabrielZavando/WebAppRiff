# Change Proposal: configure-social-links

- **Ticket ID**: RIFF-WEB-01
- **Ticket title**: [frontend] Configurar enlaces reales de redes sociales
- **Tag**: [frontend]
- **Enriched artifact**: `openspec/tickets/RIFF-WEB-01-enriched.md`

## Summary

Configurar las URLs oficiales de Facebook, Instagram y LinkedIn de Riff en la fuente única de configuración del frontend Astro SSG (`apps/web/src/lib/config/contact.ts`), manteniendo `SOCIAL_X_URL` vacío para no renderizar el icono ni el enlace de X. Actualizar el contrato `.env.example`, el archivo `.env` local y la documentación de despliegue en `docs/deploy-standards.md` para Coolify.

## Motivation

Los componentes de interfaz (`TopHeader.astro`, `Footer.astro` y `ContactBar.astro`) leen la presencia social desde `getContactInfo()` y `getSocialLinks()`, pero las URLs de redes sociales usaban valores placeholder o antiguos. El cliente confirmó las cuentas oficiales de Facebook, Instagram y LinkedIn, y confirmó que no dispone de cuenta en X. Dado que el sitio se construye con Astro SSG, estas variables públicas se incorporan durante el build time y requieren documentación clara para su despliegue en Coolify.

## Scope

In scope:
- Configuración oficial en `apps/web/src/lib/config/contact.ts` y pruebas asociadas.
- Actualización de `apps/web/.env.example` y del archivo local ignorado `apps/web/.env`.
- Verificación de renderizado en `TopHeader`, `Footer` y `ContactBar` (`/contacto`).
- Atributos de seguridad (`target="_blank"`, `rel="noopener noreferrer"`) y accesibilidad (`aria-label`).
- Actualización del fixture/configuración E2E en `apps/web/playwright.config.ts` y spec E2E `apps/web/e2e/top-header.spec.ts`.
- Documentación de variables públicas de build para Astro SSG en Coolify dentro de `docs/deploy-standards.md`.

Out of scope:
- Crear nuevos iconos o alterar el sistema de iconos `astro-icon`.
- Modificar el diseño, colores, orden, dimensiones o tokens de los componentes.
- Modificar el backend NestJS, endpoints de API o modelos de Firestore.
- Desplegar directamente a staging o producción.

## Capabilities

### New Capabilities
- `configure-social-links`: Centralización y publicación de las URLs oficiales de Facebook, Instagram y LinkedIn en el frontend SSG de Astro, omitiendo X cuando `SOCIAL_X_URL` está vacío, garantizando atributos accesibles y seguros en TopHeader, Footer y ContactBar, y documentando su configuración de build en Coolify.

### Modified Capabilities
- None (las especificaciones existentes de `top-header`, `site-footer` y `contact-page` ya contemplan el filtrado de URLs vacías; este change concreta la configuración real, el contrato de entorno y la prueba E2E sin modificar los requerimientos base del sistema).

## Impact

- **Code (frontend — Astro SSG, `apps/web`)**:
  - `src/lib/config/contact.ts` (mantiene contrato tipado `getContactInfo()`).
  - `.env.example` y `.env` (actualización de variables sociales públicas).
  - `playwright.config.ts` y `e2e/top-header.spec.ts` (actualización del entorno E2E y aserciones).
- **Documentación**:
  - `docs/deploy-standards.md` (incorporación de las variables `SOCIAL_*_URL` en la tabla de variables de entorno de Coolify para el sitio Astro SSG).
- **Dependencies / Assets**: Ninguno nuevo.
