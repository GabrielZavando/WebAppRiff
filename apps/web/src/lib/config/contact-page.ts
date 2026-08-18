import type {
  ContactAreaInteres,
  ContactBarProps,
  ContactFormConfig,
  ContactFormProps,
  ContactHeroProps,
} from '@/lib/types/contact-form';
import { getContactInfo } from '@/lib/config/contact';
import { getSocialLinks } from '@/lib/types/top-header';

/**
 * Hardcoded content for the public contact page (`/contacto`).
 *
 * Lives in `lib/config/` so `apps/web/src/pages/contacto.astro` can spread the
 * sub-objects onto `<ContactHero {...CONTACT_PAGE_CONTENT.hero} />`,
 * `<ContactForm {...CONTACT_PAGE_CONTENT.form} />` and
 * `<ContactBar {...CONTACT_PAGE_CONTENT.bar} />` without the components needing
 * to know the copy. Keeping it hardcoded is consistent with every other
 * section config (`HERO_BANNER_CONTENT`, `SITE_FOOTER_CONTENT`, etc.): as the
 * site is SSG, any change requires a rebuild anyway. The future change
 * `contentful-from-cms` will replace these constants with CMS-injected content
 * without touching the components.
 *
 * Copy source: `docs/design/components/ContactPage.png` (mockup delivered by
 * the client, 2026-08-18).
 */

/**
 * The five areas of interest rendered as grouped checkboxes in the contact
 * form. Stable kebab-case ids double as the checkbox `value`.
 */
export const CONTACT_AREAS: readonly ContactAreaInteres[] = [
  { id: 'medicion-fluidos', label: 'Medición de Fluidos' },
  { id: 'tratamiento-agua', label: 'Tratamiento de Agua' },
  { id: 'productos-quimicos', label: 'Productos Químicos' },
  { id: 'control-accesorios', label: 'Control y Accesorios' },
  { id: 'servicio-tecnico', label: 'Servicio Técnico' },
];

/**
 * Form submission config. `action` points at the future backend endpoint
 * `POST /api/v1/contacts` (a separate change will implement it). The contact
 * page is ready to consume it without code changes — only the backend needs
 * to land. Default placeholders are taken from the mockup.
 */
export const CONTACT_FORM_CONFIG: Readonly<ContactFormConfig> = {
  action: '/api/v1/contacts',
  submitLabel: 'ENVIAR MENSAJE',
  placeholders: {
    nombre: 'Ej. Juan Pérez',
    empresa: 'Razón Social',
    email: 'correo@empresa.com',
    telefono: '+56 9 0000 0000',
    mensaje: 'Describa los detalles técnicos de su solicitud...',
  },
};

/**
 * Canonical Riff contact coordinates for the contact bar and form context.
 *
 * Hardcoded (not read from `import.meta.env` via `getContactInfo`) so the
 * contact page has a deterministic, always-available phone/email regardless of
 * deploy env (consistent with `cotizacion.astro`, which also hardcodes
 * `+56 2 29079067` / `contacto@riff.cl`). Social links still reuse the shared
 * `getSocialLinks(getContactInfo())` source of truth (design.md Decision 5).
 */
const CONTACT_PHONE_DISPLAY = '+56 2 29079067';
const CONTACT_PHONE_HREF = 'tel:+56229079067';
const CONTACT_EMAIL = 'contacto@riff.cl';
const CONTACT_EMAIL_HREF = 'mailto:contacto@riff.cl';

/** Hero section content for the contact page. */
export const CONTACT_HERO: Readonly<ContactHeroProps> = {
  headline: 'Conecte con la Ingeniería de Precisión',
  highlightedWord: 'Ingeniería de Precisión',
  subtitle:
    'Expertos en medición de fluidos, control y tratamiento de agua. Soporte técnico y ejecución en terreno garantizada.',
};

/** Form section content for the contact page. */
export const CONTACT_FORM: Readonly<ContactFormProps> = {
  areas: CONTACT_AREAS,
  config: CONTACT_FORM_CONFIG,
};

/** Contact bar content for the contact page (phone, email, social icons). */
export const CONTACT_BAR: Readonly<ContactBarProps> = {
  phone: CONTACT_PHONE_DISPLAY,
  email: CONTACT_EMAIL,
  phoneHref: CONTACT_PHONE_HREF,
  emailHref: CONTACT_EMAIL_HREF,
  socialLinks: getSocialLinks(getContactInfo()),
};

/**
 * Full props bag for the contact page, spread onto its three components by
 * `apps/web/src/pages/contacto.astro`.
 */
export const CONTACT_PAGE_CONTENT: Readonly<{
  hero: ContactHeroProps;
  form: ContactFormProps;
  bar: ContactBarProps;
}> = {
  hero: CONTACT_HERO,
  form: CONTACT_FORM,
  bar: CONTACT_BAR,
};
