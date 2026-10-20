import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createFakeFirestore } from './fake-firestore';
import { createTestApp } from './testing-app';

type FakeFirestore = ReturnType<typeof createFakeFirestore>;

const listQuotes = async (
  firestore: FakeFirestore,
): Promise<Array<Record<string, unknown>>> => {
  const snapshot = await firestore.collection('cotizaciones').get();
  return snapshot.docs.map((doc) => doc.data() ?? {});
};

/**
 * End-to-end suite for `POST /api/v1/quotes`: persistence in Firestore and
 * best-effort email notification through the faked `IEmailNotifier` port.
 */
describe('POST /api/v1/quotes (e2e)', () => {
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

  it('persists the quote, notifies by email and returns 201', async () => {
    const before = await listQuotes(firestore);

    await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .send({
        nombre: 'Juan Pérez',
        email: 'juan.quote@empresa.com',
        telefono: '+56912345678',
        nombre_empresa: 'Empresa SA',
        rut: '12.345.678-9',
        mensaje: 'Necesito medición de caudal',
      })
      .expect(201);

    const after = await listQuotes(firestore);
    expect(after).toHaveLength(before.length + 1);
    expect(after.find((quote) => quote.email === 'juan.quote@empresa.com')).toMatchObject({
      nombre: 'Juan Pérez',
      telefono: '+56912345678',
      nombre_empresa: 'Empresa SA',
      rut: '12.345.678-9',
      mensaje: 'Necesito medición de caudal',
      estado: 'pendiente',
    });

    expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
    const message = emailNotifierMock.sendEmail.mock.calls[0][0];
    expect(message.text).toContain('Nombre: Juan Pérez');
    expect(message.text).toContain('Empresa: Empresa SA');
    expect(message.html).toContain('Juan Pérez');
  });

  it('returns 201 and keeps the persisted quote when the email fails', async () => {
    emailNotifierMock.sendEmail.mockRejectedValue(new Error('Email delivery failed'));
    const before = await listQuotes(firestore);

    await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .send({
        nombre: 'Ana',
        email: 'ana.quote@empresa.com',
        nombre_empresa: 'Empresa SA',
        mensaje: 'Solicitud general',
      })
      .expect(201);

    const after = await listQuotes(firestore);
    expect(after).toHaveLength(before.length + 1);
    expect(after.find((quote) => quote.email === 'ana.quote@empresa.com')).toBeDefined();
  });
});
