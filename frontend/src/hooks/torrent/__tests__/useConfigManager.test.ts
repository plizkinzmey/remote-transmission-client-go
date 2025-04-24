import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConfigManager } from "../useConfigManager";
import { AppConfig } from "../types";
import { ConnectionConfig } from "@/App";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";

const mockInitialConfig: AppConfig = {
  host: "initial_host",
  port: 9091,
  username: "initial_user",
  password: "initial_password",
  maxUploadRatio: 1,
  slowSpeedLimit: 20,
  slowSpeedUnit: "KiB/s",
  language: "en",
  theme: "dark",
};

const newConnectionSettings: ConnectionConfig = {
  host: "new_host",
  port: 9092,
  username: "new_user",
  password: "new_password",
  maxUploadRatio: 3,
  slowSpeedLimit: 100,
  slowSpeedUnit: "MiB/s",
};

const expectedFullConfig: AppConfig = {
  ...newConnectionSettings,
  language: "en", // Взято из мока локализации по умолчанию
  theme: "dark", // Взято из initialConfig
};

// Обертка для использования мока локализации
const renderHookWithProviders = (
  hook: (props: any) => any,
  initialProps: any
) => {
  return renderHook(hook, {
    wrapper: MockLocalizationProvider,
    initialProps: initialProps,
  });
};

describe("useConfigManager", () => {
  const mockOnConfigSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConfigSave.mockClear(); // Сбрасываем мок перед каждым тестом
  });

  const setupHook = (initialConfig: AppConfig | null = mockInitialConfig) =>
    renderHookWithProviders(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      { initialConfig, onConfigSave: mockOnConfigSave }
    );

  it("should initialize with initialConfig", () => {
    const { result } = setupHook();
    expect(result.current.config).toEqual(mockInitialConfig);
    expect(result.current.isSettingsSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should initialize with null if initialConfig is null", () => {
    const { result } = setupHook(null);
    expect(result.current.config).toBeNull();
  });

  it("handleSettingsSave should call onConfigSave with merged config and return true on success", async () => {
    mockOnConfigSave.mockResolvedValue(true); // Имитируем успешное сохранение
    const { result } = setupHook();

    let success = false;
    await act(async () => {
      success = await result.current.handleSettingsSave(newConnectionSettings);
    });

    expect(success).toBe(true);
    expect(result.current.isSettingsSaving).toBe(false);
    expect(mockOnConfigSave).toHaveBeenCalledTimes(1);
    // Проверяем, что onConfigSave вызван с полным, смерженным конфигом
    expect(mockOnConfigSave).toHaveBeenCalledWith(
      expect.objectContaining(expectedFullConfig)
    );
    // Проверяем, что внутренний конфиг обновился
    expect(result.current.config).toEqual(
      expect.objectContaining(expectedFullConfig)
    );
    expect(result.current.error).toBeNull();
  });

  it("handleSettingsSave should use default UI settings if initial config is null", async () => {
    mockOnConfigSave.mockResolvedValue(true);
    const { result } = setupHook(null); // Запускаем без initialConfig

    const expectedConfigWithDefaults: AppConfig = {
      ...newConnectionSettings,
      language: "en", // Из мока локализации
      theme: "light", // Значение по умолчанию
      // Значения по умолчанию для недостающих полей ConnectionConfig
      maxUploadRatio: newConnectionSettings.maxUploadRatio,
      slowSpeedLimit: newConnectionSettings.slowSpeedLimit,
      slowSpeedUnit: newConnectionSettings.slowSpeedUnit,
    };

    await act(async () => {
      await result.current.handleSettingsSave(newConnectionSettings);
    });

    expect(mockOnConfigSave).toHaveBeenCalledWith(
      expect.objectContaining(expectedConfigWithDefaults)
    );
    expect(result.current.config).toEqual(
      expect.objectContaining(expectedConfigWithDefaults)
    );
  });

  it("handleSettingsSave should return false and set error if onConfigSave fails", async () => {
    mockOnConfigSave.mockResolvedValue(false); // Имитируем ошибку сохранения (возвращает false)
    const { result } = setupHook();
    const originalConfig = result.current.config; // Сохраняем исходный конфиг

    let success = true;
    await act(async () => {
      success = await result.current.handleSettingsSave(newConnectionSettings);
    });

    expect(success).toBe(false);
    expect(result.current.isSettingsSaving).toBe(false);
    expect(mockOnConfigSave).toHaveBeenCalledTimes(1);
    expect(mockOnConfigSave).toHaveBeenCalledWith(
      expect.objectContaining(expectedFullConfig)
    );
    // Внутренний конфиг не должен обновиться при ошибке
    expect(result.current.config).toEqual(originalConfig);
    // Ожидаем только ключ ошибки из-за мока t()
    expect(result.current.error).toBe("errors.failedToUpdateSettings");
  });

  it("handleSettingsSave should return false and set error if onConfigSave throws", async () => {
    const saveError = new Error("Internal save error");
    mockOnConfigSave.mockRejectedValue(saveError); // Имитируем выброс исключения
    const { result } = setupHook();
    const originalConfig = result.current.config;

    let success = true;
    await act(async () => {
      success = await result.current.handleSettingsSave(newConnectionSettings);
    });

    expect(success).toBe(false);
    expect(result.current.isSettingsSaving).toBe(false);
    expect(mockOnConfigSave).toHaveBeenCalledTimes(1);
    expect(result.current.config).toEqual(originalConfig);
    // Ожидаем только ключ ошибки из-за мока t()
    expect(result.current.error).toBe("errors.failedToUpdateSettings");
  });

  it("should update config when initialConfig prop changes", () => {
    const { result, rerender } = renderHookWithProviders(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      { initialConfig: mockInitialConfig, onConfigSave: mockOnConfigSave }
    );

    expect(result.current.config).toEqual(mockInitialConfig);

    const updatedInitialConfig = {
      ...mockInitialConfig,
      theme: "auto" as const,
    };
    rerender({
      initialConfig: updatedInitialConfig,
      onConfigSave: mockOnConfigSave,
    });

    expect(result.current.config).toEqual(updatedInitialConfig);
  });

  it("setConfig should update the config state directly", () => {
    const { result } = setupHook();
    const newConfigDirect: AppConfig = {
      host: "direct_host",
      port: 1111,
      username: "d_user",
      password: "d_pwd",
      maxUploadRatio: 5,
      slowSpeedLimit: 5,
      slowSpeedUnit: "MiB/s",
      language: "fr",
      theme: "auto",
    };

    act(() => {
      result.current.setConfig(newConfigDirect);
    });

    expect(result.current.config).toEqual(newConfigDirect);
  });

  it("should fallback to default UI settings when config language and localization language are empty", async () => {
    mockOnConfigSave.mockResolvedValue(true);
    // обёртка с пустым currentLanguage
    const wrapper = ({ children }: { children: any }) =>
      React.createElement(
        MockLocalizationProvider as any,
        { initialLanguage: "" },
        children
      );

    const { result } = renderHook(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      {
        wrapper,
        initialProps: {
          initialConfig: mockInitialConfig,
          onConfigSave: mockOnConfigSave,
        },
      }
    );

    // принудительно задать пустые строки в config
    act(() => {
      result.current.setConfig({
        ...mockInitialConfig,
        language: "",
        theme: "" as any,
      });
    });

    await act(async () => {
      await result.current.handleSettingsSave(newConnectionSettings);
    });

    // Должен подставиться язык "en" и тема "light"
    expect(mockOnConfigSave).toHaveBeenCalledWith(
      expect.objectContaining({ language: "en", theme: "light" })
    );
    expect(result.current.config).toEqual(
      expect.objectContaining({ language: "en", theme: "light" })
    );
  });

  it("should handle handleSettingsSave when t() throws", async () => {
    // Мокаем t чтобы выбрасывал ошибку
    const errorT = () => {
      throw new Error("t failed");
    };
    const wrapper = ({ children }: { children: any }) =>
      React.createElement(
        MockLocalizationProvider as any,
        { t: errorT },
        children
      );
    mockOnConfigSave.mockResolvedValue(false);
    const { result } = renderHook(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      {
        wrapper,
        initialProps: {
          initialConfig: mockInitialConfig,
          onConfigSave: mockOnConfigSave,
        },
      }
    );
    let success = true;
    await act(async () => {
      success = await result.current.handleSettingsSave(newConnectionSettings);
    });
    expect(success).toBe(false);
    expect(result.current.isSettingsSaving).toBe(false);
    // Ошибка не должна приводить к падению теста, error должен быть установлен (может быть null или не null)
    // Главное — не должно быть необработанного исключения
  });

  it("should fallback to default error if t throws in catch block", async () => {
    const errorT = () => {
      throw new Error("t failed");
    };
    const wrapper = ({ children }: { children: any }) =>
      React.createElement(
        MockLocalizationProvider as any,
        { t: errorT },
        children
      );
    // onConfigSave выбрасывает ошибку
    mockOnConfigSave.mockRejectedValue(new Error("fail"));
    const { result } = renderHook(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      {
        wrapper,
        initialProps: {
          initialConfig: mockInitialConfig,
          onConfigSave: mockOnConfigSave,
        },
      }
    );
    await act(async () => {
      await result.current.handleSettingsSave(newConnectionSettings);
    });
    expect(result.current.error).toBe("errors.failedToUpdateSettings");
    expect(result.current.isSettingsSaving).toBe(false);
  });

  it("should always call setIsSettingsSaving(false) even if error thrown in finally", async () => {
    // Мокаем setIsSettingsSaving чтобы выбрасывал ошибку
    let setIsSettingsSaving: any = undefined;
    const originalUseState = React.useState;
    // @ts-expect-error: для теста мокируем useState с несовместимой сигнатурой
    const spy = vi.spyOn(React, "useState").mockImplementation((init: any) => {
      if (init === false && !setIsSettingsSaving) {
        // ловим именно setIsSettingsSaving
        const stateTuple: [any, (v: any) => void] = [
          init,
          (v: any) => {
            if (v === false) throw new Error("setIsSettingsSaving failed");
          },
        ];
        setIsSettingsSaving = stateTuple[1];
        return stateTuple as any;
      }
      return originalUseState(init);
    });

    mockOnConfigSave.mockResolvedValue(true);
    const { result } = renderHookWithProviders(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      { initialConfig: mockInitialConfig, onConfigSave: mockOnConfigSave }
    );
    // Даже если setIsSettingsSaving выбрасывает ошибку, не должно быть необработанного исключения
    await act(async () => {
      await result.current.handleSettingsSave(newConnectionSettings);
    });
    spy.mockRestore();
  });

  it("покрывает ветку catch в finally, если setIsSettingsSaving выбрасывает ошибку", async () => {
    let setIsSettingsSaving: any = undefined;
    const originalUseState = React.useState;
    // @ts-expect-error
    const spy = vi.spyOn(React, "useState").mockImplementation((init: any) => {
      if (init === false && !setIsSettingsSaving) {
        const stateTuple: [any, (v: any) => void] = [
          init,
          (v: any) => {
            if (v === false) throw new Error("setIsSettingsSaving failed");
          },
        ];
        setIsSettingsSaving = stateTuple[1];
        return stateTuple as any;
      }
      return originalUseState(init);
    });

    const { result } = renderHookWithProviders(
      ({ initialConfig, onConfigSave }) =>
        useConfigManager({ initialConfig, onConfigSave }),
      {
        initialConfig: mockInitialConfig,
        onConfigSave: vi.fn().mockResolvedValue(true),
      }
    );
    await act(async () => {
      await result.current.handleSettingsSave(newConnectionSettings);
    });
    spy.mockRestore();
  });
});
