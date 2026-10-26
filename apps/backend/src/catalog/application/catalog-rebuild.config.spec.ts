import { buildCatalogRebuildConfig, isSchedulerIdentityConfigured } from './catalog-rebuild.config';

describe('buildCatalogRebuildConfig', () => {
  it('applies the documented defaults when no variables are set', () => {
    const config = buildCatalogRebuildConfig({});

    expect(config.silenceSeconds).toBe(60);
    expect(config.maxWaitSeconds).toBe(300);
    expect(config.claimTtlSeconds).toBe(60);
    expect(config.expectedAudience).toBeNull();
    expect(config.expectedSa).toBeNull();
  });

  it('reads overrides from the environment', () => {
    const config = buildCatalogRebuildConfig({
      CATALOG_REBUILD_SILENCE_SECONDS: '90',
      CATALOG_REBUILD_MAX_WAIT_SECONDS: '600',
      CATALOG_REBUILD_CLAIM_TTL_SECONDS: '120',
      CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE: 'https://api.example.com',
      CATALOG_REBUILD_FLUSH_EXPECTED_SA: 'flusher@example.iam.gserviceaccount.com',
    });

    expect(config.silenceSeconds).toBe(90);
    expect(config.maxWaitSeconds).toBe(600);
    expect(config.claimTtlSeconds).toBe(120);
    expect(config.expectedAudience).toBe('https://api.example.com');
    expect(config.expectedSa).toBe('flusher@example.iam.gserviceaccount.com');
  });

  it('falls back to defaults when a window variable is not numeric', () => {
    const config = buildCatalogRebuildConfig({
      CATALOG_REBUILD_SILENCE_SECONDS: 'abc',
      CATALOG_REBUILD_MAX_WAIT_SECONDS: '',
      CATALOG_REBUILD_CLAIM_TTL_SECONDS: '-5',
    });

    expect(config.silenceSeconds).toBe(60);
    expect(config.maxWaitSeconds).toBe(300);
    expect(config.claimTtlSeconds).toBe(60);
  });

  it('treats blank identity variables as unconfigured', () => {
    const config = buildCatalogRebuildConfig({
      CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE: '   ',
      CATALOG_REBUILD_FLUSH_EXPECTED_SA: '',
    });

    expect(config.expectedAudience).toBeNull();
    expect(config.expectedSa).toBeNull();
  });
});

describe('isSchedulerIdentityConfigured', () => {
  it('is false when the config falls back to defaults (no identity vars)', () => {
    const config = buildCatalogRebuildConfig({});
    expect(isSchedulerIdentityConfigured(config)).toBe(false);
  });

  it('is true only when both audience and service account are set', () => {
    const config = buildCatalogRebuildConfig({
      CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE: 'https://api.example.com',
      CATALOG_REBUILD_FLUSH_EXPECTED_SA: 'flusher@example.iam.gserviceaccount.com',
    });
    expect(isSchedulerIdentityConfigured(config)).toBe(true);

    const partial = buildCatalogRebuildConfig({
      CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE: 'https://api.example.com',
    });
    expect(isSchedulerIdentityConfigured(partial)).toBe(false);
  });
});
