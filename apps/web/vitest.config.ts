import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["tests/brand/**", "jsdom"],
      ["tests/trpc/**", "jsdom"],
      ["tests/calendar/**", "jsdom"],
    ],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
