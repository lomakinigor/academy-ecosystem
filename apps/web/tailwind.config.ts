import type { Config } from "tailwindcss";

/**
 * Минимальная Tailwind-конфигурация — каркас.
 * Полную дизайн-систему (токены, шрифты, темы) настраивает Agent UI
 * в packages/ui и расширяет этот конфиг через preset.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
