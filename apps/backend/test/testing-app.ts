import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from '../src/infrastructure/firebase/firebase.tokens';
import { FILE_STORAGE_PORT } from '../src/infrastructure/storage/file-storage.port';
import { I_EMAIL_NOTIFIER } from '../src/email/domain/iemail-notifier';
import { buildValidationOptions } from '../src/common/config/validation.config';
import { createFakeFirestore } from './fake-firestore';
import { SEED_DATA } from './fixtures/seed-data';

export interface RecordedUpload {
  buffer: Buffer;
  storagePath: string;
  contentType: string;
}

export interface TestApp {
  app: INestApplication;
  /** In-memory Firestore used by the app (never touches real Firebase). */
  firestore: ReturnType<typeof createFakeFirestore>;
  /** Fake email port that records every notification (never sends a real email). */
  emailNotifierMock: { sendEmail: jest.Mock };
  /** Fake storage port recording every upload (never touches real GCS). */
  fileStoragePort: {
    upload: jest.Mock;
    recordedUploads: RecordedUpload[];
  };
}

/**
 * Boots the real NestJS AppModule (HTTP pipeline, pipes, guards, envelope
 * interceptor) with the in-memory Firestore fake, a mocked Firebase Auth and a
 * faked email notifier. No real Firebase credentials are needed and no real
 * email can ever be sent from the test suite.
 */
export async function createTestApp(): Promise<TestApp> {
  const emailNotifierMock = { sendEmail: jest.fn(async () => undefined) };

  const authMock = {
    verifyIdToken: jest.fn(async (token: string) => {
      switch (token) {
        case 'admin-token':
          return { uid: 'u-admin', role: 'admin' } as never;
        case 'editor-token':
          return { uid: 'u-editor', role: 'editor' } as never;
        case 'readonly-token':
          return { uid: 'u-readonly', role: 'view-only' } as never;
        default:
          throw new Error('Invalid token');
      }
    }),
  };

  const firestore = createFakeFirestore(SEED_DATA);
  const recordedUploads: RecordedUpload[] = [];
  const fileStoragePort = {
    recordedUploads,
    upload: jest.fn(async (buffer: Buffer, storagePath: string, contentType: string) => {
      recordedUploads.push({ buffer, storagePath, contentType });
      return `https://storage.googleapis.com/fake-bucket/${storagePath}`;
    }),
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FIRESTORE)
    .useValue(firestore)
    .overrideProvider(FIREBASE_APP)
    .useValue({})
    .overrideProvider(FIREBASE_AUTH)
    .useValue(authMock)
    .overrideProvider(FILE_STORAGE_PORT)
    .useValue(fileStoragePort)
    .overrideProvider(I_EMAIL_NOTIFIER)
    .useValue(emailNotifierMock)
    .compile();

  const app = moduleFixture.createNestApplication();
  // Mirrors apps/backend/src/main.ts (global pipe + prefix) so e2e matches prod.
  app.useGlobalPipes(new ValidationPipe(buildValidationOptions()));
  // Let e2e tests isolate the rate limiter with per-test X-Forwarded-For values.
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  await app.init();

  // Belt-and-suspenders: never let a developer .env fire real emails.
  delete process.env.RESEND_API_KEY;

  return { app, firestore, emailNotifierMock, fileStoragePort };
}