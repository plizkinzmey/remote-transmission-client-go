import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppErrorHandler } from "../useAppErrorHandler"; // Импорт из файла хука
import { useLocalization } from "@contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification";

// Мокируем зависимости
vi.mock("@contexts/LocalizationContext");
vi.mock("@/hooks/useNotification");

const mockT = vi.fn((key) => key); // Простой мок для t()
const mockShowError = vi.fn(); // Мок для showError

describe("useAppErrorHandler", () => {
  let mockSetConnectionError: ReturnType<typeof vi.fn>;
  let mockSetIsReconnectingState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Мокируем useLocalization перед каждым тестом
    vi.mocked(useLocalization).mockReturnValue({
      t: mockT,
      currentLanguage: "en",
      availableLanguages: [],
      setLanguage: vi.fn(),
      isLoading: false,
    });
    // Мокируем useNotification
    vi.mocked(useNotification).mockReturnValue({
      showSuccess: vi.fn(),
      showError: mockShowError,
      showInfo: vi.fn(),
      showWarning: vi.fn(),
      showFormatted: vi.fn(),
      showDirect: vi.fn(), // Добавляем новый метод из обновленного API
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

  it("должен вернуть null при отсутствии ошибок и сбросить состояние переподключения", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: null,
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBeNull();
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    // Проверяем, что вызывается reset с false при отсутствии ошибок
    expect(mockSetIsReconnectingState).toHaveBeenCalledWith(false);
  });

  it("должен приоритезировать ошибку соединения", () => {
    const errors = {
      connectionError: "Connection Failed",
      configError: "Config Failed",
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Connection Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    // Не должен сбрасывать isReconnecting при наличии ошибки соединения
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("должен приоритезировать ошибку конфигурации над ошибками списка и статистики", () => {
    const errors = {
      connectionError: null,
      configError: "Config Failed",
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Config Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    // Не должен сбрасывать isReconnecting при наличии ошибки конфигурации
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("должен приоритезировать ошибку списка торрентов над ошибкой статистики", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: "List Failed",
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("List Failed");
    // В текущей реализации это закомментировано, поэтому не проверяем
    // expect(mockSetIsReconnectingState).toHaveBeenCalledWith(true);
    // expect(mockSetConnectionError).toHaveBeenCalledWith("errors.connectionFailed");
    expect(mockT).toHaveBeenCalledWith("List Failed");
    // Не должен сбрасывать isReconnecting при наличии ошибки списка торрентов
    expect(mockSetIsReconnectingState).not.toHaveBeenCalled();
  });

  it("должен вернуть ошибку статистики сессии, если это единственная ошибка, и сбросить состояние переподключения", () => {
    const errors = {
      connectionError: null,
      configError: null,
      torrentListError: null,
      sessionStatsError: "Stats Failed",
    };
    const { result } = renderTestHook(errors);
    expect(result.current).toBe("Stats Failed");
    expect(mockSetConnectionError).not.toHaveBeenCalled();
    // Проверяем, что вызывается reset с false при наличии только ошибки статистики
    expect(mockSetIsReconnectingState).toHaveBeenCalledWith(false);
  });

  it("должен обновлять ошибку при изменении входных параметров", () => {
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

  it("должен очищать ошибку, когда все ошибки устранены", () => {
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
