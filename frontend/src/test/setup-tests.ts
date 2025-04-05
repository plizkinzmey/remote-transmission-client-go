import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Мок для функций Wails
const wailsMocks = {
  LogDebug: vi.fn(),
  LogInfo: vi.fn(),
  LogWarning: vi.fn(),
  LogError: vi.fn(),
  EventsOn: vi.fn(),
  EventsOff: vi.fn(),
  EventsOnce: vi.fn(),
  EventsEmit: vi.fn(),
};

// Создаем моки для Wails API
vi.mock("../../wailsjs/runtime", () => ({
  LogDebug: wailsMocks.LogDebug,
  LogInfo: wailsMocks.LogInfo,
  LogWarning: wailsMocks.LogWarning,
  LogError: wailsMocks.LogError,
  EventsOn: wailsMocks.EventsOn,
  EventsOff: wailsMocks.EventsOff,
  EventsOnce: wailsMocks.EventsOnce,
  EventsEmit: wailsMocks.EventsEmit,
}));

// Создаем моки для Go функций
vi.mock("../../wailsjs/go/main/App", () => ({
  LoadConfig: vi.fn(),
  SaveAllSettings: vi.fn(),
  GetTorrents: vi.fn(),
  TestConnection: vi.fn(),
  AddTorrent: vi.fn(),
  StartTorrents: vi.fn(),
  StopTorrents: vi.fn(),
  RemoveTorrents: vi.fn(),
  GetSessionStats: vi.fn(),
}));

// Мок для CSS модулей - важно использовать правильный путь и формат с default экспортом
vi.mock("../styles/StatusMessage.module.css", () => ({
  default: {
    statusContainer: "statusContainer-mock",
    messageContainer: "messageContainer-mock",
    animated: "animated-mock",
    success: "success-mock",
    error: "error-mock",
    info: "info-mock",
    expandableMessage: "expandableMessage-mock",
  },
}));
