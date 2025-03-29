// Утилиты для тестирования кода, зависящего от Wails API
import type { Mock } from "jest-mock";

// Создаем моки для Go-функций Wails
export const createWailsMock = () => {
  // Мокируем основные функции app.go
  const appMocks = {
    Initialize: jest.fn().mockResolvedValue(undefined),
    LoadConfig: jest.fn().mockResolvedValue({
      host: "localhost",
      port: 9091,
      username: "test",
      password: "test",
      language: "en",
      theme: "light",
      maxUploadRatio: 1.0,
      slowSpeedLimit: 50,
      slowSpeedUnit: "KiB/s",
    }),
    GetTranslation: jest.fn().mockImplementation((key: string) => key),
    GetAvailableLanguages: jest.fn().mockResolvedValue(["en", "ru"]),
    GetSystemLanguage: jest.fn().mockResolvedValue("en"),
    GetSessionStats: jest.fn().mockResolvedValue({
      TotalDownloadSpeed: 1024,
      TotalUploadSpeed: 512,
      FreeSpace: 1073741824,
      TransmissionVersion: "4.0.0",
    }),
    GetTorrents: jest.fn().mockResolvedValue([]),
    AddTorrent: jest.fn().mockResolvedValue(undefined),
    AddTorrentFile: jest.fn().mockResolvedValue(undefined),
    RemoveTorrent: jest.fn().mockResolvedValue(undefined),
    StartTorrents: jest.fn().mockResolvedValue(undefined),
    StopTorrents: jest.fn().mockResolvedValue(undefined),
    GetTorrentFiles: jest.fn().mockResolvedValue([]),
    SetFilesWanted: jest.fn().mockResolvedValue(undefined),
    VerifyTorrent: jest.fn().mockResolvedValue(undefined),
    GetDownloadPaths: jest.fn().mockResolvedValue(["/downloads"]),
    ValidateDownloadPath: jest.fn().mockResolvedValue(true),
    RemoveDownloadPath: jest.fn().mockResolvedValue(undefined),
    SetTorrentSpeedLimit: jest.fn().mockResolvedValue(undefined),
    ReadFile: jest.fn().mockResolvedValue("base64content"),
    TestConnection: jest.fn().mockResolvedValue(undefined),
  };

  // Мокируем runtime функции Wails
  const runtimeMocks = {
    EventsOn: jest.fn(),
    EventsOff: jest.fn(),
    EventsOnce: jest.fn(),
    EventsEmit: jest.fn(),
    LogInfo: jest.fn(),
    LogError: jest.fn(),
    LogWarning: jest.fn(),
    LogDebug: jest.fn(),
  };

  // Устанавливаем моки в window для использования в тестах
  window.go = {
    main: {
      App: appMocks,
    },
  };

  window.runtime = runtimeMocks;

  return { app: appMocks, runtime: runtimeMocks };
};

// Функция для очистки моков между тестами
export const resetWailsMocks = () => {
  jest.resetAllMocks();
};

// Типы для window.go и window.runtime
declare global {
  interface Window {
    go: {
      main: {
        App: Record<string, jest.Mock>;
      };
    };
    runtime: Record<string, jest.Mock>;
  }
}