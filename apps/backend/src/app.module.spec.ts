import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';

const mockInitializeApp = jest.fn();
const mockGetApp = jest.fn();
const mockGetApps = jest.fn();
const mockCert = jest.fn();
const mockGetFirestore = jest.fn();

jest.mock('firebase-admin/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApp: (...args: unknown[]) => mockGetApp(...args),
  getApps: (...args: unknown[]) => mockGetApps(...args),
  cert: (...args: unknown[]) => mockCert(...args),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args: unknown[]) => mockGetFirestore(...args),
}));

const FIREBASE_ENV = {
  FIREBASE_PROJECT_ID: 'riff-catalogo',
  FIREBASE_CLIENT_EMAIL: 'admin@riff.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n',
};

describe('AppModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);
    mockCert.mockReturnValue({ projectId: FIREBASE_ENV.FIREBASE_PROJECT_ID });
    mockInitializeApp.mockReturnValue({ name: '[DEFAULT]' });
    mockGetFirestore.mockReturnValue({
      collection: () => undefined,
      listCollections: jest.fn().mockResolvedValue([]),
    });
    process.env = { ...process.env, ...FIREBASE_ENV };
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
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
