import type { ContactInfo } from '@/lib/types/top-header';

/**
 * SSG configuration constants for the contact bar — single source of truth.
 * These values are hardcoded at build time and are NOT env-driven: the site
 * renders the contact info even when the deploy environment lacks the legacy
 * `PRIMARY_PHONE` / `SOCIAL_*_URL` variables (change ui-chrome-uniform).
 * Changing them requires a code change and a site rebuild/redeploy.
 */
const PHONE = '+56 2 29079067';
const WHATSAPP_NUMBER = '+56 9 3752 6162';
const SOCIAL_FACEBOOK = 'https://www.facebook.com/somosriff';
const SOCIAL_X = ''; // empty — suppresses the X icon and link
const SOCIAL_INSTAGRAM = 'https://www.instagram.com/somosriff.cl/';
const SOCIAL_LINKEDIN = 'https://www.linkedin.com/company/somosriff/';

export function getContactInfo(): ContactInfo {
  return {
    phone: PHONE,
    whatsapp: WHATSAPP_NUMBER,
    social: {
      facebook: SOCIAL_FACEBOOK,
      x: SOCIAL_X,
      instagram: SOCIAL_INSTAGRAM,
      linkedin: SOCIAL_LINKEDIN,
    },
  };
}