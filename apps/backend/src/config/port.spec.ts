import { resolvePort } from './port';

describe('resolvePort', () => {
  it('returns 3000 when the variable is undefined', () => {
    expect(resolvePort(undefined)).toBe(3000);
  });

  it('returns the parsed integer for a valid numeric string', () => {
    expect(resolvePort('4000')).toBe(4000);
  });

  it('returns 0 for an explicit ephemeral port', () => {
    expect(resolvePort('0')).toBe(0);
  });

  it('returns 3000 for a non-numeric string', () => {
    expect(resolvePort('abc')).toBe(3000);
  });

  it('returns 3000 for an empty string', () => {
    expect(resolvePort('')).toBe(3000);
  });

  it('returns 3000 for a negative port', () => {
    expect(resolvePort('-1')).toBe(3000);
  });
});
