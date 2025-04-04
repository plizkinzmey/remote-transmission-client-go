/// <reference types="vitest" />
import { defineConfig } from "vite";

// Расширяем UserConfig из Vite, чтобы включить свойство test для Vitest
declare module "vite" {
  interface UserConfig {
    test?: {
      globals?: boolean;
      environment?: string;
      setupFiles?: string | string[];
      outputFile?: string;
      coverage?: {
        reporter?: string | string[];
        exclude?: string[];
        include?: string[];
        all?: boolean;
        lines?: number;
        functions?: number;
        branches?: number;
        statements?: number;
        reportsDirectory?: string;
        reportOnFailure?: boolean;
        skipFull?: boolean;
      };
      css?:
        | boolean
        | {
            modules?: {
              classNameStrategy?: string;
            };
          };
    };
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup-tests.ts",
    coverage: {
      reporter: ["text", "text-summary", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "wailsjs/",
        "**/*.d.ts",
        "**/*.test.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      include: ["src/**/*.tsx", "src/**/*.ts"],
      all: true,
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
      skipFull: false, // показывать файлы со 100% покрытием
      reportsDirectory: "./coverage",
      reportOnFailure: true, // всегда генерировать отчёт, даже если тесты падают
    },
    css: false, // Отключаем обработку CSS, чтобы избежать проблем с CSS-модулями
  },
});
