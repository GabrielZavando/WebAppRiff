# Requirements — ui-chrome-uniform

1. **R1 — Chrome uniforme.** El Header y la barra de contacto (TopHeader) usan
   `bg-secondary` sólido (var(--color-secondary)) cuando tienen color de fondo
   (páginas sin hero); en páginas con hero se mantienen transparentes. El
   gradiente `bg-linear-to-r from-secondary to-secondary-light` desaparece.
   (SC-001, SC-002)
2. **R2 — Contacto en configuración.** `getContactInfo()` devuelve constantes de
   configuración (`phone` `+56 2 29079067`, `whatsapp` `+56 9 3752 6162`,
   `social.facebook` `https://www.facebook.com/somosriff`, `social.x` `''`,
   `social.instagram` `https://www.instagram.com/somosriff.cl/`,
   `social.linkedin` `https://www.linkedin.com/company/somosriff/`) sin leer
   `import.meta.env`. `ContactInfo` gana el campo `whatsapp`. (SC-003)
3. **R3 — WhatsApp desde configuración.** `WhatsAppButton.astro` recibe el número
   por prop (`phone`) desde `Layout.astro` (`contact.whatsapp`) y deriva
   `https://wa.me/{dígitos}`; no contiene el número hardcodeado. (SC-004)
4. **R4 — Barra de contacto con contenido configurado.** TopHeader renderiza el
   teléfono y los iconos de Facebook, Instagram y LinkedIn con las URLs
   configuradas (X ausente por URL vacía), sin depender de variables de entorno.
   (SC-005)
5. **R5 — CSP de fuentes.** `font-src 'self' https: data:` en
   `apps/web/nginx.conf` y `apps/admin/nginx.conf` (6 locations); el resto de
   directivas de la CSP no cambia. (SC-006)