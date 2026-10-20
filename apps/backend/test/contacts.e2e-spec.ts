import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createFakeFirestore } from './fake-firestore';
import { createTestApp } from './testing-app';

type FakeFirestore = ReturnType<typeof createFakeFirestore>;

const listContacts = async (
  firestore: FakeFirestore,
): Promise<Array<Record<string, unknown>>> => {
  const snapshot = await firestore.collection('contactos').get();
  return snapshot.docs.map((doc) => doc.data() ?? {});
};

/**
 * End-to-end suite for `POST /api/v1/contacts`: validation, honeypot, contact
 * persistence in Firestore and best-effort email notification through the
 * faked `IEmailNotifier` port.
 */
describe('POST /api/v1/contacts (e2e)', () => {
  let app: INestApplication;
  let firestore: FakeFirestore;
  let emailNotifierMock: { sendEmail: jest.Mock };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    firestore = testApp.firestore;
    emailNotifierMock = testApp.emailNotifierMock;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    emailNotifierMock.sendEmail.mockReset();
    emailNotifierMock.sendEmail.mockResolvedValue(undefined);
  });

  it('persists the contact, notifies by email and returns 201', async () => {
    const before = await listContacts(firestore);

    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.1')
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
      });

    const after = await listContacts(firestore);
    expect(after).toHaveLength(before.length + 1);
    expect(after.find((contact) => contact.email === 'ana@corp.com')).toMatchObject({
      nombre: 'Ana López',
      empresa: 'Corp Ltda',
      telefono: '+56912345678',
      areasDeInteres: ['medicion-fluidos'],
      mensaje: 'Necesito soporte técnico',
    });

    expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
    const message = emailNotifierMock.sendEmail.mock.calls[0][0];
    expect(message.text).toContain('Nombre: Ana López');
    expect(message.text).toContain('Mensaje: Necesito soporte técnico');
    expect(message.html).toContain('Ana López');
  });

  it('returns 201 and keeps the persisted contact when the email fails', async () => {
    emailNotifierMock.sendEmail.mockRejectedValue(new Error('Email delivery failed'));
    const before = await listContacts(firestore);

    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({
        nombre: 'Ana López',
        empresa: 'Corp Ltda',
        email: 'ana-failure@corp.com',
        telefono: '+56912345678',
        mensaje: 'Necesito soporte técnico',
      })
      .expect(201);

    const after = await listContacts(firestore);
    expect(after).toHaveLength(before.length + 1);
    expect(after.find((contact) => contact.email === 'ana-failure@corp.com')).toBeDefined();
  });

  it('works without the website honeypot field (backward compatible)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({
        nombre: 'Ana',
        empresa: 'Corp',
        email: 'ana@corp.com',
        telefono: '+56912345678',
        mensaje: 'Hola',
      })
      .expect(201);

    expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('rejects missing required fields (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.4')
      .send({ nombre: 'Ana' })
      .expect(400);
  });

  it('rejects unknown fields via whitelist (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.5')
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

  it('simulates success for a honeypot-filled request without persisting nor notifying', async () => {
    const before = await listContacts(firestore);

    await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('X-Forwarded-For', '10.0.0.6')
      .send({
        nombre: 'Bot',
        empresa: 'Spam',
        email: 'bot@spam.example',
        telefono: '123',
        mensaje: 'spam',
        website: 'http://spam.example',
      })
      .expect(201);

    const after = await listContacts(firestore);
    expect(after).toHaveLength(before.length);
    expect(emailNotifierMock.sendEmail).not.toHaveBeenCalled();
  });
});
