import { renderHook, act } from "@testing-library/react";
import { useNotification } from "../useNotification";
import { ShowNotification } from "@wailsjs/go/main/App";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";

// Мокируем Wails модули
vi.mock("@wailsjs/go/main/App", () => ({
  ShowNotification: vi.fn(),
}));

vi.mock("@wailsjs/runtime", () => ({
  LogError: vi.fn(),
}));

describe("useNotification дедупликация", () => {
  const mockShowNotification = vi.mocked(ShowNotification);

  // Создаем функцию-обертку для контекста локализации
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(MockLocalizationProvider, { children });
  };

  beforeEach(() => {
    mockShowNotification.mockReset();
    mockShowNotification.mockResolvedValue(undefined);
    vi.useFakeTimers(); // Используем фальшивые таймеры для контроля времени
  });

  afterEach(() => {
    vi.useRealTimers(); // Возвращаем реальные таймеры после тестов
  });

  it("должен дедуплицировать идентичные уведомления в течение 5 секунд", async () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    // Первое уведомление
    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenLastCalledWith(
      "notifications.success.title",
      "notifications.success.message",
      "success"
    );

    // Сбрасываем моки для четкости
    mockShowNotification.mockReset();
    mockShowNotification.mockResolvedValue(undefined);

    // Второе идентичное уведомление через 1 секунду
    vi.advanceTimersByTime(1000);

    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message"
      );
    });

    // Проверяем, что второй вызов был предотвращен
    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  it("должен разрешать идентичные уведомления после периода дедупликации", async () => {
    const { result } = renderHook(() => useNotification(), { wrapper });

    // Первое уведомление
    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledTimes(1);

    // Сбрасываем моки для четкости
    mockShowNotification.mockReset();
    mockShowNotification.mockResolvedValue(undefined);

    // Второе идентичное уведомление через 6 секунд (больше периода дедупликации)
    vi.advanceTimersByTime(6000);

    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message"
      );
    });

    // Проверяем, что второй вызов прошел успешно
    expect(mockShowNotification).toHaveBeenCalledTimes(1);
    expect(mockShowNotification).toHaveBeenLastCalledWith(
      "notifications.success.title",
      "notifications.success.message",
      "success"
    );
  });
});
