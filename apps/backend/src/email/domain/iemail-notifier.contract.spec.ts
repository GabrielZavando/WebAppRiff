import {
  EmailMessage,
  IEmailNotifier,
  I_EMAIL_NOTIFIER,
} from './iemail-notifier';

/**
 * Contract test: locks the shape of the `IEmailNotifier` port so any future
 * transport implementation (Resend, SMTP, queue, no-op) is forced to satisfy
 * the same interface and message type.
 */
class InMemoryNotifier implements IEmailNotifier {
  public messages: EmailMessage[] = [];

  async sendEmail(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }
}

describe('IEmailNotifier contract', () => {
  it('exposes a stable DI token', () => {
    expect(I_EMAIL_NOTIFIER).toBe('I_EMAIL_NOTIFIER');
  });

  it('allows an implementation to accept a valid message', async () => {
    const notifier = new InMemoryNotifier();
    const message: EmailMessage = {
      from: 'contacto@somosriff.cl',
      to: ['contacto@somosriff.cl'],
      subject: 'Nuevo contacto',
      text: 'Nombre: Juan\nEmail: juan@example.com',
    };
    await notifier.sendEmail(message);
    expect(notifier.messages).toEqual([message]);
  });

  it('accepts multiple recipients', async () => {
    const notifier = new InMemoryNotifier();
    await notifier.sendEmail({
      from: 'contacto@somosriff.cl',
      to: ['a@somosriff.cl', 'b@somosriff.cl'],
      subject: 's',
      text: 't',
    });
    expect(notifier.messages[0].to).toHaveLength(2);
  });
});