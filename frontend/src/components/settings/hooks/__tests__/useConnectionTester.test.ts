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
  it("initializes with null error message", () => {
    const { result } = renderHook(() => useConnectionTester());
    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBeNull();
  });

  it("sets success message on successful test", () => {
    const { result } = renderHook(() => useConnectionTester());

    act(() => {
      result.current.handleConnectionTestResult(true);
    });

    expect(result.current.isConnectionValid).toBe(true);
    expect(result.current.connectionErrorMessage).toBe("Test Success Message");
  });

  it("sets provided error message on failed test", () => {
    const { result } = renderHook(() => useConnectionTester());
    const customError = "Custom error message";

    act(() => {
      result.current.handleConnectionTestResult(false, customError);
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBe(customError);
  });

  it("keeps error message null on failed test without message", () => {
    const { result } = renderHook(() => useConnectionTester());

    act(() => {
      result.current.handleConnectionTestResult(false);
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBeNull();
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() => useConnectionTester());

    act(() => {
      result.current.handleConnectionTestResult(true);
    });
    expect(result.current.isConnectionValid).toBe(true);
    expect(result.current.connectionErrorMessage).toBe("Test Success Message");

    act(() => {
      result.current.resetConnectionTest();
    });

    expect(result.current.isConnectionValid).toBe(false);
    expect(result.current.connectionErrorMessage).toBeNull();
  });
});
