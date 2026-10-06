import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from '../src/infrastructure/firebase/firebase.tokens';
import { I_EMAIL_NOTIFIER } from '../src/email/domain/iemail-notifier';
import { buildValidationOptions } from '../src/common/config/validation.config';
import { createFakeFirestore } from './fake-firestore';
import { SEED_DATA } from './fixtures/seed-data';

export interface TestApp {
  app: INestApplication;
  /** Fake email port that records every notification (never sends a real email). */
  emailNotifierMock: { sendEmail: jest.Mock };
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
        default:
          throw new Error('Invalid token');
      }
    }),
  };

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(FIRESTORE)
    .useValue(createFakeFirestore(SEED_DATA))
    .overrideProvider(FIREBASE_APP)
    .useValue({})
    .overrideProvider(FIREBASE_AUTH)
    .useValue(authMock)
    .overrideProvider(I_EMAIL_NOTIFIER)
    .useValue(emailNotifierMock)
    .compile();

  const app = moduleFixture.createNestApplication();
  // Mirrors apps/backend/src/main.ts (global pipe + prefix) so e2e matches prod.
  app.useGlobalPipes(new ValidationPipe(buildValidationOptions()));
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  await app.init();

  // Belt-and-suspenders: never let a developer .env fire real emails.
  delete process.env.RESEND_API_KEY;

  return { app, emailNotifierMock };
}