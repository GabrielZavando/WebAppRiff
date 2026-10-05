# Scenarios — ui-chrome-uniform

> Validación de diseño: change solo frontend; no introduce entidades del data
> model ni endpoints de API. Conflictos menores documentados: `configure-social-links`
> pasa de env-driven a constantes (deltas MODIFIED); el CSP de nginx suma `data:` a
> `font-src` (compatible con la "compatible base CSP" de la spec de hardening); las
> URLs de contacto cambian (tests y specs actualizados).
>
> Fuente: plan conversacional confirmado por el usuario (UI-02).

### SC-001: Header con fondo sólido secondary en páginas sin hero
**Given** una página sin hero (ej. `/productos`) que renderiza el Header
**When** el `<header class="site-header">` se renderiza en estado no-transparente
**Then** porta `bg-secondary` sólido (var(--color-secondary))
**And** NO lleva `bg-linear-to-r from-secondary to-secondary-light` ni `from-secondary`/`to-secondary-light`
**And** en páginas con hero (`transparent=true`) sigue `bg-transparent`

### SC-002: Barra de contacto con fondo sólido secondary
**Given** una página sin hero
**When** TopHeader se renderiza en estado no-transparente
**Then** el wrapper porta `bg-secondary` sólido
**And** NO lleva el gradiente `from-secondary to-secondary-light` (ni `bg-secondary` duplicado con gradiente)
**And** en páginas con hero sigue `bg-transparent`

### SC-003: Contacto desde configuración (constantes, sin env)
**Given** `lib/config/contact.ts`
**When** se invoca `getContactInfo()`
**Then** devuelve constantes: `phone` `+56 2 29079067`, `whatsapp` `+56 9 3752 6162`, `social.facebook` `https://www.facebook.com/somosriff`, `social.x` `''`, `social.instagram` `https://www.instagram.com/somosriff.cl/`, `social.linkedin` `https://www.linkedin.com/company/somosriff/`
**And** no lee `import.meta.env` para ninguno de esos valores

### SC-004: Botón WhatsApp usa el número de configuración
**Given** `Layout.astro` renderiza `<WhatsAppButton phone={contact.whatsapp} />`
**When** se renderiza el botón
**Then** el `<a>` enlaza a `https://wa.me/56937526162` (dígitos de la constante `+56 9 3752 6162`)
**And** el componente no contiene el número hardcodeado (viene por prop)

### SC-005: Barra de contacto renderiza contenido desde configuración
**Given** las constantes de contacto definidas (teléfono + 3 redes, X vacío)
**When** se renderiza TopHeader en cualquier página
**Then** muestra el teléfono y los iconos de Facebook, Instagram y LinkedIn con las URLs configuradas
**And** NO renderiza X (URL vacía)
**And** el contenido no depende de variables de entorno (build de Coolify sin env vars no lo vacía)

### SC-006: CSP de fuentes permite fuentes embebidas (data:)
**Given** `apps/web/nginx.conf` y `apps/admin/nginx.conf`
**When** se inspecciona la directiva `Content-Security-Policy` de cada location
**Then** `font-src` incluye `data:` (`font-src 'self' https: data:`)
**And** el resto de directivas de la CSP no cambia

### Edge Cases

| Case | Expected Behavior | Cubierto por |
|------|-------------------|--------------|
| Página con hero (Inicio, Servicios) | Header y TopHeader transparentes (sin cambio) | SC-001, SC-002 |
| `WHATSAPP_NUMBER`/contacto sin env en Coolify | La barra y el botón siguen renderizando (constantes) | SC-003, SC-005 |
| X con URL vacía | No se renderiza el icono de X en TopHeader ni Footer | SC-005 |
| Nº WhatsApp con formato +56 9 3752 6162 | wa.me con solo dígitos (56937526162) | SC-004 |
| `prefers-reduced-motion` / estilos | Sin impacto (solo background y config) | — |