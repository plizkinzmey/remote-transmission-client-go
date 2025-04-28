import { describe, it, expect, vi, beforeEach } from "vitest";
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

const mockShowNotification = vi.mocked(AppAPI.ShowNotification);
const mockLogError = vi.mocked(LogError);

describe("useNotification", () => {
  // Сбрасываем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Создаем функцию-обертку без использования JSX
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(MockLocalizationProvider, { children });
  };

  it("showSuccess вызывает ShowNotification с уровнем success", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showSuccess("Успех", "Тестовое сообщение");
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "Успех",
      "Тестовое сообщение",
      "success"
    );
  });

  it("showError вызывает ShowNotification с уровнем error", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showError("Ошибка", "Тестовое сообщение об ошибке");
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "Ошибка",
      "Тестовое сообщение об ошибке",
      "error"
    );
  });

  it("showInfo вызывает ShowNotification с уровнем info", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showInfo("Информация", "Информационное сообщение");
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "Информация",
      "Информационное сообщение",
      "info"
    );
  });

  it("showWarning вызывает ShowNotification с уровнем warning", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showWarning(
        "Предупреждение",
        "Предупреждающее сообщение"
      );
    });

    expect(mockShowNotification).toHaveBeenCalledWith(
      "Предупреждение",
      "Предупреждающее сообщение",
      "warning"
    );
  });

  it("showFormatted использует локализацию для форматирования сообщения", async () => {
    mockShowNotification.mockResolvedValue();

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showFormatted(
        "Заголовок",
        "torrent.downloaded",
        { name: "test.iso" },
        "success"
      );
    });

    // Локализованная строка в мокированном провайдере будет просто ключом
    expect(mockShowNotification).toHaveBeenCalledWith(
      "Заголовок",
      "torrent.downloaded", // Мок возвращает ключ без обработки форматирования
      "success"
    );
  });

  it("обрабатывает ошибки при вызове ShowNotification", async () => {
    const testError = new Error("Test error");
    mockShowNotification.mockRejectedValue(testError);

    const { result } = renderHook(() => useNotification(), { wrapper });

    await act(async () => {
      await result.current.showSuccess("Тест", "Сообщение с ошибкой");
    });

    // Проверяем, что ошибка была залогирована
    expect(mockLogError).toHaveBeenCalledWith(
      "Failed to show notification: Error: Test error"
    );
    // Также консоль.error должен был быть вызван
    expect(console.error).toHaveBeenCalled();
  });
});
