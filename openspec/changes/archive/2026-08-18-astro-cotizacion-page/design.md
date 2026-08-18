## Context

La página `/cotizacion` es el destino del botón CTA "SOLICITAR COTIZACION" del header. Actualmente es un placeholder con texto estático. El diseño final (Cotizador.png) muestra un layout de dos columnas con un formulario de solicitud a la izquierda y tarjetas informativas a la derecha.

El patrón de referencia es la página de contacto (`/contacto`), que usa componentes presentacionales spread desde constantes de configuración en `lib/config/`. El formulario de contacto ya demuestra el patrón de inputs HTML nativos con validación client-side, labels asociados via `for`/`id`, y submit a un endpoint futuro.

**Estado actual:**
- `apps/web/src/pages/cotizacion.astro`: placeholder estático
- `POST /api/v1/quotes`: endpoint ya implementado en el backend (acepta nombre, email, telefono, nombre_empresa, mensaje)
- Diseño Cotizador.png: formulario con 6 campos (incluido RUT) + sidebar de 2 tarjetas

## Goals / Non-Goals

**Goals:**
- Implementar la página completa de cotización según el diseño Cotizador.png
- Crear componentes presentacionales (dumb) siguiendo el patrón de la página de contacto
- Layout responsivo de dos columnas (desktop) apilado (mobile)
- Formulario con validación HTML5 nativa, submit a `POST /api/v1/quotes`
- Tarjeta de proceso con 3 pasos y tarjeta de soporte con teléfono
- Usar design tokens existentes (flat design, sin rounded, sin shadow)

**Non-Goals:**
- Modificar el backend (el endpoint ya existe y acepta los campos relevantes)
- Implementar el campo RUT en el backend (se decide por separado cómo manejarlo)
- Agregar validación JavaScript del lado del cliente más allá de HTML5 nativo
- Implementar estados de éxito/error post-submit (progressive enhancement futuro)
- Crear una página de confirmación de cotización

## Decisions

### 1. Layout: CSS Grid de dos columnas

**Decisión:** Usar `grid grid-cols-1 lg:grid-cols-3` con el formulario ocupando 2 columnas (`lg:col-span-2`) y el sidebar 1 columna.

**Razón:** El diseño muestra claramente un layout de dos columnas en desktop. CSS Grid es la herramienta nativa más limpia para esto. El formulario necesita más espacio que el sidebar, por eso 2:1.

**Alternativa considerada:** Flexbox con `flex-row` — más verboso para el control de alturas y no natural para layouts de columnas desiguales.

### 2. Componentes: Tres componentes presentacionales + página

**Decisión:** Crear `CotizacionForm.astro`, `CotizacionProcess.astro`, `CotizacionSupport.astro` como componentes dumb. La página `cotizacion.astro` orquesta el layout.

**Razón:** Sigue el patrón establecido por `/contacto` (ContactHero + ContactForm + ContactBar). Cada componente tiene una responsabilidad única (SRP). Los componentes reciben todo via props.

**Estructura de componentes:**
- `CotizacionForm.astro` — formulario con 6 campos + submit
- `CotizacionProcess.astro` — tarjeta de pasos del proceso
- `CotizacionSupport.astro` — tarjeta de soporte inmediato

### 3. Campo RUT: Formulario real `name="rut"`, persistencia en change de backend separado

**Decisión:** Incluir el campo RUT en el formulario como `<input type="text" name="rut">` visible y enviarlo como campo propio en el POST a `/api/v1/quotes`. NO se concatena al mensaje. La persistencia de `rut` en Firestore se resuelve en un change de backend separado (`backend-cotizaciones-rut`) que agregará `rut` al modelo `cotizaciones`, al DTO `CotizacionCreate` y a las validaciones.

**Razón:** El endpoint `POST /api/v1/quotes` no tiene campo `rut` hoy. El cliente decidió (ver Open Questions resueltas) que el RUT debe ser un campo estructurado real, no texto libre en el mensaje. El frontend envía `name="rut"`; hasta que el backend lo persista, el campo es ignorado sin romper el envío. Esto evita re-trabajo en el frontend cuando el backend aterrice.

**Alternativa considerada:** (a) No enviar el RUT — pierde información válida; (b) Concatenar al mensaje — no estructurado, rechazado por el cliente; (c) Agregar campo al backend en este mismo change — scope creep, rompe la separación de responsabilidades frontend/backend del SDD.

### 4. Configuración: Constantes en `lib/config/cotizacion-page.ts`

**Decisión:** Seguir el patrón de `contact-page.ts` — un archivo que exporta `COTIZACION_PAGE_CONTENT` con sub-objetos para hero, form, process y support.

**Razón:** Consistencia con el patrón existente. Los componentes son dumb, la configuración vive en `lib/config/`. Facilita cambios de copy sin tocar componentes.

### 5. Tipos: Interfaces en `lib/types/cotizacion-form.ts`

**Decisión:** Crear interfaces separadas para los props de cada componente, similar a `contact-form.ts`.

**Razón:** Tipado completo (project standard). Cada componente tiene su interfaz de props. Los tipos se reutilizan entre el archivo de configuración y los componentes.

### 6. Formulario: HTML nativo sin JavaScript

**Decisión:** Usar `<form method="post" action="/api/v1/quotes">` con validación HTML5 nativa (`required`, `type="email"`, `type="tel"`). Sin JavaScript para envío.

**Razón:** Progressive enhancement — el formulario funciona sin JS. El endpoint ya existe. El JS de éxito/error se puede agregar después como mejora.

### 7. Responsive: Mobile-first, apilado en mobile

**Decisión:** En mobile (< `lg`), todo se apila verticalmente: formulario primero, luego sidebar. En desktop (`lg+`), dos columnas.

**Razón:** Mobile-first es el estándar del proyecto. El formulario es lo más importante, va primero en el DOM.

### 8. Estilo: Flat design estricto, tokens del proyecto

**Decisión:** Sin `rounded-*`, sin `shadow-*`. Usar tokens: `bg-white`, `border-border`, `bg-primary-deep`, `bg-primary-light`, `text-secondary`, `bg-accent`, `font-heading`.

**Razón:** Consistencia con el design system del proyecto. El mockup confirma flat design (ángulos rectos, sin sombras).

## Risks / Trade-offs

- **[RUT no persistido en backend (temporal)]** → El RUT se envía como campo `name="rut"` pero el backend aún no lo persiste (change `backend-cotizaciones-rut` pendiente). Hasta entonces el campo es ignorado por el backend sin romper el envío. Mitigación: change de backend ya decidido y separado; el frontend no requiere cambios adicionales cuando aterrice.

- **[Sin feedback post-submit]** → El usuario no ve confirmación de éxito/error después de enviar. Mitigación: el formulario usa HTML nativo; un redirect o mensaje se puede agregar después con JS progressive enhancement.

- **[Contenido estático hardcodeado]** → Los pasos del proceso y el copy están en constantes. Cambios de copy requieren rebuild. Mitigación: consistente con todo el sitio SSG; el futuro CMS lo resolverá.

- **[Layout de dos columnas en desktop]** → En pantallas muy pequeñas (tablets landscape), el sidebar puede quedar muy estrecho. Mitigación: usar `lg:` breakpoint (1024px+) para el layout de dos columnas.

## Migration Plan

1. Crear tipos en `lib/types/cotizacion-form.ts`
2. Crear configuración en `lib/config/cotizacion-page.ts`
3. Crear componente `CotizacionProcess.astro`
4. Crear componente `CotizacionSupport.astro`
5. Crear componente `CotizacionForm.astro`
6. Reescribir `cotizacion.astro` con el nuevo layout
7. Verificar que el form submit apunta a `/api/v1/quotes`
8. Testear responsive en mobile y desktop

**Rollback:** Revertir el commit que reescribe `cotizacion.astro` vuelve al placeholder.

## Open Questions

1. **RUT en backend** (RESUELTO): El cliente decidió que el RUT es un campo estructurado real, persistido en un change de backend separado (`backend-cotizaciones-rut`). El frontend envía `name="rut"`; el backend lo ignorará hasta que ese change aterrice.
2. **Estado del formulario post-submit**: ¿Se necesita una página de confirmación o un redirect a una página de agradecimiento? Por ahora el form hace POST nativo sin JS.
3. **Hero de la página**: El diseño no muestra un hero tipo ContactHero. ¿Se omite el hero o se agrega uno? El mockup sugiere que no hay hero — la página empieza directamente con el formulario.
