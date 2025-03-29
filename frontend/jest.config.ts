import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Обработка импортов CSS модулей
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.ts",
    // Обработка импортов файлов ресурсов
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$":
      "<rootDir>/__mocks__/fileMock.ts",
    // Дополнительные маппинги для вашей структуры проекта (при необходимости)
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/wailsjs/"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/wailsjs/**",
    "!src/**/index.{ts,tsx}",
    "!src/vite-env.d.ts",
    "!src/main.tsx",
  ],
};

export default config;
