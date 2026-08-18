/**
 * Types shared by the public contact page components.
 *
 * All three components on the `/contacto` page (ContactHero, ContactForm,
 * ContactBar) are presentational (dumb): they receive every piece of data
 * through props, so these interfaces are the contract between the page
 * (`apps/web/src/pages/contacto.astro`, which owns the configuration via
 * `CONTACT_PAGE_CONTENT`) and the components (which only render).
 *
 * All fields are `readonly` by project convention: content constants are
 * immutable by design, and the components never mutate their props.
 */

import type { SocialLink } from '@/lib/types/top-header';

/** A single selectable area of interest in the contact form. */
export interface ContactAreaInteres {
  /** Stable kebab-case id used as the checkbox `value`, e.g. "medicion-fluidos". */
  readonly id: string;
  /** Visible label, e.g. "Medición de Fluidos". */
  readonly label: string;
}

/** Props accepted by `ContactHero.astro`. */
export interface ContactHeroProps {
  /** Full headline text; the `highlightedWord` substring is wrapped in a `<span class="text-primary">`. */
  readonly headline: string;
  /** Substring of `headline` rendered in primary teal. */
  readonly highlightedWord: string;
  /** Subtitle paragraph rendered under the headline. */
  readonly subtitle: string;
}

/** Placeholder texts for the contact form fields. */
export interface ContactFormPlaceholders {
  /** Placeholder for the Nombre Completo input. */
  readonly nombre: string;
  /** Placeholder for the Empresa input. */
  readonly empresa: string;
  /** Placeholder for the Correo Electrónico input. */
  readonly email: string;
  /** Placeholder for the Teléfono input. */
  readonly telefono: string;
  /** Placeholder for the Mensaje textarea. */
  readonly mensaje: string;
}

/** Configuration for the contact form submission and copy. */
export interface ContactFormConfig {
  /**
   * Form `action` target. Defaults to `/api/v1/contacts`, the future backend
   * endpoint (a separate change will implement it). Configurable so the
   * frontend is ready to consume it without code changes.
   */
  readonly action: string;
  /** Visible label of the submit button, e.g. "ENVIAR MENSAJE". */
  readonly submitLabel: string;
  /** Placeholder texts for each form field. */
  readonly placeholders: ContactFormPlaceholders;
}

/** Props accepted by `ContactForm.astro`. */
export interface ContactFormProps {
  /** Areas of interest rendered as grouped checkboxes. */
  readonly areas: readonly ContactAreaInteres[];
  /** Form submission config (action + submit label + placeholders). */
  readonly config: ContactFormConfig;
}

/** Props accepted by `ContactBar.astro`. */
export interface ContactBarProps {
  /** Phone number in display format, e.g. "+56 2 29079067". */
  readonly phone: string;
  /** Email address in display format, e.g. "contacto@riff.cl". */
  readonly email: string;
  /** Clickable `tel:` href built from the phone number. */
  readonly phoneHref: string;
  /** Clickable `mailto:` href built from the email address. */
  readonly emailHref: string;
  /**
   * Social network links, reusing the `SocialLink` contract from
   * `top-header` so the site keeps a single source of truth for the social
   * presence. Only configured URLs render.
   */
  readonly socialLinks: readonly SocialLink[];
}
