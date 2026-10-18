import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, TestApp } from './testing-app';

async function tinyJpeg(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer();
}

describe('Uploads (uploads smoke over the real AppModule pipeline)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  beforeEach(() => {
    testApp.fileStoragePort.recordedUploads.length = 0;
  });

  it('editor can upload a gallery image (201 envelope with url + storagePath, webp normalized)', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/api/v1/uploads/images')
      .set('Authorization', 'Bearer editor-token')
      .attach('file', await tinyJpeg(), 'catalogo.jpg');

    expect(response.status).toBe(201);
    expect(response.body.error).toBeNull();
    expect(response.body.data.url).toContain('https://storage.googleapis.com/fake-bucket/');
    expect(testApp.fileStoragePort.recordedUploads[0].storagePath).toMatch(
      /^productos\/tmp-[0-9a-f-]{36}\/catalogo\.webp$/,
    );
    expect(testApp.fileStoragePort.recordedUploads[0].contentType).toBe('image/webp');
  });

  it('editor can upload a PDF tech sheet (201, uploaded untouched)', async () => {
    const pdf = Buffer.from('%PDF-1.7 fake body');
    const response = await request(testApp.app.getHttpServer())
      .post('/api/v1/uploads/tech-sheet')
      .set('Authorization', 'Bearer editor-token')
      .attach('file', pdf, 'ficha.pdf');

    expect(response.status).toBe(201);
    expect(response.body.data.storagePath).toMatch(/^productos\/tmp-[0-9a-f-]{36}\/ficha\.pdf$/);
    expect(testApp.fileStoragePort.recordedUploads[0].contentType).toBe('application/pdf');
  });

  it('unauthenticated upload is rejected with 401 envelope', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/api/v1/uploads/images')
      .attach('file', await tinyJpeg(), 'catalogo.jpg');

    expect(response.status).toBe(401);
    expect(response.body.error).not.toBeNull();
  });

  it('view-only role is rejected with 403 envelope', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/api/v1/uploads/images')
      .set('Authorization', 'Bearer readonly-token')
      .attach('file', await tinyJpeg(), 'catalogo.jpg');

    expect(response.status).toBe(403);
    expect(response.body.error).not.toBeNull();
  });

  it('declared MIME outside the catalog allowlist is rejected with 400 (no upload)', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post('/api/v1/uploads/images')
      .set('Authorization', 'Bearer editor-token')
      .attach('file', Buffer.from('GIF89a0000'), 'fake.gif');

    expect(response.status).toBe(400);
    expect(testApp.fileStoragePort.recordedUploads).toHaveLength(0);
  });
});
