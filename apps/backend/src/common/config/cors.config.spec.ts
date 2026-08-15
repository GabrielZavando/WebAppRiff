import { buildCorsOptions } from './cors.config';

describe('buildCorsOptions', () => {
  it('restricts origin to the configured frontend URLs in production', () => {
    const options = buildCorsOptions({
      nodeEnv: 'production',
      astroSiteUrl: 'https://catalogo.riff.cl',
      angularAdminUrl: 'https://admin.riff.cl',
    });

    expect(options.origin).toEqual(['https://catalogo.riff.cl', 'https://admin.riff.cl']);
    expect(options.credentials).toBe(true);
  });

  it('allows all origins in development via a custom origin function', () => {
    const options = buildCorsOptions({ nodeEnv: 'development' });

    expect(typeof options.origin).toBe('function');
    const cb = jest.fn();
    (options.origin as (requestOrigin: string, callback: (err: Error | null, allow?: boolean) => void) => void)(
      'https://anything.example',
      cb,
    );
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('fails closed with an empty origin list in production when URLs are missing', () => {
    const options = buildCorsOptions({ nodeEnv: 'production' });

    expect(options.origin).toEqual([]);
  });
});
