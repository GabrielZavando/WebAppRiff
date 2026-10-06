/**
 * Port that sends transactional email notifications (contact form submissions,
 * quote requests).
 *
 * Declared in `domain/` as an abstraction so application services depend on
 * this interface (DIP) and any concrete transport (HTTP provider, no-op) is
 * injected from `infrastructure/` via the `I_EMAIL_NOTIFIER` token.
 *
 * Unlike `ICatalogChangeNotifier` (fire-and-forget), `sendEmail` is awaited and
 * MUST throw on failure: the HTTP response of the lead-capture endpoints depends
 * on the delivery outcome so the frontend can show an error and keep the form.
 */
export interface EmailMessage {
  /** Verified sender address (e.g. `contacto@somosriff.cl`). */
  readonly from: string;
  /** Recipient addresses. */
  readonly to: readonly string[];
  /** Subject line of the email. */
  readonly subject: string;
  /** Plain-text body with all the form fields. */
  readonly text: string;
}

export interface IEmailNotifier {
  /**
   * Send an email. Implementations MUST throw when the delivery fails or times
   * out and MUST NOT leak secrets (API keys, tokens) in thrown messages.
   */
  sendEmail(message: EmailMessage): Promise<void>;
}

export const I_EMAIL_NOTIFIER = 'I_EMAIL_NOTIFIER';