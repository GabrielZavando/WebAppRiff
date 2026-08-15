import { buildValidationOptions } from './validation.config';

describe('buildValidationOptions', () => {
  it('enforces whitelist, transform and forbidNonWhitelisted', () => {
    const options = buildValidationOptions();

    expect(options.whitelist).toBe(true);
    expect(options.transform).toBe(true);
    expect(options.forbidNonWhitelisted).toBe(true);
  });
});
