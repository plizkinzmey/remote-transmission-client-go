/// <reference types="vitest" />
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Расширяем UserConfig из Vite, чтобы включить свойство test для Vitest
declare module "vite" {
  interface UserConfig {
    test?: {
      globals?: boolean;
      environment?: string;
      setupFiles?: string | string[];
      outputFile?: string;
      silent?: boolean;
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
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup-tests.tsx",
    silent: true, // Показывать только ошибки
    coverage: {
      reporter: ["text", "text-summary", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "wailsjs/",
        "**/*.d.ts",
        "**/__tests__/**", // <-- Исключаем все содержимое папок __tests__
        "src/main.tsx",
        "src/vite-env.d.ts",
        "**/types.ts", // Все файлы с именем types.ts
        "src/types/**/*.ts", // Все файлы в директории src/types
      ],
      include: ["src/**/*.tsx", "src/**/*.ts"],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70, // Изменено с 60 на 70 для унификации требований
      statements: 70,
      skipFull: false, // показывать файлы со 100% покрытием
      reportsDirectory: "./coverage",
      reportOnFailure: true, // всегда генерировать отчёт, даже если тесты падают
    },
    css: false, // Отключаем обработку CSS, чтобы избежать проблем с CSS-модулями
  },
});
