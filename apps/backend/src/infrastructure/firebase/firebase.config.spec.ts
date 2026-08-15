import { buildServiceAccountFromEnv, normalizePrivateKey } from './firebase.config';

describe('normalizePrivateKey', () => {
  it('converts escaped newline sequences into real newlines', () => {
    expect(normalizePrivateKey('-----BEGIN\\nKEY-----')).toBe('-----BEGIN\nKEY-----');
  });

  it('leaves an already-normalized key untouched', () => {
    expect(normalizePrivateKey('-----BEGIN\nKEY-----')).toBe('-----BEGIN\nKEY-----');
  });
});

describe('buildServiceAccountFromEnv', () => {
  const completeInput = {
    projectId: 'riff-catalogo',
    clientEmail: 'admin@riff.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n',
  };

  it('maps the three present values into a ServiceAccount', () => {
    expect(buildServiceAccountFromEnv(completeInput)).toEqual(completeInput);
  });

  it('throws when projectId is missing', () => {
    expect(() => buildServiceAccountFromEnv({ ...completeInput, projectId: undefined })).toThrow(
      /FIREBASE_PROJECT_ID/,
    );
  });

  it('throws when clientEmail is missing', () => {
    expect(() =>
      buildServiceAccountFromEnv({ ...completeInput, clientEmail: undefined }),
    ).toThrow(/FIREBASE_CLIENT_EMAIL/);
  });

  it('throws when privateKey is missing', () => {
    expect(() => buildServiceAccountFromEnv({ ...completeInput, privateKey: undefined })).toThrow(
      /FIREBASE_PRIVATE_KEY/,
    );
  });
});
