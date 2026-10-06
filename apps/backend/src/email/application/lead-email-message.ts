import { EmailMessage } from '../domain/iemail-notifier';

const CONTACT_TO_EMAIL_ENV = 'CONTACT_TO_EMAIL';
const CONTACT_FROM_EMAIL_ENV = 'CONTACT_FROM_EMAIL';
const DEFAULT_TO_EMAIL = 'contacto@somosriff.cl';

/** A single labelled field rendered as a `Label: value` line in the email body. */
export interface LeadEmailField {
  readonly label: string;
  readonly value: string;
}

/**
 * Builds the `EmailMessage` for a lead-capture notification (contact or quote
 * submission). Centralizes the recipient/sender resolution so every caller uses
 * the same defaults:
 * - `to` from `CONTACT_TO_EMAIL`, falling back to `contacto@somosriff.cl`.
 * - `from` from `CONTACT_FROM_EMAIL`, falling back to the default inbox (the
 *   `somosriff.cl` domain must be verified in Resend).
 * - `text` is a plain-text block with every field as a `Label: value` line.
 */
export function buildLeadEmailMessage(
  subject: string,
  fields: readonly LeadEmailField[],
): EmailMessage {
  const to = process.env[CONTACT_TO_EMAIL_ENV] || DEFAULT_TO_EMAIL;
  const from = process.env[CONTACT_FROM_EMAIL_ENV] || DEFAULT_TO_EMAIL;
  const text = fields.map((field) => `${field.label}: ${field.value}`).join('\n');
  return { from, to: [to], subject, text };
}