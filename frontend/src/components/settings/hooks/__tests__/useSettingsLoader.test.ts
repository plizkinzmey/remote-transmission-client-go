import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSettingsLoader } from "../useSettingsLoader";
import { LoadConfig } from "@wailsjs/go/main/App";
import { ConnectionConfig } from "@app/App";

// Mock LoadConfig (relying on global mock from setup-tests.tsx)
// We will control its behavior in beforeEach or specific tests

const defaultSettings: ConnectionConfig = {
  host: "",
  port: 9091,
  username: "",
  password: "",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

describe("useSettingsLoader Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for LoadConfig for this suite
    (LoadConfig as Mock).mockResolvedValue(null);
  });

  it("initializes with isLoading=false and default settings when isFirstStart=true", () => {
    const { result } = renderHook(() =>
      useSettingsLoader({ isFirstStart: true, defaultSettings })
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.settings).toEqual(defaultSettings);
    // Check that LoadConfig was not called
    expect(LoadConfig).not.toHaveBeenCalled();
  });

  it("initializes with isLoading=true when isFirstStart=false and starts loading", async () => {
    const mockConfig: ConnectionConfig = {
      host: "loaded-host",
      port: 9999,
      username: "loaded-user",
      password: "loaded-pw",
      maxUploadRatio: 5,
      slowSpeedLimit: 25,
      slowSpeedUnit: "KiB/s",
    };
    (LoadConfig as Mock).mockResolvedValue(mockConfig);

    const { result } = renderHook(() =>
      useSettingsLoader({ isFirstStart: false, defaultSettings })
    );

    // Initially loading should be true
    expect(result.current.isLoading).toBe(true);
    // Settings might initially be default until loading completes
    expect(result.current.settings).toEqual(defaultSettings);

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that settings are updated
    expect(result.current.settings).toEqual(mockConfig);
    expect(LoadConfig).toHaveBeenCalledTimes(1);
  });

  it("sets settings to default if LoadConfig returns null", async () => {
    (LoadConfig as Mock).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useSettingsLoader({ isFirstStart: false, defaultSettings })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(defaultSettings);
    expect(LoadConfig).toHaveBeenCalledTimes(1);
  });

  it("handles error during LoadConfig and uses default settings", async () => {
    const loadError = new Error("Failed to load config");
    (LoadConfig as Mock).mockRejectedValue(loadError);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useSettingsLoader({ isFirstStart: false, defaultSettings })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load settings:",
      loadError
    );
    // Check that settings are default
    expect(result.current.settings).toEqual(defaultSettings);
    expect(LoadConfig).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it("provides setSettings function to allow external updates", async () => {
    const { result } = renderHook(() =>
      useSettingsLoader({ isFirstStart: true, defaultSettings })
    );
    const newSettings = { ...defaultSettings, host: "external-update" };

    act(() => {
      result.current.setSettings(newSettings);
    });

    expect(result.current.settings).toEqual(newSettings);
  });
});
