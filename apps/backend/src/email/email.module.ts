import { Module } from '@nestjs/common';
import { I_EMAIL_NOTIFIER } from './domain/iemail-notifier';
import { ResendEmailNotifier } from './infrastructure/resend-email-notifier';

/**
 * Email notification module. Exposes the `I_EMAIL_NOTIFIER` token bound to the
 * Resend HTTP adapter so consumers (contacts, quotes) can inject the port.
 * Tests override the token with a fake (or `NoopEmailNotifier`).
 */
@Module({
  providers: [{ provide: I_EMAIL_NOTIFIER, useClass: ResendEmailNotifier }],
  exports: [I_EMAIL_NOTIFIER],
})
export class EmailModule {}