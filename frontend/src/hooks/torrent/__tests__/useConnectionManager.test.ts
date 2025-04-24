import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectionManager } from "../useConnectionManager";
import * as AppAPI from "@wailsjs/go/main/App";
import { AppConfig } from "../types";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";

// Мокируем API
vi.mock("@wailsjs/go/main/App", () => ({
  Initialize: vi.fn(),
  LoadConfig: vi.fn(),
}));

const mockFullConfig: AppConfig = {
  host: "localhost",
  port: 9091,
  username: "user",
  password: "password",
  maxUploadRatio: 2,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
  language: "en",
  theme: "light",
};

const mockSavedPartialConfig = {
  host: "localhost",
  port: 9091,
  username: "user",
  password: "password",
  maxUploadRatio: 2,
  slowSpeedLimit: 50,
};

const expectedNormalizedConfig: AppConfig = {
  ...mockSavedPartialConfig,
  theme: "light",
  slowSpeedUnit: "KiB/s",
  language: "en",
};

const renderHookWithProviders = (hook: () => any) => {
  return renderHook(hook, {
    wrapper: MockLocalizationProvider,
  });
};

describe("useConnectionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading state", () => {
    const { result } = renderHookWithProviders(() => useConnectionManager());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.initialConfig).toBeNull();
  });

  it("should load config and connect successfully on mount if config exists", async () => {
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(
      mockSavedPartialConfig as any
    );
    vi.mocked(AppAPI.Initialize).mockResolvedValue(undefined);

    const { result } = renderHookWithProviders(() => useConnectionManager());

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(AppAPI.LoadConfig).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).toHaveBeenCalledWith(
      JSON.stringify(expectedNormalizedConfig)
    );
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.initialConfig).toEqual(expectedNormalizedConfig);
  });

  it("should finish loading and not initialize if no config exists", async () => {
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(null as any);

    const { result } = renderHookWithProviders(() => useConnectionManager());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(AppAPI.LoadConfig).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).not.toHaveBeenCalled();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.initialConfig).toBeNull();
  });

  it("should handle LoadConfig error", async () => {
    const loadError = new Error("Failed to load config");
    vi.mocked(AppAPI.LoadConfig).mockRejectedValue(loadError);

    const { result } = renderHookWithProviders(() => useConnectionManager());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(AppAPI.LoadConfig).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).not.toHaveBeenCalled();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBe("errors.failedToLoadConfig");
    expect(result.current.initialConfig).toBeNull();
  });

  it("should handle Initialize error during initial load", async () => {
    const initError = new Error("Connection failed");
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(
      mockSavedPartialConfig as any
    );
    vi.mocked(AppAPI.Initialize).mockRejectedValue(initError);

    const { result } = renderHookWithProviders(() => useConnectionManager());

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(AppAPI.LoadConfig).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).toHaveBeenCalledTimes(1);
    expect(AppAPI.Initialize).toHaveBeenCalledWith(
      JSON.stringify(expectedNormalizedConfig)
    );
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.error).toBe("errors.connectionFailed");
    expect(result.current.initialConfig).toEqual(expectedNormalizedConfig);
  });

  it("connect function should attempt to initialize and return true on success", async () => {
    vi.mocked(AppAPI.Initialize).mockResolvedValue(undefined);
    const { result } = renderHookWithProviders(() => useConnectionManager());

    let success = false;
    await act(async () => {
      success = await result.current.connect(mockFullConfig);
    });

    expect(success).toBe(true);
    expect(AppAPI.Initialize).toHaveBeenCalledWith(
      JSON.stringify(mockFullConfig)
    );
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("connect function should attempt to initialize and return false on failure", async () => {
    const initError = new Error("Connection failed");
    vi.mocked(AppAPI.Initialize).mockRejectedValue(initError);
    const { result } = renderHookWithProviders(() => useConnectionManager());

    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(
      mockSavedPartialConfig as any
    );
    vi.mocked(AppAPI.Initialize).mockRejectedValueOnce(initError);
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    vi.mocked(AppAPI.Initialize).mockRejectedValue(initError);

    let success = true;
    await act(async () => {
      success = await result.current.connect(mockFullConfig);
    });

    expect(success).toBe(false);
    expect(AppAPI.Initialize).toHaveBeenCalledWith(
      JSON.stringify(mockFullConfig)
    );
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.error).toBe("errors.connectionFailed");
  });

  it("reconnect function should use initialConfig and return true on success", async () => {
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(
      mockSavedPartialConfig as any
    );
    vi.mocked(AppAPI.Initialize).mockResolvedValue(undefined);
    const { result } = renderHookWithProviders(() => useConnectionManager());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setConnectionError("Some error");
      result.current.setIsReconnectingState(true);
    });
    expect(result.current.isReconnecting).toBe(true);

    vi.mocked(AppAPI.Initialize).mockResolvedValue(undefined);

    let success = false;
    await act(async () => {
      success = await result.current.reconnect();
    });

    expect(success).toBe(true);
    expect(AppAPI.Initialize).toHaveBeenCalledTimes(2);
    expect(AppAPI.Initialize).toHaveBeenLastCalledWith(
      JSON.stringify(expectedNormalizedConfig)
    );
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reconnect function should return false on failure", async () => {
    const initError = new Error("Connection failed");
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(
      mockSavedPartialConfig as any
    );
    vi.mocked(AppAPI.Initialize).mockRejectedValue(initError);
    const { result } = renderHookWithProviders(() => useConnectionManager());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });

    vi.mocked(AppAPI.Initialize).mockRejectedValue(initError);

    let success = true;
    await act(async () => {
      success = await result.current.reconnect();
    });

    expect(success).toBe(false);
    expect(AppAPI.Initialize).toHaveBeenCalledTimes(2);
    expect(AppAPI.Initialize).toHaveBeenLastCalledWith(
      JSON.stringify(expectedNormalizedConfig)
    );
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.error).toBe("errors.connectionFailed");
  });

  it("reconnect function should return false if initialConfig is null", async () => {
    vi.mocked(AppAPI.LoadConfig).mockResolvedValue(null as any);
    const { result } = renderHookWithProviders(() => useConnectionManager());
    await act(async () => {
      await Promise.resolve();
    });

    let success = true;
    await act(async () => {
      success = await result.current.reconnect();
    });

    expect(success).toBe(false);
    expect(AppAPI.Initialize).not.toHaveBeenCalled();
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBe("errors.noConfigForReconnect");
  });

  it("setConnectionError should update the error state", () => {
    const { result } = renderHookWithProviders(() => useConnectionManager());
    act(() => {
      result.current.setConnectionError("Custom error");
    });
    expect(result.current.error).toBe("Custom error");
  });

  it("setIsReconnectingState should update the isReconnecting state", () => {
    const { result } = renderHookWithProviders(() => useConnectionManager());
    act(() => {
      result.current.setIsReconnectingState(true);
    });
    expect(result.current.isReconnecting).toBe(true);
    act(() => {
      result.current.setIsReconnectingState(false);
    });
    expect(result.current.isReconnecting).toBe(false);
  });
});
