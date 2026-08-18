## Why

La página `/cotizacion` es el destino del botón CTA "SOLICITAR COTIZACION" del header, pero actualmente es un placeholder sin formulario. Los usuarios que hacen clic en ese botón encuentran un mensaje estático con un email y teléfono, lo que genera fricción y pérdida de oportunidades de negocio. El diseño final (Cotizador.png) requiere un formulario completo de solicitud de cotización con un layout de dos columnas: formulario a la izquierda y tarjetas informativas (proceso de cotización + soporte inmediato) a la derecha.

## What Changes

- **Nuevo componente `CotizacionForm.astro`**: Formulario presentacional con campos: nombre completo, correo electrónico, teléfono, nombre de la empresa, RUT de la empresa, y mensaje. El campo `rut` se envía como `name="rut"` en el POST, listo para ser persistido por el backend. Submit apunta a `POST /api/v1/quotes`.
- **Nuevo componente `CotizacionProcess.astro`**: Tarjeta informativa con los 3 pasos del proceso de cotización (Recepción, Evaluación Técnica, Propuesta), fondo teal claro.
- **Nuevo componente `CotizacionSupport.astro`**: Tarjeta de soporte inmediato con teléfono de emergencia, fondo teal profundo.
- **Reescritura de `cotizacion.astro`**: Página completa con layout de dos columnas (grid), usando los tres componentes nuevos. Se reemplaza el placeholder actual.
- **Nuevo archivo de tipos `lib/types/cotizacion-form.ts`**: Interfaces para los props de los componentes de cotización.
- **Nuevo archivo de configuración `lib/config/cotizacion-page.ts`**: Constantes de contenido (copy, placeholders, pasos del proceso, datos de soporte).
- **Backend en change separado**: El endpoint `POST /api/v1/quotes` ya existe y acepta nombre, email, telefono, nombre_empresa, mensaje. El campo `rut` NO existe aún en el backend; un change separado (`backend-cotizaciones-rut`) agregará `rut` al modelo `cotizaciones`, al DTO `CotizacionCreate` y a las validaciones. Este change frontend asume que el backend eventualmente aceptará `name="rut"` sin requerir cambios adicionales en el formulario.

## Capabilities

### New Capabilities
- `cotizacion-page`: Página completa de solicitud de cotización con formulario de dos columnas, tarjeta de proceso y tarjeta de soporte.

### Modified Capabilities
<!-- No existing specs require requirement-level changes -->

## Impact

- **Archivos nuevos**: `apps/web/src/components/CotizacionForm.astro`, `CotizacionProcess.astro`, `CotizacionSupport.astro`, `apps/web/src/lib/types/cotizacion-form.ts`, `apps/web/src/lib/config/cotizacion-page.ts`
- **Archivos modificados**: `apps/web/src/pages/cotizacion.astro` (reescritura completa del placeholder)
- **API existente**: `POST /api/v1/quotes` ya implementado; el formulario apunta a ese endpoint y envía `rut` como campo adicional
- **Dependencias**: No se agregan dependencias nuevas; se usan `astro-icon` (Lucide), Tailwind v4 tokens existentes
- **RUT (decidido)**: Campo de formulario real `name="rut"` en el frontend. Persistencia en backend vía change separado `backend-cotizaciones-rut` (modelo `cotizaciones`, DTO `CotizacionCreate`, validaciones). Hasta que ese change aterrice, el backend ignorará el campo `rut` (no rompe el envío).
