import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, MockedFunction } from "vitest";
import { useConnectionTest } from "../useConnectionTest";
import { ConnectionConfig } from "../../../../../App"; // Adjust path if needed
import { TestConnection } from "../../../../../../wailsjs/go/main/App"; // Mock this
import { useLocalization } from "../../../../../contexts/LocalizationContext";

// Mock Wails Go function
vi.mock("../../../../../../wailsjs/go/main/App", () => ({
  TestConnection: vi.fn(),
}));

// Mock useLocalization hook
vi.mock("../../../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        "settings.testSuccess": "Success",
        "settings.testError": "Generic Error",
        "errors.connectionAuthRequired": "Auth Error",
        "errors.connectionRefused": "Refused Error",
        "errors.connectionTimeout": "Timeout Error",
        "errors.invalidPort": "Invalid Port Error",
      };
      return translations[key] || key;
    },
  }),
}));

const mockTestConnection = TestConnection as MockedFunction<
  typeof TestConnection
>;

describe("useConnectionTest Hook", () => {
  const initialSettings: ConnectionConfig = {
    host: "testhost",
    port: 9091,
    username: "user",
    password: "pw",
    maxUploadRatio: 0,
    slowSpeedLimit: 0,
    slowSpeedUnit: "KiB/s",
  };
  const mockOnConnectionTest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConnectionTest.mockClear();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    expect(result.current.isTestingConnection).toBe(false);
    expect(result.current.connectionStatus).toBe("none");
    expect(result.current.statusMessage).toBe("");
  });

  it("should not test connection if host is empty", async () => {
    const settingsWithoutHost = { ...initialSettings, host: "" };
    const { result } = renderHook(() =>
      useConnectionTest(settingsWithoutHost, mockOnConnectionTest)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    expect(mockTestConnection).not.toHaveBeenCalled();
    expect(result.current.isTestingConnection).toBe(false);
  });

  it("should handle successful connection test", async () => {
    mockTestConnection.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    expect(result.current.isTestingConnection).toBe(false);

    await act(async () => {
      await result.current.testConnection();
    });

    expect(result.current.isTestingConnection).toBe(false);
    expect(result.current.connectionStatus).toBe("success");
    expect(result.current.statusMessage).toBe("Success");
    expect(mockTestConnection).toHaveBeenCalledWith(
      JSON.stringify(initialSettings)
    );
    expect(mockOnConnectionTest).toHaveBeenCalledWith(true);
  });

  it("should handle failed connection test (generic error)", async () => {
    const error = new Error("Network failed");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    expect(result.current.isTestingConnection).toBe(false);

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Generic Error");
    });
    expect(mockTestConnection).toHaveBeenCalledWith(
      JSON.stringify(initialSettings)
    );
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false, "Generic Error");
  });

  it("should handle failed connection test (auth error)", async () => {
    const error = new Error("errors.connectionAuthRequired");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Auth Error");
    });
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false, "Auth Error");
  });

  it("should handle failed connection test (refused error)", async () => {
    const error = new Error("connection refused");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Refused Error");
    });
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false, "Refused Error");
  });

  it("should handle failed connection test (timeout error)", async () => {
    const error = new Error("request timeout");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Timeout Error");
    });
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false, "Timeout Error");
  });

  it("should handle failed connection test (invalid port error)", async () => {
    const error = new Error("invalid port");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Invalid Port Error");
    });
    expect(mockOnConnectionTest).toHaveBeenCalledWith(
      false,
      "Invalid Port Error"
    );
  });

  it("should handle failed connection test when onConnectionTest is undefined", async () => {
    const error = new Error("Some error");
    mockTestConnection.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, undefined)
    );

    await act(async () => {
      await result.current.testConnection();
    });

    await waitFor(() => {
      expect(result.current.isTestingConnection).toBe(false);
      expect(result.current.connectionStatus).toBe("error");
      expect(result.current.statusMessage).toBe("Generic Error");
    });
    expect(mockOnConnectionTest).not.toHaveBeenCalled();
  });

  it("should reset status when resetStatus is called", () => {
    const { result } = renderHook(() =>
      useConnectionTest(initialSettings, mockOnConnectionTest)
    );

    mockOnConnectionTest.mockClear();

    act(() => {
      result.current.resetStatus();
    });

    expect(result.current.connectionStatus).toBe("none");
    expect(result.current.statusMessage).toBe("");
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
    expect(mockOnConnectionTest).toHaveBeenCalledTimes(1);
  });

  it("should reset status when settings change (host)", () => {
    const { result, rerender } = renderHook(
      ({ settings, onTest }) => useConnectionTest(settings, onTest),
      {
        initialProps: {
          settings: initialSettings,
          onTest: mockOnConnectionTest,
        },
      }
    );

    mockOnConnectionTest.mockClear();

    const newSettings = { ...initialSettings, host: "newhost" };
    rerender({ settings: newSettings, onTest: mockOnConnectionTest });

    expect(result.current.connectionStatus).toBe("none");
    expect(result.current.statusMessage).toBe("");
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
    expect(mockOnConnectionTest).toHaveBeenCalledTimes(1);
  });

  it("should reset status when port changes", () => {
    const { result, rerender } = renderHook(
      ({ settings, onTest }) => useConnectionTest(settings, onTest),
      {
        initialProps: {
          settings: initialSettings,
          onTest: mockOnConnectionTest,
        },
      }
    );

    mockOnConnectionTest.mockClear();
    const newSettings = { ...initialSettings, port: 9092 };
    rerender({ settings: newSettings, onTest: mockOnConnectionTest });

    expect(result.current.connectionStatus).toBe("none");
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
    expect(mockOnConnectionTest).toHaveBeenCalledTimes(1);
  });

  it("should reset status when username changes", () => {
    const { result, rerender } = renderHook(
      ({ settings, onTest }) => useConnectionTest(settings, onTest),
      {
        initialProps: {
          settings: initialSettings,
          onTest: mockOnConnectionTest,
        },
      }
    );

    mockOnConnectionTest.mockClear();
    const newSettings = { ...initialSettings, username: "newuser" };
    rerender({ settings: newSettings, onTest: mockOnConnectionTest });

    expect(result.current.connectionStatus).toBe("none");
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
    expect(mockOnConnectionTest).toHaveBeenCalledTimes(1);
  });

  it("should reset status when password changes", () => {
    const { result, rerender } = renderHook(
      ({ settings, onTest }) => useConnectionTest(settings, onTest),
      {
        initialProps: {
          settings: initialSettings,
          onTest: mockOnConnectionTest,
        },
      }
    );

    mockOnConnectionTest.mockClear();
    const newSettings = { ...initialSettings, password: "newpassword" };
    rerender({ settings: newSettings, onTest: mockOnConnectionTest });

    expect(result.current.connectionStatus).toBe("none");
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
    expect(mockOnConnectionTest).toHaveBeenCalledTimes(1);
  });

  it("should not call onConnectionTest on reset if it is undefined", () => {
    const { result, rerender } = renderHook(
      ({ settings }) => useConnectionTest(settings, undefined),
      { initialProps: { settings: initialSettings } }
    );

    mockOnConnectionTest.mockClear();

    const newSettings = { ...initialSettings, host: "newhost" };
    rerender({ settings: newSettings });

    expect(result.current.connectionStatus).toBe("none");
    expect(mockOnConnectionTest).not.toHaveBeenCalled();

    act(() => {
      result.current.resetStatus();
    });

    expect(result.current.connectionStatus).toBe("none");
    expect(mockOnConnectionTest).not.toHaveBeenCalled();
  });
});
