import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './testing-app';

/**
 * End-to-end suite against the real NestJS AppModule (HTTP pipeline, pipes,
 * guards, envelope interceptor) with the in-memory Firestore fake, a mocked
 * Firebase Auth and a faked email notifier. No real Firebase credentials are
 * needed and no real email is ever sent from the test suite.
 */
describe('App (e2e)', () => {
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

  describe('GET /health', () => {
    it('returns 200 with status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('firebase');
        });
    });
  });

  describe('GET /api/v1/products', () => {
    it('returns a paginated envelope (server-side slice, plain array data)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=24')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(res.body).toHaveProperty('error', null);
          expect(res.body.meta).toHaveProperty('path', '/api/v1/products?page=1&limit=24');
          expect(res.body.meta).toHaveProperty('timestamp');
        });
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('returns the product detail for a known slug', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/slug/mwn-medidor-industrial')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('slug', 'mwn-medidor-industrial');
          expect(res.body.data).toHaveProperty('titulo');
        });
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns only active categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories?activa=true')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
          expect(
            res.body.data.every(
              (c: { activa?: boolean }) => c.activa === true,
            ),
          ).toBe(true);
        });
    });
  });

  describe('GET /api/v1/subcategories', () => {
    it('returns only active subcategories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/subcategories?activa=true')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('POST /api/v1/quotes', () => {
    it('creates a quote (201) with pendiente estado and notifies by email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          telefono: '+56912345678',
          nombre_empresa: 'Test Corp',
          rut: '12.345.678-9',
          mensaje: 'Necesito medición de caudal',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('nombre', 'Test User');
          expect(res.body.data).toHaveProperty('email', 'test@example.com');
          expect(res.body.data).toHaveProperty('rut', '12.345.678-9');
          expect(res.body.data).toHaveProperty('estado', 'pendiente');
          expect(res.body.data).toHaveProperty('creadoEn');
        })
        .then(() => {
          expect(emailNotifierMock.sendEmail).toHaveBeenCalledTimes(1);
        });
    });

    it('simulates success for a honeypot-filled request without notifying', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes')
        .send({
          nombre: 'Bot',
          email: 'bot@spam.example',
          nombre_empresa: 'Spam',
          mensaje: 'spam',
          website: 'http://spam.example',
        })
        .expect(201)
        .then(() => {
          expect(emailNotifierMock.sendEmail).not.toHaveBeenCalled();
        });
    });

    it('rejects missing required fields (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes')
        .send({ nombre: 'Test User' })
        .expect(400);
    });

    it('rejects extra unknown fields via whitelist (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/quotes')
        .send({
          nombre: 'Test',
          email: 't@e.com',
          nombre_empresa: 'Emp',
          mensaje: 'Hola',
          hacker: 'injected',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/quotes (admin guard)', () => {
    it('returns 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/quotes').expect(401);
    });

    it('returns 403 for an editor role token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/quotes')
        .set('Authorization', 'Bearer editor-token')
        .expect(403);
    });

    it('returns 200 for an admin role token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/quotes')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('exposes pagination meta merged at envelope level ({data, meta})', () => {
      return request(app.getHttpServer())
        .get('/api/v1/quotes?estado=atendida&page=1&limit=1')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0]).toHaveProperty('estado', 'atendida');
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 1);
          expect(res.body.meta).toHaveProperty('total', 1);
          expect(res.body.error).toBeNull();
        });
    });
  });

  describe('GET /api/v1/quotes/:id (admin guard)', () => {
    it('returns the quote for an admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/quotes/quote-001')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', 'quote-001');
          expect(res.body.data).toHaveProperty('estado', 'pendiente');
        });
    });

    it('returns 404 for an unknown id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/quotes/no-existe')
        .set('Authorization', 'Bearer admin-token')
        .expect(404);
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/quotes/quote-001').expect(401);
    });
  });

  describe('PATCH /api/v1/quotes/:id (admin/editor)', () => {
    it('editor can update estado to pendiente', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/quotes/quote-002')
        .set('Authorization', 'Bearer editor-token')
        .send({ estado: 'pendiente' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('estado', 'pendiente');
        });
    });

    it('returns 401 without token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/quotes/quote-001')
        .send({ estado: 'atendida' })
        .expect(401);
    });

    it('returns 400 on invalid estado value', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/quotes/quote-001')
        .set('Authorization', 'Bearer admin-token')
        .send({ estado: 'invalido' })
        .expect(400);
    });
  });
});