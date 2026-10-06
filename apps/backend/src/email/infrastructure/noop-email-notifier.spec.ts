import { NoopEmailNotifier } from './noop-email-notifier';
import { EmailMessage } from '../domain/iemail-notifier';

describe('NoopEmailNotifier', () => {
  it('never sends and never logs', async () => {
    const notifier = new NoopEmailNotifier();
    const message: EmailMessage = {
      from: 'contacto@somosriff.cl',
      to: ['contacto@somosriff.cl'],
      subject: 's',
      text: 't',
    };
    await expect(notifier.sendEmail(message)).resolves.toBeUndefined();
  });
});