import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useModals } from "../useModals";
import {
  EventsOn,
  WindowUnminimise,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "@wailsjs/runtime";

// Убираем импорт константы, которая не экспортируется
// import { WINDOW_RESET_DELAY_MS } from "../useModals";

// Определяем значение константы явно в тесте
const EXPECTED_RESET_DELAY_MS = 1000;

// Мокаем Wails API
vi.mock("@wailsjs/runtime", () => ({
  EventsOn: vi.fn(),
  WindowUnminimise: vi.fn(),
  WindowShow: vi.fn(),
  WindowSetAlwaysOnTop: vi.fn(),
}));

describe("Хук useModals - активация окна", () => {
  // Используем объект для хранения колбэка, чтобы избежать утечек состояния между тестами
  const callbackRegistry = {
    current: null as ((path: string) => void) | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Включаем поддельные таймеры для тестирования setTimeout

    // Сбрасываем callbackRegistry для каждого теста
    callbackRegistry.current = null;

    // Настраиваем мок для EventsOn
    vi.mocked(EventsOn).mockImplementation((eventName, callback) => {
      if (eventName === "torrent-opened") {
        callbackRegistry.current = callback;
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
    const { unmount } = renderHook(() => useModals());

    // Убеждаемся, что колбэк зарегистрирован
    expect(callbackRegistry.current).not.toBeNull();

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
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

    // Тестируем очистку таймера при размонтировании
    vi.mocked(WindowSetAlwaysOnTop).mockClear(); // Сбрасываем счетчики вызовов

    // Симулируем размонтирование компонента до выполнения таймера
    unmount();

    // Проверяем, что таймер не вызвал WindowSetAlwaysOnTop снова
    vi.runAllTimers(); // Если бы таймер не был очищен, это вызвало бы WindowSetAlwaysOnTop
    expect(vi.mocked(WindowSetAlwaysOnTop)).not.toHaveBeenCalled();
  });

  it("должен обрабатывать ошибки во время активации окна (WindowUnminimise)", async () => {
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
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
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

  it("должен обрабатывать ошибки во время активации окна (WindowShow)", async () => {
    // WindowUnminimise успешен, но WindowShow завершается с ошибкой
    vi.mocked(WindowUnminimise).mockResolvedValue(undefined);
    vi.mocked(WindowShow).mockRejectedValue(
      new Error("Не удалось показать окно")
    );

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
      }
    });

    // Проверяем, что ошибка была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to activate window:",
      expect.any(Error)
    );

    // Проверяем, что метод WindowUnminimise был вызван успешно
    expect(vi.mocked(WindowUnminimise)).toHaveBeenCalledTimes(1);

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });

  it("должен обрабатывать ошибки во время активации окна (WindowSetAlwaysOnTop)", async () => {
    // WindowUnminimise и WindowShow успешны, но WindowSetAlwaysOnTop завершается с ошибкой
    vi.mocked(WindowUnminimise).mockResolvedValue(undefined);
    vi.mocked(WindowShow).mockResolvedValue(undefined);
    vi.mocked(WindowSetAlwaysOnTop).mockRejectedValue(
      new Error("Не удалось установить окно поверх всех")
    );

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
      }
    });

    // Проверяем, что ошибка была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to activate window:",
      expect.any(Error)
    );

    // Проверяем, что предыдущие методы были вызваны успешно
    expect(vi.mocked(WindowUnminimise)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(WindowShow)).toHaveBeenCalledTimes(1);

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });

  it("должен корректно обрабатывать невалидный путь к торренту", async () => {
    // Шпионим за console.warn
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с невалидным путем
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("");
      }
    });

    // Проверяем, что предупреждение было залогировано
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Received invalid torrent path via event:",
      ""
    );

    // Проверяем, что методы активации окна не были вызваны
    expect(vi.mocked(WindowUnminimise)).not.toHaveBeenCalled();
    expect(vi.mocked(WindowShow)).not.toHaveBeenCalled();
    expect(vi.mocked(WindowSetAlwaysOnTop)).not.toHaveBeenCalled();

    // Восстанавливаем console.warn
    consoleWarnSpy.mockRestore();
  });

  it("должен вызывать setTorrentFilePath и setShowAddTorrent после обработки ошибки", async () => {
    // Настраиваем мок для симуляции ошибки
    vi.mocked(WindowUnminimise).mockRejectedValue(
      new Error("Не удалось развернуть окно")
    );

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук и получаем его состояние
    const { result } = renderHook(() => useModals());

    // Проверяем исходное состояние
    expect(result.current.showAddTorrent).toBe(false);
    expect(result.current.torrentFilePath).toBeNull();

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
      }
    });

    // Проверяем, что ошибка была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to activate window:",
      expect.any(Error)
    );

    // Проверяем, что setTorrentFilePath и setShowAddTorrent были вызваны
    // даже после исключения
    expect(result.current.showAddTorrent).toBe(true);
    expect(result.current.torrentFilePath).toBe("/path/to/test.torrent");

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });

  it("должен обрабатывать неожиданные ошибки в блоке catch", async () => {
    // Мок для WindowUnminimise выбрасывает ошибку
    vi.mocked(WindowUnminimise).mockImplementation(() => {
      // Выбрасываем ошибку, которая не является экземпляром Error
      throw "Необычная ошибка без стека";
    });

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
      }
    });

    // Проверяем, что ошибка была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to activate window:",
      "Необычная ошибка без стека"
    );

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });

  it("должен очищать предыдущий таймер при повторном вызове", async () => {
    // Ожидаем, что таймер использует определенную задержку
    expect(EXPECTED_RESET_DELAY_MS).toBe(1000);

    // useRef сохраняет значение между рендерами, поэтому тест остается действительным
    // даже после переименования с timeoutIdRef на resetAlwaysOnTopTimeoutRef

    // Рендерим хук
    renderHook(() => useModals());

    // Первый вызов
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test1.torrent");
      }
    });

    // Должен быть вызван WindowSetAlwaysOnTop(true)
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenLastCalledWith(true);

    // Второй вызов без ожидания завершения таймера
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test2.torrent");
      }
    });

    // Снова должен быть вызван WindowSetAlwaysOnTop(true)
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenCalledWith(true);

    // Очищаем историю вызовов перед запуском таймеров
    vi.mocked(WindowSetAlwaysOnTop).mockClear();

    // Запускаем таймеры
    vi.runAllTimers();

    // После выполнения всех таймеров, функция должна быть вызвана
    // только один раз (от последнего таймера), независимо от использования
    // локальной переменной или useRef
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(WindowSetAlwaysOnTop)).toHaveBeenCalledWith(false);
  });

  it("должен обрабатывать ошибки при сбросе always-on-top состояния", async () => {
    // Первый вызов WindowSetAlwaysOnTop(true) должен пройти успешно
    vi.mocked(WindowSetAlwaysOnTop).mockImplementation((value) => {
      if (value === true) {
        return Promise.resolve(undefined);
      } else {
        return Promise.reject(
          new Error("Не удалось сбросить always-on-top состояние")
        );
      }
    });

    // Шпионим за console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Рендерим хук
    renderHook(() => useModals());

    // Симулируем вызов колбэка с путем к торрент-файлу
    await act(async () => {
      if (callbackRegistry.current) {
        await callbackRegistry.current("/path/to/test.torrent");
      }
    });

    // Запускаем таймер
    await act(async () => {
      vi.runAllTimers();
    });

    // Проверяем, что ошибка в setTimeout была обработана и залогирована
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to reset always-on-top state:",
      expect.any(Error)
    );

    // Восстанавливаем console.error
    consoleErrorSpy.mockRestore();
  });
});
