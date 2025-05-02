import { renderHook, act } from "@testing-library/react";
import { useConnectionManager } from "../useConnectionManager";
import * as AppAPI from "@wailsjs/go/main/App";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";

// Мокаем функции API приложения
vi.mock("@wailsjs/go/main/App", () => ({
  Initialize: vi.fn(),
  LoadConfig: vi.fn(),
  ShowNotification: vi.fn(),
}));

// Мок для хука уведомлений
vi.mock("@/hooks/useNotification", () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
    showDirect: vi.fn(),
    showFormatted: vi.fn(),
  }),
}));

// Мок для контекста локализации
vi.mock("@/contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

describe("useConnectionManager инициализация", () => {
  const mockInitialize = vi.mocked(AppAPI.Initialize);
  const mockLoadConfig = vi.mocked(AppAPI.LoadConfig);

  beforeEach(() => {
    // Сбрасываем моки
    mockInitialize.mockReset();
    mockLoadConfig.mockReset();

    // Настраиваем возвращаемые значения с правильным типом на основе useConfigManager.test.ts
    mockInitialize.mockResolvedValue(undefined);
    mockLoadConfig.mockResolvedValue({
      host: "localhost",
      port: 9091,
      username: "",
      password: "",
      theme: "light",
      slowSpeedUnit: "KiB/s",
      language: "ru",
      maxUploadRatio: 0,
      slowSpeedLimit: 0,
      downloadPaths: [], // Добавляем пустой массив путей загрузки
      defaultDownloadPath: "", // Добавляем пустую строку для пути по умолчанию
    });
  });

  it("должен инициализировать соединение только один раз, даже если зависимости эффекта изменились", async () => {
    const { result, rerender } = renderHook(() => useConnectionManager());

    // Ждем, пока произойдет первоначальная инициализация
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Проверяем, что Initialize был вызван один раз
    expect(mockInitialize).toHaveBeenCalledTimes(1);

    // Сбрасываем счетчики вызовов
    mockInitialize.mockClear();

    // Перерендерим хук, что должно вызвать повторное выполнение эффекта
    rerender();

    // Ждем, чтобы дать эффекту время выполниться, если он запустится
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Проверяем, что Initialize больше не вызывался
    expect(mockInitialize).not.toHaveBeenCalled();
  });
});
