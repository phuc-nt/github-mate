import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["lib/**/*.test.ts"],
    testTimeout: 10000,
  },
  resolve: {
    alias: { "@": "/" },
  },
});
