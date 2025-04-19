import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectionTester } from "../useConnectionTester";

// Мок для useLocalization
vi.mock("@contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => {
      // Теперь возвращаем сами сообщения вместо ключей
      const translations: { [key: string]: string } = {
        "settings.testSuccess": "Test Success Message",
        "settings.testFailed": "Default Test Failed Message",
      };
      return translations[key];
    },
    currentLanguage: "en",
    setLanguage: vi.fn(),
  }),
}));

describe("useConnectionTester Hook", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useConnectionTester());
    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBe("");
  });

  it("handles successful connection test result", () => {
    const { result } = renderHook(() => useConnectionTester());

    act(() => {
      result.current.handleConnectionTestResult(true);
    });

    expect(result.current.isConnectionValid).toBe(true);
    expect(result.current.connectionErrorMessage).toBe("Test Success Message");
  });

  it("handles failed connection test result with custom message", () => {
    const { result } = renderHook(() => useConnectionTester());
    const customError = "My custom error";

    act(() => {
      result.current.handleConnectionTestResult(false, customError);
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBe(customError);
  });

  it("handles failed connection test result without custom message (uses default)", () => {
    const { result } = renderHook(() => useConnectionTester());

    act(() => {
      result.current.handleConnectionTestResult(false);
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBe(
      "Default Test Failed Message"
    );
  });

  it("resets state correctly", () => {
    const { result } = renderHook(() => useConnectionTester());

    // Set some state
    act(() => {
      result.current.handleConnectionTestResult(true);
    });
    expect(result.current.isConnectionValid).toBe(true);
    expect(result.current.connectionErrorMessage).not.toBe("");

    // Reset state
    act(() => {
      result.current.resetConnectionTest();
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBe("");
  });
});
