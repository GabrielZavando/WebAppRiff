import { isHoneypotFilled } from './honeypot';

describe('isHoneypotFilled', () => {
  it('returns true for non-empty website values', () => {
    expect(isHoneypotFilled('http://spam.example')).toBe(true);
    expect(isHoneypotFilled('x')).toBe(true);
  });

  it('returns false for empty, whitespace-only or missing values', () => {
    expect(isHoneypotFilled('')).toBe(false);
    expect(isHoneypotFilled('   ')).toBe(false);
    expect(isHoneypotFilled(undefined)).toBe(false);
    expect(isHoneypotFilled(null)).toBe(false);
    expect(isHoneypotFilled(42)).toBe(false);
  });
});