import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsStateManagement } from "../useSettingsStateManagement";
import { ConnectionConfig } from "@app/App"; // Use path alias

// Mock useLocalization (relying on global mock from setup-tests.tsx)
vi.mock("@contexts/LocalizationContext", async () => {
  // Use path alias
  const actual = await vi.importActual("@contexts/LocalizationContext"); // Use path alias
  return {
    ...actual,
    useLocalization: () => ({
      t: (key: string) => key, // Simple mock translation function
      currentLanguage: "en",
      setLanguage: vi.fn(),
    }),
  };
});

const defaultSettings: ConnectionConfig = {
  host: "",
  port: 9091,
  username: "",
  password: "",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

describe("useSettingsStateManagement Hook", () => {
  it("initializes with default settings", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: defaultSettings })
    );
    expect(result.current.settings).toEqual(defaultSettings);
    expect(result.current.errors).toEqual({});
  });

  it("updates settings correctly via handleSettingsChange", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: defaultSettings })
    );

    act(() => {
      result.current.handleSettingsChange({ host: "new-host", port: 1234 });
    });

    expect(result.current.settings.host).toBe("new-host");
    expect(result.current.settings.port).toBe(1234);
    // Check that other settings remain default
    expect(result.current.settings.username).toBe("");
  });

  it("clears related errors when settings change via handleSettingsChange", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({
        initialSettings: { ...defaultSettings, host: "" },
      })
    );

    // Set an initial error
    act(() => {
      result.current.validateSettings();
    });
    expect(result.current.errors.host).toBe("settings.hostRequired");

    // Change the host setting
    act(() => {
      result.current.handleSettingsChange({ host: "valid-host" });
    });

    // Expect the host error to be cleared
    expect(result.current.errors.host).toBeUndefined();
  });

  it("validates settings correctly - success case", () => {
    const validSettings = { ...defaultSettings, host: "valid-host" };
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: validSettings })
    );

    let isValid = false;
    act(() => {
      isValid = result.current.validateSettings();
    });

    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it("validates settings correctly - failure cases", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: defaultSettings })
    );

    // Test host required
    let isValid = false;
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.host).toBe("settings.hostRequired");

    // Fix host, test invalid port (low)
    act(() => {
      result.current.handleSettingsChange({ host: "valid", port: 0 });
    });
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.port).toBe("settings.invalidPort");
    expect(result.current.errors.host).toBeUndefined(); // Previous error should be gone

    // Test invalid port (high)
    act(() => {
      result.current.handleSettingsChange({ port: 65536 });
    });
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.port).toBe("settings.invalidPort");

    // Fix port, test invalid ratio
    act(() => {
      result.current.handleSettingsChange({ port: 9091, maxUploadRatio: -1 });
    });
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.maxUploadRatio).toBe("settings.invalidRatio");
    expect(result.current.errors.port).toBeUndefined();

    // Fix ratio, test invalid speed
    act(() => {
      result.current.handleSettingsChange({
        maxUploadRatio: 1,
        slowSpeedLimit: -10,
      });
    });
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(false);
    expect(result.current.errors.slowSpeedLimit).toBe("settings.invalidSpeed");
    expect(result.current.errors.maxUploadRatio).toBeUndefined();

    // Fix speed
    act(() => {
      result.current.handleSettingsChange({ slowSpeedLimit: 50 });
    });
    act(() => {
      isValid = result.current.validateSettings();
    });
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it("resets errors correctly", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: defaultSettings })
    );

    // Set an error
    act(() => {
      result.current.validateSettings();
    });
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    // Reset errors
    act(() => {
      result.current.resetErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it("allows direct setting update via setSettingsDirectly", () => {
    const { result } = renderHook(() =>
      useSettingsStateManagement({ initialSettings: defaultSettings })
    );
    const newSettings = { ...defaultSettings, host: "direct-set-host" };

    act(() => {
      result.current.setSettingsDirectly(newSettings);
    });

    expect(result.current.settings).toEqual(newSettings);
  });
});
