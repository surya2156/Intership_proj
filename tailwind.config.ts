import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f1ff',
          100: '#e6e4ff',
          500: '#6a5cf5',
          600: '#5344e0',
          900: '#171335',
        },
      },
    },
  },
  plugins: [],
};

export default config;
