/**
 * Types shared by the public cotizacion (quote request) page components.
 *
 * The three components on `/cotizacion` (CotizacionForm, CotizacionProcess,
 * CotizacionSupport) are presentational (dumb): they receive every piece of
 * data through props, so these interfaces are the contract between the page
 * (`apps/web/src/pages/cotizacion.astro`, which owns the configuration via
 * `COTIZACION_PAGE_CONTENT`) and the components (which only render).
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable by design, and the components never mutate their props.
 */

/** A single step in the quotation process (Recepción, Evaluación Técnica, …). */
export interface CotizacionProcessStep {
  /** Bold step title, e.g. "Recepción". */
  readonly title: string;
  /** Plain-text description of what happens in this step. */
  readonly description: string;
}

/** Props accepted by `CotizacionProcess.astro` (the process steps card). */
export interface CotizacionProcessProps {
  /** Card heading, e.g. "Proceso de Cotización". */
  readonly title: string;
  /** Ordered list of process steps rendered as a numbered/divided list. */
  readonly steps: readonly CotizacionProcessStep[];
}

/** Props accepted by `CotizacionSupport.astro` (the urgent-support card). */
export interface CotizacionSupportProps {
  /** Card heading, e.g. "¿Necesita soporte inmediato?". */
  readonly title: string;
  /** Supporting copy under the heading. */
  readonly description: string;
  /** Phone number in display format, e.g. "+56 2 29079067". */
  readonly phone: string;
  /** Clickable `tel:` href built from the phone number. */
  readonly phoneHref: string;
}

/** Placeholder texts for the cotizacion form fields. */
export interface CotizacionFormPlaceholders {
  /** Placeholder for the Nombre Completo input. */
  readonly nombre: string;
  /** Placeholder for the Correo Electrónico input. */
  readonly email: string;
  /** Placeholder for the Teléfono input. */
  readonly telefono: string;
  /** Placeholder for the Nombre de la Empresa input. */
  readonly empresa: string;
  /** Placeholder for the RUT de la Empresa input. */
  readonly rut: string;
  /** Placeholder for the Mensaje textarea. */
  readonly mensaje: string;
}

/** Configuration for the cotizacion form submission and copy. */
export interface CotizacionFormConfig {
  /**
   * Form `action` target. Points at the existing backend endpoint
   * `POST /api/v1/quotes`. The `rut` field is sent as `name="rut"` and will be
   * persisted by a separate backend change (`backend-cotizaciones-rut`); until
   * then the backend ignores it without breaking the request.
   */
  readonly action: string;
  /** Visible label of the submit button, e.g. "ENVIAR SOLICITUD". */
  readonly submitLabel: string;
  /** Placeholder texts for each form field. */
  readonly placeholders: CotizacionFormPlaceholders;
}

/** Props accepted by `CotizacionForm.astro`. */
export interface CotizacionFormProps {
  /** Form submission config (action + submit label + placeholders). */
  readonly config: CotizacionFormConfig;
}
