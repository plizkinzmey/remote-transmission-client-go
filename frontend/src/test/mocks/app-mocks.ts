import { vi } from "vitest";

// Общий объект с моками функций
export const appMocks = {
  LoadConfig: vi.fn().mockResolvedValue({ language: "en" }),
  SaveAllSettings: vi.fn().mockResolvedValue(true),
  GetTorrents: vi.fn().mockResolvedValue([]),
  TestConnection: vi.fn().mockResolvedValue({ success: true }),
  AddTorrent: vi.fn().mockResolvedValue(true),
  StartTorrents: vi.fn().mockResolvedValue(true),
  StopTorrents: vi.fn().mockResolvedValue(true),
  RemoveTorrents: vi.fn().mockResolvedValue(true),
  GetSessionStats: vi.fn().mockResolvedValue({}),

  // Функции локализации
  GetTranslation: vi.fn().mockImplementation((key) => key),
  GetAvailableLanguages: vi.fn().mockResolvedValue(["en", "ru"]),
  GetSystemLanguage: vi.fn().mockResolvedValue("en"),
  Initialize: vi.fn().mockResolvedValue(true),
  GetAllTranslationKeys: vi.fn().mockResolvedValue([]),
};

// Мокируем все возможные пути импорта
vi.mock("../../../wailsjs/go/main/App", () => appMocks);
vi.mock("../../../../wailsjs/go/main/App", () => appMocks);
vi.mock("../../wailsjs/go/main/App", () => appMocks);
vi.mock("../wailsjs/go/main/App", () => appMocks);
