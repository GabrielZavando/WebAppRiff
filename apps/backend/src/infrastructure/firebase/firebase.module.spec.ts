import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FIREBASE_APP, FIRESTORE } from './firebase.tokens';
import { FirebaseModule } from './firebase.module';
import { FirestoreModule } from './firestore.module';

const mockInitializeApp = jest.fn();
const mockGetApp = jest.fn();
const mockGetApps = jest.fn();
const mockCert = jest.fn();
const mockGetFirestore = jest.fn();
const mockGetAuth = jest.fn();

jest.mock('firebase-admin/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApp: (...args: unknown[]) => mockGetApp(...args),
  getApps: (...args: unknown[]) => mockGetApps(...args),
  cert: (...args: unknown[]) => mockCert(...args),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: (...args: unknown[]) => mockGetFirestore(...args),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: (...args: unknown[]) => mockGetAuth(...args),
}));

const FIREBASE_ENV = {
  FIREBASE_PROJECT_ID: 'riff-catalogo',
  FIREBASE_CLIENT_EMAIL: 'admin@riff.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n',
};

const fakeApp = { name: '[DEFAULT]' } as never;
const fakeFirestore = { collection: () => undefined } as never;

describe('FirebaseModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCert.mockReturnValue({ projectId: FIREBASE_ENV.FIREBASE_PROJECT_ID });
    mockInitializeApp.mockReturnValue(fakeApp);
    mockGetApp.mockReturnValue(fakeApp);
    mockGetAuth.mockReturnValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() });
    process.env = { ...process.env, ...FIREBASE_ENV };
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });

  it('initializes the app with cert credentials and projectId when no app exists', async () => {
    mockGetApps.mockReturnValue([]);

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule],
    }).compile();
    const app = moduleRef.get<unknown>(FIREBASE_APP);

    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockCert).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'riff-catalogo' }),
    );
    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'riff-catalogo' }),
    );
    expect(app).toBe(fakeApp);
    await moduleRef.close();
  });

  it('reuses the existing app when one is already initialized', async () => {
    mockGetApps.mockReturnValue([fakeApp]);

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule],
    }).compile();
    const app = moduleRef.get<unknown>(FIREBASE_APP);

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetApp).toHaveBeenCalled();
    expect(app).toBe(fakeApp);
    await moduleRef.close();
  });

  it('fails fast when FIREBASE_PROJECT_ID is missing', async () => {
    delete process.env.FIREBASE_PROJECT_ID;
    mockGetApps.mockReturnValue([]);

    await expect(
      Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule],
      }).compile(),
    ).rejects.toThrow(/FIREBASE_PROJECT_ID/);
  });
});

describe('FirestoreModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFirestore.mockReturnValue(fakeFirestore);
  });

  it('resolves FIRESTORE via getFirestore(app)', async () => {
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue(fakeApp);
    process.env = { ...process.env, ...FIREBASE_ENV };

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule, FirestoreModule],
    }).compile();

    const firestore = moduleRef.get<unknown>(FIRESTORE);

    expect(mockGetFirestore).toHaveBeenCalledWith(fakeApp);
    expect(firestore).toBe(fakeFirestore);
    await moduleRef.close();

    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });
});
