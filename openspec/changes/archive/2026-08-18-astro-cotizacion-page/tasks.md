## 1. Tipos y Configuración

- [x] 1.1 Crear `apps/web/src/lib/types/cotizacion-form.ts` con interfaces: `CotizacionFormPlaceholders`, `CotizacionFormConfig`, `CotizacionFormProps`, `CotizacionProcessStep`, `CotizacionProcessProps`, `CotizacionSupportProps`
- [x] 1.2 Crear `apps/web/src/lib/config/cotizacion-page.ts` con constante `COTIZACION_PAGE_CONTENT` que exporte sub-objetos para form, process y support (copy del mockup Cotizador.png)

## 2. Componente CotizacionProcess

- [x] 2.1 Crear `apps/web/src/components/CotizacionProcess.astro` con interfaz de props `CotizacionProcessProps`
- [x] 2.2 Implementar tarjeta con fondo `bg-primary-light`, icono de interrogación (`lucide:circle-question-mark`), título "Proceso de Cotización"
- [x] 2.3 Implementar los 3 pasos (Recepción, Evaluación Técnica, Propuesta) con título en negrita y descripción

## 3. Componente CotizacionSupport

- [x] 3.1 Crear `apps/web/src/components/CotizacionSupport.astro` con interfaz de props `CotizacionSupportProps`
- [x] 3.2 Implementar tarjeta con fondo `bg-primary-deep`, texto blanco, título "¿Necesita soporte inmediato?"
- [x] 3.3 Implementar enlace `tel:` con icono `lucide:phone` y número "+56 2 29079067"

## 4. Componente CotizacionForm

- [x] 4.1 Crear `apps/web/src/components/CotizacionForm.astro` con interfaz de props `CotizacionFormProps`
- [x] 4.2 Implementar `<form method="post" action="/api/v1/quotes">` con layout de grid responsivo (`grid-cols-1 md:grid-cols-2`)
- [x] 4.3 Implementar campos: nombre (`text`, required), email (`email`, required), telefono (`tel`, required), empresa (`text`, required), rut (`text`, required)
- [x] 4.4 Implementar textarea para mensaje (required) con placeholder "Describa los requerimientos técnicos de su proyecto..."
- [x] 4.5 Implementar botón de submit "ENVIAR SOLICITUD" con `bg-accent` e icono `lucide:arrow-right`

## 5. Página cotizacion.astro

- [x] 5.1 Reescribir `apps/web/src/pages/cotizacion.astro` con Layout `hero={false}` `showSearch={false}`
- [x] 5.2 Implementar layout de dos columnas con CSS Grid (`grid grid-cols-1 lg:grid-cols-3`)
- [x] 5.3 Componer CotizacionForm en columna izquierda (`lg:col-span-2`)
- [x] 5.4 Componer CotizacionProcess y CotizacionSupport apilados en columna derecha
- [x] 5.5 Importar y spread `COTIZACION_PAGE_CONTENT` desde config

## 6. Verificación

- [x] 6.1 Verificar que el form submit apunta a `/api/v1/quotes`
- [x] 6.2 Verificar responsive: mobile apilado, desktop dos columnas
- [x] 6.3 Verificar que no hay clases `rounded` ni `shadow` en los componentes
- [x] 6.4 Verificar accesibilidad: labels asociados via `for`/`id`, botón con texto visible
- [x] 6.5 Verificar que se usan design tokens del proyecto (sin hex literals)

## 7. Ajustes de diseño (post-apply)

- [x] 7.1 Colorear el heading "Datos del Requerimiento" con el token `text-primary-dark` (equivale a #2E9AAD)
- [x] 7.2 Numerar la lista del proceso de cotización: "1. Recepción", "2. Evaluación Técnica", "3. Propuesta"
