/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.astro' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
  const component: AstroComponentFactory;
  export default component;
}

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