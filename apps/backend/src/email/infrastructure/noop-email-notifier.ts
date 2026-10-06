import { Injectable } from '@nestjs/common';
import { EmailMessage, IEmailNotifier } from '../domain/iemail-notifier';

/**
 * Deterministic no-op `IEmailNotifier` for tests and explicit injection: it
 * never sends and never logs. Preferred over the real adapter whenever the
 * caller must not depend on the environment.
 */
@Injectable()
export class NoopEmailNotifier implements IEmailNotifier {
  async sendEmail(_message: EmailMessage): Promise<void> {
    void _message;
    // Intentionally does nothing.
  }
}