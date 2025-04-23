import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTorrentList } from "../useTorrentList";
import * as AppAPI from "@wailsjs/go/main/App";
// Импортируем WailsTorrent из types
import { WailsTorrent } from "../types";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";

// Мокируем API и утилиту таймаута
vi.mock("@wailsjs/go/main/App", () => ({
  GetTorrents: vi.fn(),
}));
// Мокируем withTimeout
vi.mock("../types", async () => {
  const actual = await vi.importActual("../types");
  return {
    ...(actual as any),
    // Добавляем тип для promise
    withTimeout: vi.fn((promise: Promise<any>) => promise),
  };
});

// Используем WailsTorrent для мок-данных и задаем строковый статус
// Добавляем другие обязательные поля из domain.Torrent
const mockTorrentsData: WailsTorrent[] = [
  {
    ID: 1,
    Name: "Torrent 1",
    Status: "downloading", // Строковый статус
    Progress: 50.5,
    Size: 1024 * 1024 * 100,
    SizeFormatted: "100.0 MB",
    UploadRatio: 1.2,
    SeedsConnected: 10,
    SeedsTotal: 20,
    PeersConnected: 5,
    PeersTotal: 15,
    UploadedBytes: 1024 * 1024 * 120,
    UploadedFormatted: "120.0 MB",
    DownloadSpeed: 1024 * 500,
    UploadSpeed: 1024 * 100,
    DownloadSpeedFormatted: "500.0 KB/s",
    UploadSpeedFormatted: "100.0 KB/s",
    IsSlowMode: false,
  },
  {
    ID: 2,
    Name: "Torrent 2",
    Status: "seeding", // Строковый статус
    Progress: 100,
    Size: 1024 * 1024 * 200,
    SizeFormatted: "200.0 MB",
    UploadRatio: 2.5,
    SeedsConnected: 5,
    SeedsTotal: 10,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 1024 * 1024 * 500,
    UploadedFormatted: "500.0 MB",
    DownloadSpeed: 0,
    UploadSpeed: 1024 * 50,
    DownloadSpeedFormatted: "0.0 KB/s",
    UploadSpeedFormatted: "50.0 KB/s",
    IsSlowMode: true,
  },
];

// Обертка для использования мока локализации
const renderHookWithProviders = (
  hook: (props: { initialized: boolean }) => any,
  initialProps: { initialized: boolean }
) => {
  return renderHook(hook, {
    wrapper: MockLocalizationProvider,
    initialProps: initialProps,
  });
};

describe("useTorrentList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Сбрасываем состояние мока withTimeout перед каждым тестом
    vi.mocked(require("../types").withTimeout).mockImplementation(
      (promise: Promise<any>) => promise // Добавляем тип
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not fetch torrents if not initialized", () => {
    renderHookWithProviders(({ initialized }) => useTorrentList(initialized), {
      initialized: false,
    });
    expect(AppAPI.GetTorrents).not.toHaveBeenCalled();
  });

  it("should fetch torrents immediately, set loading state, and set interval if initialized", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData); // Убираем cast as any
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Начальное состояние - загрузка
    expect(result.current.isLoading).toBe(true);
    expect(result.current.torrents).toEqual([]);
    expect(result.current.error).toBeNull();

    // Ждем выполнения первого запроса
    await act(async () => {
      await Promise.resolve(); // Даем промису выполниться
    });

    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
    expect(result.current.torrents).toEqual(mockTorrentsData); // Тип должен совпадать с WailsTorrent[]
    expect(result.current.isLoading).toBe(false); // Загрузка завершена
    expect(result.current.error).toBeNull();

    // Проверяем вызов по интервалу
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);

    // Проверяем, что isLoading не становится true при последующих обновлениях
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle fetch error (non-timeout)", async () => {
    const error = new Error("API Error");
    vi.mocked(AppAPI.GetTorrents).mockRejectedValue(error);
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
    expect(result.current.torrents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull(); // Ошибка не таймаута не устанавливается здесь
  });

  it("should handle fetch timeout error", async () => {
    const timeoutError = new Error("errors.timeout"); // Имитируем ошибку таймаута
    // Мокируем withTimeout, чтобы он выбросил ошибку таймаута
    vi.mocked(require("../types").withTimeout).mockRejectedValue(timeoutError);
    // GetTorrents сам по себе не будет вызван, так как withTimeout упадет раньше

    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve(); // Даем промису выполниться (и упасть)
    });

    expect(require("../types").withTimeout).toHaveBeenCalledTimes(1);
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1); // GetTorrents вызывается внутри withTimeout
    expect(result.current.torrents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    // Ожидаем текст ошибки таймаута из локализации (ключ)
    expect(result.current.error).toBe("errors.timeoutExplanation");
  });

  it("should clear interval on unmount", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { unmount } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
  });

  it("should clear error on successful fetch after an error", async () => {
    const timeoutError = new Error("errors.timeout");
    // Мокируем withTimeout для ошибки и затем успеха
    vi.mocked(require("../types").withTimeout)
      .mockRejectedValueOnce(timeoutError)
      .mockImplementation((promise: Promise<any>) => promise);

    vi.mocked(AppAPI.GetTorrents)
      .mockResolvedValueOnce([]) // Возвращаем пустой массив WailsTorrent[]
      .mockResolvedValue(mockTorrentsData);

    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый вызов (ошибка таймаута)
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error).toBe("errors.timeoutExplanation");
    expect(result.current.torrents).toEqual([]);

    // Второй вызов (успех) по интервалу
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    // Ждем выполнения асинхронной операции внутри refreshTorrents
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull(); // Ошибка должна сброситься
    expect(result.current.torrents).toEqual(mockTorrentsData); // Тип должен совпадать
  });

  it("should call refreshTorrents manually", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Ждем первичной загрузки
    await act(async () => {
      await Promise.resolve();
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);

    // Вызываем вручную
    await act(async () => {
      await result.current.refreshTorrents();
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);
    expect(result.current.torrents).toEqual(mockTorrentsData); // Тип должен совпадать
  });

  it("should not fetch torrents if isInitialized becomes false", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { rerender } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый вызов при initialized: true
    await act(async () => {
      await Promise.resolve();
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);

    // Меняем initialized на false
    rerender({ initialized: false });

    // Продвигаем таймеры, новых вызовов быть не должно
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
  });
});
