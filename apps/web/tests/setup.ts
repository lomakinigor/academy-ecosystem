// jest-dom matchers нужны только в jsdom-окружении (UI-тесты).
// Под node-окружением (auth/* тесты) импорт пропускаем — он расширяет matchers
// и в некоторых конфигурациях ломает beforeAll-хуки в неожиданных местах.
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
}

export {};
