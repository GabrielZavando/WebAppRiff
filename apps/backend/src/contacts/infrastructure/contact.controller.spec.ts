import { ContactController } from './contact.controller';
import { ContactService } from '../application/contact.service';
import { ContactSubmission } from '../application/contact.service';

const makeSubmission = (overrides: Partial<ContactSubmission> = {}): ContactSubmission => ({
  nombre: 'Juan',
  empresa: 'Empresa SA',
  email: 'juan@example.com',
  telefono: '+56912345678',
  areasDeInteres: ['medicion-fluidos'],
  mensaje: 'Solicito soporte',
  ...overrides,
});

describe('ContactController', () => {
  let controller: ContactController;
  let service: { submit: jest.Mock };

  beforeEach(() => {
    service = { submit: jest.fn() };
    controller = new ContactController(service as unknown as ContactService);
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('delegates to service.submit and returns the submission', async () => {
      const submission = makeSubmission();
      service.submit.mockResolvedValue(submission);
      const dto = {
        nombre: 'Juan',
        empresa: 'Empresa SA',
        email: 'juan@example.com',
        telefono: '+56912345678',
        areasDeInteres: ['medicion-fluidos'],
        mensaje: 'Solicito soporte',
      };
      const result = await controller.create(dto as never);
      expect(service.submit).toHaveBeenCalledWith(dto);
      expect(result.email).toBe('juan@example.com');
    });

    it('propagates notifier failures as a rejection (mapped to 502 by the pipeline)', async () => {
      service.submit.mockRejectedValue(new Error('Email delivery failed'));
      await expect(
        controller.create(makeSubmission() as never),
      ).rejects.toThrow('Email delivery failed');
    });

    it('routes honeypot-filled payloads through the service (silent simulated success)', async () => {
      service.submit.mockResolvedValue(makeSubmission());
      const dto = {
        nombre: 'Bot',
        empresa: 'Spam',
        email: 'bot@spam.example',
        telefono: '123',
        mensaje: 'spam',
        website: 'http://spam.example',
      };
      await controller.create(dto as never);
      expect(service.submit).toHaveBeenCalledWith(dto);
    });
  });
});