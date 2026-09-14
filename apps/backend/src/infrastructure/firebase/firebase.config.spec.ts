import { normalizePrivateKey } from './firebase.config';

describe('normalizePrivateKey', () => {
  it('converts escaped newline sequences into real newlines', () => {
    expect(normalizePrivateKey('-----BEGIN\\nKEY-----')).toBe('-----BEGIN\nKEY-----');
  });

  it('leaves an already-normalized key untouched', () => {
    expect(normalizePrivateKey('-----BEGIN\nKEY-----')).toBe('-----BEGIN\nKEY-----');
  });
});
