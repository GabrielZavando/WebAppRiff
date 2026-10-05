# UI chrome uniform: chrome background, contact config and font CSP

**Ticket**: UI-02
**Tag**: [frontend] (explícito, confirmado por el usuario — todo el trabajo vive en apps/web + nginx)
**Branch**: feature/ui-02-ui-chrome-uniform

## Why

El cliente reportó tres problemas. (1) El header y la barra de contacto usan un gradiente (`from-secondary to-secondary-light`) mientras el buscador usa sólido `var(--color-secondary)` — el chrome no es uniforme cuando tiene color. (2) El contenido de la barra de contacto (teléfono + redes) y el número de WhatsApp dependen de variables de entorno en build-time; en producción (Coolify) la barra salió vacía porque las env vars no estaban — debe ser configuración (constantes), no env. (3) Las fuentes self-hosted (@fontsource) se incrustan como base64 en el CSS del build, y el CSP de nginx (`font-src 'self' https:`) bloquea las URLs `data:` → las fuentes no cargan en producción (errores de consola confirmados).

## What Changes

- Header y TopHeader: reemplazar el gradiente por `bg-secondary` sólido (uniforme con el search) en páginas sin hero; hero transparente intacto.
- `lib/config/contact.ts`: `getContactInfo()` devuelve constantes (phone `+56 2 29079067`, whatsapp `+56 9 3752 6162`, social Facebook/Instagram/LinkedIn con URLs actualizadas, X vacío) — sin leer `import.meta.env`. `ContactInfo` gana `whatsapp`.
- `WhatsAppButton.astro`: recibe `phone` por prop desde Layout (`contact.whatsapp`) y deriva `https://wa.me/{dígitos}`; se elimina el número hardcodeado.
- Los iconos sociales NO van en configuración (mapeo lucide/simple-icons en `TopHeader.astro`).
- `font-src 'self' https: data:` en `apps/web/nginx.conf` y `apps/admin/nginx.conf` (permite las fuentes embebidas base64 de @fontsource).
- Las env vars `PRIMARY_PHONE`/`SOCIAL_*_URL` dejan de leerse en código (no se eliminan de `.env.example`/`env.d.ts`/`playwright.config`/`deploy-standards` — la limpieza queda a criterio del usuario).

Fuera de alcance: eliminar env vars de `.env.example`/`env.d.ts`/`playwright.config`/`deploy-standards`; `assetsInlineLimit: 0` (hardening de build, opcional a futuro); widget oficial de WhatsApp.

## Capabilities

### New Capabilities
- (ninguna nueva — todas son modificaciones)

### Modified Capabilities
- `top-header`: fondo sólido `bg-secondary` (sin gradiente) + contenido desde configuración (constantes, sin env).
- `site-header`: fondo sólido `bg-secondary` en estado no-transparente (sin gradiente).
- `configure-social-links`: redes sociales como constantes de configuración en `contact.ts` (se retira el requisito env-driven).
- `whatsapp-float-button`: número desde configuración vía prop (`contact.whatsapp`); `wa.me` derivado.
- `add-frontend-smoke-and-nginx-hardening`: CSP `font-src` incluye `data:` en ambos nginx.

## Impact

- `apps/web/src/components/Header.astro` (+ `__tests__/Header.test.ts`, snapshot)
- `apps/web/src/components/TopHeader.astro` (+ `__tests__/TopHeader.test.ts`, snapshot)
- `apps/web/src/lib/config/contact.ts` (+ `__tests__/contact.test.ts`)
- `apps/web/src/lib/types/top-header.ts`
- `apps/web/src/components/WhatsAppButton.astro` (+ `__tests__/WhatsAppButton.test.ts`)
- `apps/web/src/layouts/Layout.astro` (+ `__tests__/Layout.test.ts`)
- `apps/web/src/components/__tests__/Footer.test.ts` (URLs nuevas)
- `apps/web/e2e/top-header.spec.ts` (URLs nuevas)
- `apps/web/nginx.conf`, `apps/admin/nginx.conf`
- Test nuevo: `apps/web/src/styles/__tests__/csp-nginx.test.ts` (lectura de los nginx.conf)