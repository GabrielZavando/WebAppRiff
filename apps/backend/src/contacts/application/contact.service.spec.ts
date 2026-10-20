import { Logger } from '@nestjs/common';
import { ContactService } from './contact.service';
import { EmailMessage, IEmailNotifier } from '../../email/domain/iemail-notifier';
import { IContactRepository } from '../domain/icontact.repository';
import { Contacto } from '../domain/contacto.entity';

const makeContacto = (overrides: Partial<Contacto> = {}): Contacto => ({
  id: 'contact-1',
  nombre: 'Juan Pérez',
  empresa: 'Empresa SA',
  email: 'juan@empresa.com',
  telefono: '+56912345678',
  areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
  mensaje: 'Necesito soporte técnico',
  creadoEn: new Date(),
  ...overrides,
});

describe('ContactService', () => {
  let service: ContactService;
  let notifier: { sendEmail: jest.Mock };
  let repository: { create: jest.Mock };
  let errorSpy: jest.SpyInstance;

  const validInput = {
    nombre: 'Juan Pérez',
    empresa: 'Empresa SA',
    email: 'juan@empresa.com',
    telefono: '+56912345678',
    areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
    mensaje: 'Necesito soporte técnico',
  };

  beforeEach(() => {
    repository = { create: jest.fn().mockResolvedValue(makeContacto()) };
    notifier = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    service = new ContactService(
      repository as unknown as IContactRepository,
      notifier as unknown as IEmailNotifier,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('submit — honeypot', () => {
    it('returns simulated success without persisting or sending when the honeypot is filled', async () => {
      const result = await service.submit({ ...validInput, website: 'http://spam.example' });

      expect(repository.create).not.toHaveBeenCalled();
      expect(notifier.sendEmail).not.toHaveBeenCalled();
      expect(result.nombre).toBe('Juan Pérez');
      expect(result.mensaje).toBe('Necesito soporte técnico');
    });

    it('persists and sends when the honeypot is empty or absent', async () => {
      const result = await service.submit({ ...validInput, website: '' });

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(notifier.sendEmail).toHaveBeenCalledTimes(1);
      expect(result.areasDeInteres).toEqual(['medicion-fluidos', 'tratamiento-agua']);
    });
  });

  describe('submit — persistence', () => {
    it('persists the contact before notifying', async () => {
      const calls: string[] = [];
      repository.create.mockImplementation(async () => {
        calls.push('persist');
        return makeContacto();
      });
      notifier.sendEmail.mockImplementation(async () => {
        calls.push('notify');
      });

      await service.submit(validInput);

      expect(calls).toEqual(['persist', 'notify']);
      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Juan Pérez',
        empresa: 'Empresa SA',
        email: 'juan@empresa.com',
        telefono: '+56912345678',
        areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
        mensaje: 'Necesito soporte técnico',
      });
    });

    it('propagates persistence failures without notifying', async () => {
      repository.create.mockRejectedValue(new Error('firestore down'));

      await expect(service.submit(validInput)).rejects.toThrow('firestore down');
      expect(notifier.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('submit — email delivery', () => {
    it('delegates to the notifier with text and html containing every field', async () => {
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
      expect(message.html).toContain('Nombre');
      expect(message.html).toContain('Juan Pérez');
    });

    it('logs the failure and keeps the persisted lead available', async () => {
      notifier.sendEmail.mockRejectedValue(new Error('Email delivery failed'));

      await expect(service.submit(validInput)).resolves.toEqual({
        nombre: 'Juan Pérez',
        empresa: 'Empresa SA',
        email: 'juan@empresa.com',
        telefono: '+56912345678',
        areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
        mensaje: 'Necesito soporte técnico',
      });
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const logged = String(errorSpy.mock.calls[0][0]);
      expect(logged).toContain('contact');
      expect(logged).toContain('contact-1');
      expect(logged).not.toContain('re_');
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
