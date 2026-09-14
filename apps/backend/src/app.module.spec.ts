import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';

const mockInitializeApp = jest.fn();
const mockGetApp = jest.fn();
const mockGetApps = jest.fn();
const mockApplicationDefault = jest.fn();
const mockGetFirestore = jest.fn();
const mockGetAuth = jest.fn();

jest.mock('firebase-admin/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApp: (...args: unknown[]) => mockGetApp(...args),
  getApps: (...args: unknown[]) => mockGetApps(...args),
  applicationDefault: (...args: unknown[]) => mockApplicationDefault(...args),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args: unknown[]) => mockGetFirestore(...args),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
}));

const FIREBASE_ENV = {
  FIREBASE_PROJECT_ID: 'riff-catalogo',
  FIREBASE_STORAGE_BUCKET: 'webappriff.firebasestorage.app',
};

describe('AppModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
    mockApplicationDefault.mockReturnValue({} as never);
    mockInitializeApp.mockReturnValue({ name: '[DEFAULT]' });
    mockGetFirestore.mockReturnValue({
      collection: () => undefined,
      listCollections: jest.fn().mockResolvedValue([]),
    });
    mockGetAuth.mockReturnValue({
      verifyIdToken: jest.fn(),
      setCustomUserClaims: jest.fn(),
    });
    process.env = { ...process.env, ...FIREBASE_ENV };
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });

  it('compiles and resolves the AppController from the DI graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const controller = moduleRef.get(AppController);
    expect(controller).toBeDefined();
    const health = await controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.firebase).toBe('up');

    await moduleRef.close();
  });
});
