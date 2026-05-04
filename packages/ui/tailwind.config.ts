import type { Config } from 'tailwindcss';
import preset from './tailwind.preset';

const config: Config = {
  ...preset,
  content: [
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx,html}',
  ],
};

export default config;
