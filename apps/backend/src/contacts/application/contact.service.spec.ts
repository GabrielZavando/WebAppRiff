import { ContactService } from './contact.service';
import { I_EMAIL_NOTIFIER, IEmailNotifier } from '../../email/domain/iemail-notifier';
import { EmailMessage } from '../../email/domain/iemail-notifier';

describe('ContactService', () => {
  let service: ContactService;
  let notifier: { sendEmail: jest.Mock };

  beforeEach(() => {
    notifier = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    service = new ContactService(notifier as unknown as IEmailNotifier);
  });

  const validInput = {
    nombre: 'Juan Pérez',
    empresa: 'Empresa SA',
    email: 'juan@empresa.com',
    telefono: '+56912345678',
    areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
    mensaje: 'Necesito soporte técnico',
  };

  describe('submit — honeypot', () => {
    it('returns simulated success without sending when the honeypot is filled', async () => {
      const result = await service.submit({ ...validInput, website: 'http://spam.example' });
      expect(notifier.sendEmail).not.toHaveBeenCalled();
      expect(result.nombre).toBe('Juan Pérez');
      expect(result.mensaje).toBe('Necesito soporte técnico');
    });

    it('sends when the honeypot is empty or absent', async () => {
      const result = await service.submit({ ...validInput, website: '' });
      expect(notifier.sendEmail).toHaveBeenCalledTimes(1);
      expect(result.areasDeInteres).toEqual(['medicion-fluidos', 'tratamiento-agua']);
    });
  });

  describe('submit — email delivery', () => {
    it('delegates to the notifier with a message containing every field', async () => {
      await service.submit(validInput);

      expect(notifier.sendEmail).toHaveBeenCalledTimes(1);
      const message: EmailMessage = notifier.sendEmail.mock.calls[0][0];
      expect(message.subject).toContain('contacto');
      expect(message.text).toContain('Nombre: Juan Pérez');
      expect(message.text).toContain('Empresa: Empresa SA');
      expect(message.text).toContain('Email: juan@empresa.com');
      expect(message.text).toContain('Teléfono: +56912345678');
      expect(message.text).toContain('Áreas de interés: medicion-fluidos, tratamiento-agua');
      expect(message.text).toContain('Mensaje: Necesito soporte técnico');
    });

    it('propagates notifier failures so the endpoint can surface the error', async () => {
      notifier.sendEmail.mockRejectedValue(new Error('Email delivery failed'));
      await expect(service.submit(validInput)).rejects.toThrow(
        'Email delivery failed',
      );
    });

    it('returns a receipt echoing the submitted fields', async () => {
      const result = await service.submit(validInput);
      expect(result).toEqual({
        nombre: 'Juan Pérez',
        empresa: 'Empresa SA',
        email: 'juan@empresa.com',
        telefono: '+56912345678',
        areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
        mensaje: 'Necesito soporte técnico',
      });
    });
  });
});