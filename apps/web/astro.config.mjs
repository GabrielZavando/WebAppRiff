import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import astroIcon from 'astro-icon';

// Tailwind v4 is wired via the `@tailwindcss/vite` plugin (see globals.css for
// the `@import "tailwindcss"` + `@theme {}` declarations). `astroIcon` provides
// `<Icon name="material-symbols:..." />` to all .astro components; the
// `@iconify-json/material-symbols` package supplies the SSR source set.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  output: 'static',
  integrations: [astroIcon()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
