import type { Config } from 'tailwindcss';
import preset from './packages/ui/tailwind.preset';

const config: Config = {
  ...preset,
  content: [
    './apps/web/app/**/*.{ts,tsx}',
    './apps/web/components/**/*.{ts,tsx}',
    './apps/web/styles/**/*.css',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
};

export default config;
