import type { ContactInfo } from '@/lib/types/top-header';

export function getContactInfo(): ContactInfo {
  return {
    phone: import.meta.env.PRIMARY_PHONE || '',
    social: {
      facebook: import.meta.env.SOCIAL_FACEBOOK_URL || '',
      x: import.meta.env.SOCIAL_X_URL || '',
      instagram: import.meta.env.SOCIAL_INSTAGRAM_URL || '',
      linkedin: import.meta.env.SOCIAL_LINKEDIN_URL || '',
    },
  };
}