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

const CONTACT_CONSTANTS = {
  phone: '+56 2 29079067',
  whatsapp: '+56 9 3752 6162',
  social: {
    facebook: 'https://www.facebook.com/somosriff',
    x: '',
    instagram: 'https://www.instagram.com/somosriff.cl/',
    linkedin: 'https://www.linkedin.com/company/somosriff/',
  },
} as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete import.meta.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('getContactInfo', () => {
  it('returns the configured contact constants (SC-003)', () => {
    clearEnv();

    const info = getContactInfo();

    expect(info.phone).toBe(CONTACT_CONSTANTS.phone);
    expect(info.whatsapp).toBe(CONTACT_CONSTANTS.whatsapp);
    expect(info.social.facebook).toBe(CONTACT_CONSTANTS.social.facebook);
    expect(info.social.x).toBe(CONTACT_CONSTANTS.social.x);
    expect(info.social.instagram).toBe(CONTACT_CONSTANTS.social.instagram);
    expect(info.social.linkedin).toBe(CONTACT_CONSTANTS.social.linkedin);
  });

  it('does not read import.meta.env: returns the constants even when env vars are set', () => {
    import.meta.env.PRIMARY_PHONE = 'something-else';
    import.meta.env.SOCIAL_FACEBOOK_URL = 'https://other.example';
    import.meta.env.SOCIAL_X_URL = 'https://x.com/other';
    import.meta.env.SOCIAL_INSTAGRAM_URL = 'https://instagram.com/other';
    import.meta.env.SOCIAL_LINKEDIN_URL = 'https://linkedin.com/other';

    const info = getContactInfo();

    expect(info.phone).toBe(CONTACT_CONSTANTS.phone);
    expect(info.whatsapp).toBe(CONTACT_CONSTANTS.whatsapp);
    expect(info.social.facebook).toBe(CONTACT_CONSTANTS.social.facebook);
    expect(info.social.x).toBe(CONTACT_CONSTANTS.social.x);
    expect(info.social.instagram).toBe(CONTACT_CONSTANTS.social.instagram);
    expect(info.social.linkedin).toBe(CONTACT_CONSTANTS.social.linkedin);
  });
});

describe('getSocialLinks', () => {
  it('returns exactly Facebook, Instagram, LinkedIn for the configured constants (X is empty)', () => {
    const links = getSocialLinks({
      phone: CONTACT_CONSTANTS.phone,
      whatsapp: '+56 9 3752 6162',
      social: { ...CONTACT_CONSTANTS.social },
    });

    expect(links).toHaveLength(3);
    expect(links.map(link => link.name)).toEqual(['Facebook', 'Instagram', 'LinkedIn']);
    expect(links.find(l => l.name === 'X')).toBeUndefined();
  });

  it('filters out links with empty href', () => {
    const links = getSocialLinks({
      phone: '+56 2 29079067',
      whatsapp: '+56 9 3752 6162',
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
      whatsapp: '+56 9 3752 6162',
      social: { facebook: '', x: '', instagram: '', linkedin: '' },
    });

    expect(links).toHaveLength(0);
  });
});