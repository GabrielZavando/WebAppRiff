import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import astroIcon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// Tailwind v4 is wired via the `@tailwindcss/vite` plugin (see globals.css for
// the `@import "tailwindcss"` + `@theme {}` declarations). `astroIcon` provides
// `<Icon name="lucide:..." />` to all .astro components; the `@iconify-json/*`
// packages supply the SSR source sets.
//
// `sitemap` generates `/sitemap-index.xml` (+ `/sitemap-0.xml` sections) in
// `dist/` on build, rooted at `site` = process.env.SITE_URL (canonical domain).
// Product slugs are discovered via `getStaticPaths`; see `add-sitemap` change.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [astroIcon(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
