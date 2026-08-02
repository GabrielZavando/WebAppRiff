/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1B2A4A',
          'navy-light': '#2C3E6B',
          orange: '#F97316',
        },
      },
    },
  },
  plugins: [],
};