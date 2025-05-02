import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useModals } from "../useModals";
import {
  EventsOn,
  WindowUnminimise,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "@wailsjs/runtime";

// Мокаем Wails API
vi.mock("@wailsjs/runtime", () => ({
  EventsOn: vi.fn(),
  WindowUnminimise: vi.fn(),
  WindowShow: vi.fn(),
  WindowSetAlwaysOnTop: vi.fn(),
}));

describe("Хук useModals - активация окна", () => {
  let eventCallback: ((path: string) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Включаем поддельные таймеры для тестирования setTimeout
    eventCallback = null;

    // Настраиваем мок для EventsOn
    vi.mocked(EventsOn).mockImplementation((eventName, callback) => {
      if (eventName === "torrent-opened") {
        eventCallback = callback;
      }
      return vi.fn(); // Возвращаем мок для функции отписки
    });

    // Настраиваем успешные ответы для оконных функций
    vi.mocked(WindowUnminimise).mockResolvedValue(undefined);
    vi.mocked(WindowShow).mockResolvedValue(undefined);
    vi.mocked(WindowSetAlwaysOnTop).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers(); // Возвращаем настоящие таймеры после теста
  });

  it("должен активировать окно при получении события torrent-opened", async () => {
    // Рендерим хук
    renderHook(() => useModals());

    // Убеждаемся, что колбэк зарегистрирован
    expect(eventCallback).not.toBeNull();

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (eventCallback) {
        await eventCallback("/path/to/test.torrent");
      }
    });

    // Проверяем, что все функции активации окна были вызваны
    expect(vi.mocked(WindowUnminimise)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(WindowShow)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenCalledWith(true);

    // Позволяем setTimeout выполниться
    vi.runAllTimers();

    // Проверяем, что AlwaysOnTop был сброшен
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenLastCalledWith(false);
  });

  it("должен обрабатывать ошибки во время активации окна", async () => {
    // Настраиваем мок для симуляции ошибки
    vi.mocked(WindowUnminimise).mockRejectedValue(
      new Error("Не удалось развернуть окно")
    );

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (eventCallback) {
        await eventCallback("/path/to/test.torrent");
      }
    });

    // Проверяем, что ошибка была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to activate window:",
      expect.any(Error)
    );

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });
});
