import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FIREBASE_APP, FIRESTORE } from './firebase.tokens';
import { FirebaseModule } from './firebase.module';
import { FirestoreModule } from './firestore.module';

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

const fakeApp = { name: '[DEFAULT]' } as never;
const fakeFirestore = { collection: () => undefined } as never;

describe('FirebaseModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplicationDefault.mockReturnValue({} as never);
    mockInitializeApp.mockReturnValue(fakeApp);
    mockGetApp.mockReturnValue(fakeApp);
    mockGetAuth.mockReturnValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() });
    process.env = { ...process.env, ...FIREBASE_ENV };
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });

  it('initializes with ADC and required config when no app exists', async () => {
    mockGetApps.mockReturnValue([]);
    const fakeCredential = { type: 'authorized_user' } as never;
    mockApplicationDefault.mockReturnValue(fakeCredential);

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule],
    }).compile();
    const app = moduleRef.get<unknown>(FIREBASE_APP);

    expect(mockApplicationDefault).toHaveBeenCalledTimes(1);
    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockInitializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        credential: fakeCredential,
        projectId: 'riff-catalogo',
        storageBucket: 'webappriff.firebasestorage.app',
      }),
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

  it('fails fast when FIREBASE_STORAGE_BUCKET is missing', async () => {
    delete process.env.FIREBASE_STORAGE_BUCKET;
    mockGetApps.mockReturnValue([]);

    await expect(
      Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), FirebaseModule],
      }).compile(),
    ).rejects.toThrow(/FIREBASE_STORAGE_BUCKET/);
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
    delete process.env.FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });
});
