import { describe, it, expect, afterEach } from 'vitest';
import { getContactInfo } from '@/lib/config/contact';
import { getSocialLinks } from '@/lib/types/top-header';

const ENV_KEYS = [
  'PRIMARY_PHONE',
  'SOCIAL_FACEBOOK_URL',
  'SOCIAL_X_URL',
  'SOCIAL_INSTAGRAM_URL',
  'SOCIAL_LINKEDIN_URL',
] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete import.meta.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('getContactInfo', () => {
  it('returns values when all env vars are set', () => {
    import.meta.env.PRIMARY_PHONE = '+56 2 29079067';
    import.meta.env.SOCIAL_FACEBOOK_URL = 'https://facebook.com/riff';
    import.meta.env.SOCIAL_X_URL = 'https://x.com/riff';
    import.meta.env.SOCIAL_INSTAGRAM_URL = 'https://instagram.com/riff';
    import.meta.env.SOCIAL_LINKEDIN_URL = 'https://linkedin.com/company/riff';

    const info = getContactInfo();

    expect(info.phone).toBe('+56 2 29079067');
    expect(info.social.facebook).toBe('https://facebook.com/riff');
    expect(info.social.x).toBe('https://x.com/riff');
    expect(info.social.instagram).toBe('https://instagram.com/riff');
    expect(info.social.linkedin).toBe('https://linkedin.com/company/riff');
  });

  it('returns empty strings when env vars are missing', () => {
    clearEnv();

    const info = getContactInfo();

    expect(info.phone).toBe('');
    expect(info.social.facebook).toBe('');
    expect(info.social.x).toBe('');
    expect(info.social.instagram).toBe('');
    expect(info.social.linkedin).toBe('');
  });

  it('returns empty strings when env vars are present but empty', () => {
    for (const key of ENV_KEYS) {
      import.meta.env[key] = '';
    }

    const info = getContactInfo();

    expect(info.phone).toBe('');
    expect(info.social.facebook).toBe('');
    expect(info.social.x).toBe('');
    expect(info.social.instagram).toBe('');
    expect(info.social.linkedin).toBe('');
  });
});

describe('getSocialLinks', () => {
  it('filters out links with empty href', () => {
    const links = getSocialLinks({
      phone: '+56 2 29079067',
      social: {
        facebook: 'https://facebook.com/riff',
        x: '',
        instagram: 'https://instagram.com/riff',
        linkedin: '',
      },
    });

    expect(links).toHaveLength(2);
    expect(links.map(link => link.name)).toEqual(['Facebook', 'Instagram']);
  });

  it('returns empty array when no social URLs configured', () => {
    const links = getSocialLinks({
      phone: '',
      social: { facebook: '', x: '', instagram: '', linkedin: '' },
    });

    expect(links).toHaveLength(0);
  });
});
