/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Расширяем UserConfig из Vite, чтобы включить свойство test для Vitest
declare module 'vite' {
  interface UserConfig {
    test?: {
      globals?: boolean;
      environment?: string;
      setupFiles?: string | string[];
      coverage?: {
        reporter?: string | string[];
        exclude?: string[];
      };
      css?: boolean | {
        modules?: {
          classNameStrategy?: string;
        }
      };
    }
  }
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup-tests.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'wailsjs/',
      ],
    },
    css: false // Отключаем обработку CSS, чтобы избежать проблем с CSS-модулями
  }
});