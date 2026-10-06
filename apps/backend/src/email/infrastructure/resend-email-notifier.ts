import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage, IEmailNotifier } from '../domain/iemail-notifier';

const RESEND_API_URL = 'https://api.resend.com/emails';
const RESEND_API_KEY_ENV = 'RESEND_API_KEY';
const REQUEST_TIMEOUT_MS = 10_000;
const EMAIL_DISABLED_WARN =
  '[email] sendEmail skipped: RESEND_API_KEY is not configured (no-op in dev/test).';

/**
 * Concrete `IEmailNotifier` that delivers messages through the Resend HTTP API
 * (`POST https://api.resend.com/emails`) using native `fetch` with a bounded
 * timeout — no SMTP server, no extra dependency.
 *
 * Design notes:
 * - No-op with a warning when `RESEND_API_KEY` is unset, so local/dev and
 *   deployments without credentials never fail.
 * - Awaited: `sendEmail` resolves on success and THROWS on failure (non-2xx,
 *   network error or timeout), because the lead-capture endpoints surface the
 *   delivery outcome to the user.
 * - Authenticates with `Authorization: Bearer <key>`. The key is never logged
 *   and never included in thrown messages.
 */
@Injectable()
export class ResendEmailNotifier implements IEmailNotifier {
  private readonly logger = new Logger(ResendEmailNotifier.name);

  async sendEmail(message: EmailMessage): Promise<void> {
    const apiKey = process.env[RESEND_API_KEY_ENV];
    if (!apiKey) {
      this.logger.warn(EMAIL_DISABLED_WARN);
      return;
    }
    await this.dispatch(apiKey, message);
  }

  private async dispatch(apiKey: string, message: EmailMessage): Promise<void> {
    let response: Response;
    try {
      response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: message.from,
          to: [...message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // String(error) for a fetch TypeError/AbortError never contains the key.
      throw new Error(`Email delivery failed: ${String(error)}`);
    }
    if (!response.ok) {
      throw new Error(`Email delivery failed: HTTP ${response.status}`);
    }
  }
}