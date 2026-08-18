import type {
  CotizacionFormConfig,
  CotizacionFormProps,
  CotizacionProcessProps,
  CotizacionProcessStep,
  CotizacionSupportProps,
} from '@/lib/types/cotizacion-form';

/**
 * Hardcoded content for the public cotizacion page (`/cotizacion`).
 *
 * Lives in `lib/config/` so `apps/web/src/pages/cotizacion.astro` can spread
 * the sub-objects onto `<CotizacionForm {...COTIZACION_PAGE_CONTENT.form} />`,
 * `<CotizacionProcess {...COTIZACION_PAGE_CONTENT.process} />` and
 * `<CotizacionSupport {...COTIZACION_PAGE_CONTENT.support} />` without the
 * components needing to know the copy. Keeping it hardcoded is consistent with
 * every other section config (`HERO_BANNER_CONTENT`, `SITE_FOOTER_CONTENT`,
 * `CONTACT_PAGE_CONTENT`, etc.): as the site is SSG, any change requires a
 * rebuild anyway. The future change `contentful-from-cms` will replace these
 * constants with CMS-injected content without touching the components.
 *
 * Copy source: `docs/design/components/Cotizador.png` (mockup delivered by the
 * client, 2026-08-18).
 */

/**
 * The three steps of the quotation process, rendered as a divided list in the
 * `CotizacionProcess` card. Stable copy from the mockup.
 */
export const COTIZACION_PROCESS_STEPS: readonly CotizacionProcessStep[] = [
  {
    title: 'Recepción',
    description:
      'Un ingeniero evaluará sus requerimientos técnicos en un plazo máximo de 24 horas hábiles.',
  },
  {
    title: 'Evaluación Técnica',
    description:
      'En caso de ser necesario, agendaremos una visita a terreno o reunión técnica para precisar detalles del fluido o infraestructura.',
  },
  {
    title: 'Propuesta',
    description:
      'Entrega de propuesta formal con especificaciones técnicas, garantías y plazos de entrega.',
  },
];

/** Process steps card content for the cotizacion page. */
export const COTIZACION_PROCESS: Readonly<CotizacionProcessProps> = {
  title: 'Proceso de Cotización',
  steps: COTIZACION_PROCESS_STEPS,
};

/**
 * Urgent-support card content. Reuses the same canonical Riff phone number as
 * the contact page and footer (`+56 2 29079067` / `tel:+56229079067`).
 */
export const COTIZACION_SUPPORT: Readonly<CotizacionSupportProps> = {
  title: '¿Necesita soporte inmediato?',
  description:
    'Para urgencias operacionales o fallas críticas, contacte a nuestra línea de soporte 24/7.',
  phone: '+56 2 29079067',
  phoneHref: 'tel:+56229079067',
};

/**
 * Form submission config. `action` points at the existing backend endpoint
 * `POST /api/v1/quotes` (already implemented). The form also sends a `rut`
 * field; the backend will persist it via the separate change
 * `backend-cotizaciones-rut`. Default placeholders are taken from the mockup.
 */
export const COTIZACION_FORM_CONFIG: Readonly<CotizacionFormConfig> = {
  action: '/api/v1/quotes',
  submitLabel: 'ENVIAR SOLICITUD',
  placeholders: {
    nombre: 'Ej. Juan Pérez',
    email: 'juan.perez@empresa.com',
    telefono: '+56 9 1234 5678',
    empresa: 'Empresa S.A.',
    rut: '12.345.678-9',
    mensaje: 'Describa los requerimientos técnicos de su proyecto...',
  },
};

/** Form section content for the cotizacion page. */
export const COTIZACION_FORM: Readonly<CotizacionFormProps> = {
  config: COTIZACION_FORM_CONFIG,
};

/**
 * Full props bag for the cotizacion page, spread onto its three components by
 * `apps/web/src/pages/cotizacion.astro`.
 */
export const COTIZACION_PAGE_CONTENT: Readonly<{
  form: CotizacionFormProps;
  process: CotizacionProcessProps;
  support: CotizacionSupportProps;
}> = {
  form: COTIZACION_FORM,
  process: COTIZACION_PROCESS,
  support: COTIZACION_SUPPORT,
};
