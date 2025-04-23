import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionStats } from "../useSessionStats";
import * as AppAPI from "@wailsjs/go/main/App";
import { SessionStatsData } from "../types";

// Мокируем API
vi.mock("@wailsjs/go/main/App", () => ({
  GetSessionStats: vi.fn(),
}));

const mockStats: SessionStatsData = {
  TotalDownloadSpeed: 1024,
  TotalUploadSpeed: 512,
  FreeSpace: 1000000000,
  TransmissionVersion: "3.00",
};

describe("useSessionStats", () => {
  beforeEach(() => {
    vi.useFakeTimers(); // Используем фейковые таймеры
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers(); // Возвращаем реальные таймеры
  });

  it("should not fetch stats if not initialized", () => {
    renderHook(() => useSessionStats(false));
    expect(AppAPI.GetSessionStats).not.toHaveBeenCalled();
  });

  it("should fetch stats immediately and set interval if initialized", async () => {
    vi.mocked(AppAPI.GetSessionStats).mockResolvedValue(mockStats);
    const { result } = renderHook(() => useSessionStats(true));

    // Проверяем немедленный вызов
    await act(async () => {
      await Promise.resolve(); // Даем промису выполниться
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1);
    expect(result.current.sessionStats).toEqual(mockStats);
    expect(result.current.error).toBeNull();

    // Проверяем вызов по интервалу
    await act(async () => {
      vi.advanceTimersByTime(1000); // Продвигаем время на 1 секунду
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(3);
  });

  it("should handle fetch error", async () => {
    const error = new Error("API Error");
    vi.mocked(AppAPI.GetSessionStats).mockRejectedValue(error);
    const { result } = renderHook(() => useSessionStats(true));

    await act(async () => {
      await Promise.resolve(); // Даем промису выполниться
    });

    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1);
    expect(result.current.sessionStats).toBeNull();
    expect(result.current.error).toBe("Failed to fetch session stats.");
  });

  it("should clear interval on unmount", async () => {
    vi.mocked(AppAPI.GetSessionStats).mockResolvedValue(mockStats);
    const { unmount } = renderHook(() => useSessionStats(true));

    await act(async () => {
      await Promise.resolve();
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1);

    unmount(); // Размонтируем хук

    // Продвигаем таймеры, но вызовов больше быть не должно
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1); // Вызов остался один
  });

  it("should clear error on successful fetch after an error", async () => {
    const error = new Error("API Error");
    vi.mocked(AppAPI.GetSessionStats)
      .mockRejectedValueOnce(error) // Первый вызов - ошибка
      .mockResolvedValue(mockStats); // Второй вызов - успех

    const { result } = renderHook(() => useSessionStats(true));

    // Первый вызов (ошибка)
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error).toBe("Failed to fetch session stats.");
    expect(result.current.sessionStats).toBeNull();

    // Второй вызов (успех) по интервалу
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Ждем выполнения асинхронной операции внутри refreshSessionStats
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull(); // Ошибка должна сброситься
    expect(result.current.sessionStats).toEqual(mockStats);
  });

  it("should not fetch stats if isInitialized becomes false", async () => {
    vi.mocked(AppAPI.GetSessionStats).mockResolvedValue(mockStats);
    const { rerender } = renderHook(
      ({ initialized }) => useSessionStats(initialized),
      {
        initialProps: { initialized: true },
      }
    );

    // Первый вызов при initialized: true
    await act(async () => {
      await Promise.resolve();
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1);

    // Меняем initialized на false
    rerender({ initialized: false });

    // Продвигаем таймеры, новых вызовов быть не должно
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(AppAPI.GetSessionStats).toHaveBeenCalledTimes(1); // Вызов остался один
  });

  it("устанавливает ошибку, если GetSessionStats выбрасывает", async () => {
    // Мокаем GetSessionStats чтобы выбрасывал ошибку
    const error = new Error("fail");
    vi.mocked(AppAPI.GetSessionStats).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSessionStats(true));
    await act(async () => {
      await result.current.refreshSessionStats();
    });

    expect(result.current.error).toBe("Failed to fetch session stats.");
  });
});
