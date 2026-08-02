import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default getViteConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
