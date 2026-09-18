# Scenarios: configure-social-links

### SC-001: TopHeader muestra las redes oficiales configuradas
- **Given** el sitio se construye con las URLs oficiales de Facebook, Instagram y LinkedIn
- **And** `SOCIAL_X_URL` está vacío
- **When** se renderiza `TopHeader.astro`
- **Then** aparecen enlaces a Facebook (`https://www.facebook.com/share/1DL9drgCDU/?mibextid=wwXIfr`), Instagram (`https://www.instagram.com/somosriff.cl?igsi=MTU2YXhqaThoNnFydA%3D%3D&utm_source=qr`) y LinkedIn (`https://www.linkedin.com/company/100252590`)
- **And** no aparece un enlace de X porque `SOCIAL_X_URL` está vacío

### SC-002: Footer muestra las redes oficiales configuradas
- **Given** el sitio se construye con Facebook, Instagram y LinkedIn configurados
- **When** se renderiza `Footer.astro`
- **Then** aparecen enlaces a las tres URLs oficiales exactas
- **And** no aparecen enlaces vacíos, `#` ni un enlace de X

### SC-003: ContactBar /contacto usa y verifica la fuente común
- **Given** se visita la página `/contacto`
- **When** se renderiza `ContactBar.astro`
- **Then** muestra las tres redes oficiales configuradas junto con teléfono y correo según su contrato existente
- **And** consume la misma fuente de datos que `TopHeader` y `Footer`
- **And** no renderiza X mientras `SOCIAL_X_URL` esté vacío

### SC-004: Seguridad y accesibilidad de enlaces externos
- **Given** un enlace social externo se renderiza en `TopHeader`, `Footer` o `ContactBar`
- **When** el usuario inspecciona o navega el enlace
- **Then** usa `target="_blank"` y `rel="noopener noreferrer"`
- **And** tiene un nombre accesible mediante `aria-label` ("Facebook", "Instagram", "LinkedIn")
- **And** los iconos decorativos conservan `aria-hidden="true"` cuando aplica

### SC-005: Existe una única fuente de configuración social
- **Given** se revisa la implementación de los enlaces sociales
- **When** `getSocialLinks`, `TopHeader`, `Footer`, `SITE_FOOTER_CONTENT` y `ContactBar` se comparan
- **Then** las URLs oficiales no están duplicadas en componentes o constantes paralelas
- **And** una red vacía se filtra de forma consistente en todos los puntos de renderización
- **And** las funciones y componentes permanecen completamente tipados sin `any`

### SC-006: Variables documentadas y configuración local actualizada
- **Given** un desarrollador consulta la configuración local
- **When** revisa `apps/web/.env.example` y `apps/web/.env`
- **Then** `apps/web/.env.example` documenta `SOCIAL_FACEBOOK_URL`, `SOCIAL_INSTAGRAM_URL`, `SOCIAL_LINKEDIN_URL` y `SOCIAL_X_URL`
- **And** el archivo ignorado local `apps/web/.env` contiene las tres URLs oficiales y `SOCIAL_X_URL` vacío
- **And** no se agregan secretos al repositorio

### SC-007: Coolify ejecuta la configuración de Astro SSG en build time
- **Given** el sitio Astro se despliega mediante Coolify
- **When** se configura o modifica una URL social
- **Then** las variables sociales se proporcionan como variables de build de `apps/web`
- **And** la documentación en `docs/deploy-standards.md` explica que los enlaces quedan embebidos durante el build SSG y que se requiere redeploy/rebuild para aplicar cambios
- **And** el comportamiento no depende de leer variables privadas en runtime del navegador

### SC-008: Tests unitarios y E2E cubren la integración
- **Given** la implementación está completa
- **When** se ejecutan los tests unitarios y E2E del frontend
- **Then** los tests unitarios de `contact`, `TopHeader`, `Footer` y `ContactBar` verifican las tres URLs oficiales y la omisión de X
- **And** `playwright.config.ts` inyecta las tres URLs oficiales y mantiene `SOCIAL_X_URL` vacío
- **And** la prueba E2E `apps/web/e2e/top-header.spec.ts` verifica los tres enlaces sociales sin esperar X

### Edge Cases

| Case | Expected Behavior |
|---|---|
| `SOCIAL_X_URL` está vacío | No se renderiza el ítem, icono ni enlace de X en ningún componente. |
| Una variable social pública no está definida | La red se omite sin romper el build ni generar enlaces inválidos. |
| Una URL social tiene espacios en blanco | Se considera vacía u omite mediante `getSocialLinks()`; nunca se renderiza un `href` inválido. |
| La lista social queda vacía | Los contenedores sociales se ocultan de forma visualmente limpia. |
| Se cambia una URL en Coolify | Se requiere y documenta un nuevo build/redeploy porque Astro es SSG. |
| Facebook, Instagram o LinkedIn contienen query string | Se preserva la URL oficial completa, incluidos sus parámetros, sin truncarla. |
