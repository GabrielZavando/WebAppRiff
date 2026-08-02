/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface ImportMetaEnv {
    readonly SITE_URL: string;
    readonly PRIMARY_PHONE: string;
    readonly SOCIAL_FACEBOOK_URL: string;
    readonly SOCIAL_X_URL: string;
    readonly SOCIAL_INSTAGRAM_URL: string;
    readonly SOCIAL_LINKEDIN_URL: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}