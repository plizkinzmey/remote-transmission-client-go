import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNotification } from "../useNotification";
import * as AppAPI from "@wailsjs/go/main/App";
import { LogError } from "@wailsjs/runtime";
import { act } from "@testing-library/react";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";
import React from "react";

// Мокируем зависимости
vi.mock("@wailsjs/go/main/App", () => ({
  ShowNotification: vi.fn(),
}));

vi.mock("@wailsjs/runtime", () => ({
  LogError: vi.fn(),
}));

// Мокируем console.error
const originalConsoleError = console.error;
console.error = vi.fn();

const mockShowNotification = vi.mocked(AppAPI.ShowNotification);
const mockLogError = vi.mocked(LogError);

describe("useNotification", () => {
  // Сбрасываем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Восстанавливаем console.error после всех тестов
  afterAll(() => {
    console.error = originalConsoleError;
  });

  // Создаем функцию-обертку без использования JSX
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(MockLocalizationProvider, { children });
  };

  it("showSuccess вызывает ShowNotification с уровнем success и локализованными строками", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message"
      );
    });

    // MockLocalizationProvider просто возвращает ключи, поэтому проверяем, что они были переданы
    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.success.title", // В реальном приложении будет локализовано
      "notifications.success.message", // В реальном приложении будет локализовано
      "success"
    );
  });

  it("showError вызывает ShowNotification с уровнем error и локализованными строками", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showError(
        "notifications.error.title",
        "notifications.error.message"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.error.title",
      "notifications.error.message",
      "error"
    );
  });

  it("showInfo вызывает ShowNotification с уровнем info и локализованными строками", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showInfo(
        "notifications.info.title",
        "notifications.info.message"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.info.title",
      "notifications.info.message",
      "info"
    );
  });

  it("showWarning вызывает ShowNotification с уровнем warning и локализованными строками", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showWarning(
        "notifications.warning.title",
        "notifications.warning.message"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.warning.title",
      "notifications.warning.message",
      "warning"
    );
  });

  it("showSuccess корректно обрабатывает форматирование параметров", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showSuccess(
        "notifications.success.title",
        "notifications.success.message",
        { name: "test.iso" }
      );
    });

    // MockLocalizationProvider просто возвращает ключи
    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.success.title",
      "notifications.success.message",
      "success"
    );
  });

  it("showFormatted использует локализацию для заголовка и форматирования сообщения", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showFormatted(
        "notifications.download.title",
        "notifications.download.message",
        { name: "test.iso" },
        "success"
      );
    });

    // Локализованная строка в мокированном провайдере будет просто ключом
    expect(mockShowNotification).toHaveBeenCalledWith(
      "notifications.download.title",
      "notifications.download.message",
      "success"
    );
  });

  it("showDirect напрямую передает строки без локализации", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    const directTitle = "Прямой заголовок";
    const directMessage = "Прямое сообщение без локализации";

    await act(async () => {
      await result.current.showDirect(directTitle, directMessage, "info");
    });

    // Проверяем, что строки были переданы без изменений
    expect(mockShowNotification).toHaveBeenCalledWith(
      directTitle,
      directMessage,
      "info"
    );
  });

  it("обрабатывает ошибки при вызове ShowNotification", async () => {
    const testError = new Error("Test error");
    mockShowNotification.mockRejectedValue(testError);

    const { result } = renderHook(() => useNotification(), { wrapper });

    // Вызываем функцию без проверки промиса, так как функция не возвращает промис
    await act(async () => {
      result.current.showSuccess(
        "notifications.title",
        "notifications.message"
      );
    });

    // Проверяем, что ошибка была залогирована
    expect(mockLogError).toHaveBeenCalledWith(
      "Failed to show notification: Error: Test error"
    );
    // Также консоль.error должен был быть вызван
    expect(console.error).toHaveBeenCalled();
  });
});
