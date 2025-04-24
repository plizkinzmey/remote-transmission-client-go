import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppErrorHandler } from "../useAppErrorHandler"; // Импорт из файла хука
import { useLocalization } from "@contexts/LocalizationContext";

// Мокируем зависимости
vi.mock("@contexts/LocalizationContext");

const mockT = vi.fn((key) => key); // Простой мок для t()

describe("useAppErrorHandler", () => {
  let mockSetConnectionError: ReturnType<typeof vi.fn>;
  let mockSetIsReconnectingState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Мокируем useLocalization перед каждым тестом
    vi.mocked(useLocalization).mockReturnValue({
      t: mockT,
      currentLanguage: "en", // Добавляем недостающее свойство
      availableLanguages: [], // Добавляем недостающее свойство
      setLanguage: vi.fn(), // Исправляем имя свойства с setLocale на setLanguage
      isLoading: false,
    });
    mockSetConnectionError = vi.fn();
    mockSetIsReconnectingState = vi.fn();
  });

  const renderTestHook = (errors: any) => {
    return renderHook(
      ({ errors }) =>
        useAppErrorHandler(errors, {
          setConnectionError: mockSetConnectionError,
          setIsReconnectingState: mockSetIsReconnectingState,
        }),
      { initialProps: { errors } }
    );
  };

  it("should return null when no errors are present", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: null,
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBeNull();
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("should prioritize connectionError", () => {
    const errors = {
      connectionError: "Connection Failed",
      configError: "Config Failed",
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Connection Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("should prioritize configError over torrentListError and sessionStatsError", () => {
    const errors = {
      connectionError: null,
      configError: "Config Failed",
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Config Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("should prioritize torrentListError over sessionStatsError and trigger reconnection", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("List Failed");
    expect(mockSetIsReconnectingState).toHaveBeenCalledWith(true);
    expect(mockSetConnectionError).toHaveBeenCalledWith(
      "errors.connectionFailed"
    ); // Проверяем вызов t()
    expect(mockT).toHaveBeenCalledWith("errors.connectionFailed");
  });

  it("should return sessionStatsError when it is the only error", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Stats Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("should update error when props change", () => {
    const initialErrors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: "Stats Failed",
    };
    const { result, rerender } = renderTestHook(initialErrors);
    expect(result.current).toBe("Stats Failed");

    const updatedErrors = {
      connectionError: "Connection Lost",
      configError: null,
      torrentListError: null,
      sessionStatsError: "Stats Failed", // Эта ошибка все еще есть, но connectionError имеет приоритет
    };
    rerender({ errors: updatedErrors });
    expect(result.current).toBe("Connection Lost");
  });

  it("should clear error when all errors are resolved", () => {
    const initialErrors = {
      connectionError: "Connection Failed",
      configError: null,
      torrentListError: null,
      sessionStatsError: null,
    };
    const { result, rerender } = renderTestHook(initialErrors);
    expect(result.current).toBe("Connection Failed");

    const updatedErrors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: null,
    };
    rerender({ errors: updatedErrors });
    expect(result.current).toBeNull();
  });
});
