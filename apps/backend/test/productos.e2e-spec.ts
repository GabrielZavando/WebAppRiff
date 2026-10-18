import request from 'supertest';

import { createTestApp, TestApp } from './testing-app';

describe('Productos write routes (real AppModule pipeline)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('admin can update an existing producto (200 envelope)', async () => {
      const response = await request(testApp.app.getHttpServer())
        .patch('/api/v1/products/prod-001')
        .set('Authorization', 'Bearer admin-token')
        .send({ titulo: 'Título actualizado' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeNull();
      expect(response.body.data).toHaveProperty('id', 'prod-001');
      expect(response.body.data).toHaveProperty('titulo', 'Título actualizado');
    });

    it('editor can update (role guard allows editor)', async () => {
      const response = await request(testApp.app.getHttpServer())
        .patch('/api/v1/products/prod-001')
        .set('Authorization', 'Bearer editor-token')
        .send({ destacado: true });

      expect(response.status).toBe(200);
    });

    it('returns 401 without token', async () => {
      await request(testApp.app.getHttpServer())
        .patch('/api/v1/products/prod-001')
        .send({ titulo: 'x' })
        .expect(401);
    });

    it('returns 404 for an unknown producto id', async () => {
      const response = await request(testApp.app.getHttpServer())
        .patch('/api/v1/products/does-not-exist')
        .set('Authorization', 'Bearer admin-token')
        .send({ titulo: 'x' });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('admin can update an existing producto (200 envelope)', async () => {
      const response = await request(testApp.app.getHttpServer())
        .put('/api/v1/products/prod-002')
        .set('Authorization', 'Bearer admin-token')
        .send({ titulo: 'Título actualizado por PUT' });

      expect(response.status).toBe(200);
      expect(response.body.error).toBeNull();
      expect(response.body.data).toHaveProperty('titulo', 'Título actualizado por PUT');
    });

    it('returns 401 without token', async () => {
      await request(testApp.app.getHttpServer())
        .put('/api/v1/products/prod-002')
        .send({ titulo: 'x' })
        .expect(401);
    });
  });
});
