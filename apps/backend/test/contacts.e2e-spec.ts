import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './testing-app';

/**
 * End-to-end suite for `POST /api/v1/contacts`: validation, honeypot and email
 * notification through the faked `IEmailNotifier` port.
 */
describe('POST /api/v1/contacts (e2e)', () => {
  let app: INestApplication;
  let emailNotifierMock: { sendEmail: jest.Mock };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    emailNotifierMock = testApp.emailNotifierMock;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    emailNotifierMock.sendEmail.mockClear();
  });

  it('accepts a contact submission (201) and notifies by email with all fields', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({
        nombre: 'Ana López',
        empresa: 'Corp Ltda',
        email: 'ana@corp.com',
        telefono: '+56912345678',
        areasDeInteres: ['medicion-fluidos'],
        mensaje: 'Necesito soporte técnico',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('nombre', 'Ana López');
        expect(res.body.data).toHaveProperty('email', 'ana@corp.com');
        expect(res.body.data).toHaveProperty('areasDeInteres', ['medicion-fluidos']);
        expect(res.body.error).toBeNull();
      })
      .then(() => {
        expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
        const message = emailNotifierMock.sendEmail.mock.calls[0][0];
        expect(message.text).toContain('Nombre: Ana López');
        expect(message.text).toContain('Mensaje: Necesito soporte técnico');
      });
  });

  it('works without the website honeypot field (backward compatible)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({
        nombre: 'Ana',
        empresa: 'Corp',
        email: 'ana@corp.com',
        telefono: '+56912345678',
        mensaje: 'Hola',
      })
      .expect(201)
      .then(() => {
        expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
      });
  });

  it('rejects missing required fields (400)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({ nombre: 'Ana' })
      .expect(400);
  });

  it('rejects unknown fields via whitelist (400)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({
        nombre: 'Ana',
        empresa: 'Corp',
        email: 'ana@corp.com',
        telefono: '+56912345678',
        mensaje: 'Hola',
        hacker: 'injected',
      })
      .expect(400);
  });

  it('simulates success for a honeypot-filled request without notifying', () => {
    return request(app.getHttpServer())
      .post('/api/v1/contacts')
      .send({
        nombre: 'Bot',
        empresa: 'Spam',
        email: 'bot@spam.example',
        telefono: '123',
        mensaje: 'spam',
        website: 'http://spam.example',
      })
      .expect(201)
      .then(() => {
        expect(emailNotifierMock.sendEmail).not.toHaveBeenCalled();
      });
  });
});