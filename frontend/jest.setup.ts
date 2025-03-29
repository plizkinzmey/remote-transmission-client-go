import "@testing-library/jest-dom";

// Определяем типы для window.runtime
declare global {
  interface Window {
    runtime: Record<string, jest.Mock>;
  }
}

// Мок для Wails runtime функций
window.runtime = {
  EventsOn: jest.fn(),
  EventsOff: jest.fn(),
  EventsOnce: jest.fn(),
  EventsEmit: jest.fn(),
  LogInfo: jest.fn(),
  LogError: jest.fn(),
  LogWarning: jest.fn(),
  LogDebug: jest.fn(),
};
