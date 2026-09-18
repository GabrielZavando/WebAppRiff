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
  it('returns values when all env vars are set with official Riff URLs and empty X', () => {
    import.meta.env.PRIMARY_PHONE = '+56 2 29079067';
    import.meta.env.SOCIAL_FACEBOOK_URL = 'https://www.facebook.com/share/1DL9drgCDU/?mibextid=wwXIfr';
    import.meta.env.SOCIAL_X_URL = '';
    import.meta.env.SOCIAL_INSTAGRAM_URL = 'https://www.instagram.com/somosriff.cl?igsi=MTU2YXhqaThoNnFydA%3D%3D&utm_source=qr';
    import.meta.env.SOCIAL_LINKEDIN_URL = 'https://www.linkedin.com/company/100252590';

    const info = getContactInfo();

    expect(info.phone).toBe('+56 2 29079067');
    expect(info.social.facebook).toBe('https://www.facebook.com/share/1DL9drgCDU/?mibextid=wwXIfr');
    expect(info.social.x).toBe('');
    expect(info.social.instagram).toBe('https://www.instagram.com/somosriff.cl?igsi=MTU2YXhqaThoNnFydA%3D%3D&utm_source=qr');
    expect(info.social.linkedin).toBe('https://www.linkedin.com/company/100252590');
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
  it('returns exactly Facebook, Instagram, LinkedIn when official URLs are set and X is empty (SC-001/SC-002)', () => {
    const links = getSocialLinks({
      phone: '+56 2 29079067',
      social: {
        facebook: 'https://www.facebook.com/share/1DL9drgCDU/?mibextid=wwXIfr',
        x: '',
        instagram: 'https://www.instagram.com/somosriff.cl?igsi=MTU2YXhqaThoNnFydA%3D%3D&utm_source=qr',
        linkedin: 'https://www.linkedin.com/company/100252590',
      },
    });

    expect(links).toHaveLength(3);
    expect(links.map(link => link.name)).toEqual(['Facebook', 'Instagram', 'LinkedIn']);
    expect(links.find(l => l.name === 'X')).toBeUndefined();
  });

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
