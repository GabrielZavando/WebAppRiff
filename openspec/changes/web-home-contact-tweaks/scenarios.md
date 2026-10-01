# Scenarios — web-home-contact-tweaks

> Validación de diseño: change solo-frontend — no introduce entidades del data
> model ni endpoints de API nuevos. El endpoint `POST /api/v1/contacts` ya
> declarado en `CONTACT_FORM_CONFIG` no se ve afectado. Capabilities mapeadas:
> `contact-page`, `product-detail-page`, `services-section`, `services-page` y
> `destacados-section` (MODIFIED) + `view-transitions` (NEW).

### SC-001: Correo correcto en /contacto
**Given** un visitante en la página `/contacto`
**When** visualiza la barra de contacto (`ContactBar`) debajo del formulario
**Then** el correo mostrado es `contacto@somosriff.cl`
**And** el enlace es `mailto:contacto@somosriff.cl`

### SC-002: Scroll suave home → servicio respectivo (View Transitions)
**Given** un visitante en el home, sección "Servicios especializados" (`ServicesSection`)
**When** hace clic en "Ver detalles" de una tarjeta de servicio (ej. "Medición Industrial")
**Then** navega a `/servicios` mediante View Transitions (transición de vista elegante)
**And** la página hace scroll suave hasta la tarjeta correspondiente (ancla `id="medicion-industrial"`)
**And** la tarjeta queda visible bajo el header sticky (scroll-margin-top)

### SC-003: Botones de Destacados → "Ver detalles" a la ficha
**Given** un visitante en el home, sección "Soluciones Destacadas" (`DestacadosSection`)
**When** hace clic en el botón de cualquier tarjeta de producto
**Then** el texto visible del botón es exactamente "Ver detalles"
**And** navega a la ficha de detalle `/productos/{slug}` del producto correspondiente

### SC-004: Correo correcto en el fallback mailto de la ficha de producto
**Given** un visitante en una ficha de producto `/productos/{slug}` publicada
**When** visualiza la CTA "CONTACTAR ASESOR" (fallback de contacto por email)
**Then** el enlace es `mailto:contacto@somosriff.cl` (ya no `contacto@riff.cl`)

### SC-005: Deep link directo a un ancla de servicio
**Given** un visitante que llega directo a `/servicios#medicion-industrial` (sin pasar por el home)
**When** la página carga
**Then** la tarjeta del servicio correspondiente queda visible bajo el header sticky (scroll-margin-top)

### SC-006: prefers-reduced-motion degrada a salto instantáneo
**Given** un visitante con `prefers-reduced-motion: reduce`
**When** navega desde el home a `/servicios#{slug}`
**Then** no se ejecuta animación de scroll suave (salto instantáneo al ancla)
**And** la tarjeta destino queda visible

### SC-007: Navegador sin soporte de View Transitions hace fallback MPA
**Given** un navegador sin soporte de View Transitions
**When** hace clic en "Ver detalles" de una tarjeta de servicio
**Then** la navegación es MPA normal (fallback de Astro)
**And** el scroll al ancla funciona de forma nativa

### SC-008: Mapeo 1:1 de slugs del home ↔ anclas de /servicios
**Given** la config `SERVICES_DATA` del home (4 slugs) y la página /servicios (4 `ServiceCard`)
**When** se renderizan ambas páginas
**Then** el conjunto de anclas `id` de /servicios es exactamente igual al conjunto de slugs de `SERVICES_DATA` (`medicion-en-edificios`, `medicion-industrial`, `obras-y-proyectos`, `tratamiento-de-agua`)
**And** un slug sin ancla correspondiente degrada grácilmente (aterriza al tope de /servicios, sin error)
