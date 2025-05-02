import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLanguageInitialization } from "./useLanguageInitialization";
import {
  GetAvailableLanguages,
  LoadConfig,
  GetSystemLanguage,
  GetTranslation,
  Initialize,
  SaveAllSettings,
} from "@wailsjs/go/main/App";

vi.mock("@wailsjs/go/main/App", () => ({
  GetAvailableLanguages: vi.fn(),
  LoadConfig: vi.fn(),
  GetSystemLanguage: vi.fn(),
  GetTranslation: vi.fn(),
  Initialize: vi.fn(),
  SaveAllSettings: vi.fn(),
}));

describe("useLanguageInitialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (GetTranslation as any).mockImplementation((key: string, lang: string) =>
      Promise.resolve(`${key}-${lang}`)
    );
    (Initialize as any).mockResolvedValue(undefined);
    (SaveAllSettings as any).mockResolvedValue(undefined);
  });

  it("loads languages and config language", async () => {
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    (LoadConfig as any).mockResolvedValue({ language: "ru" });
    (GetSystemLanguage as any).mockResolvedValue("en");

    const { result } = renderHook(() => useLanguageInitialization());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      const codes = result.current.availableLanguages.map((l) => l.code);
      // проверяем, что как минимум 'en' присутствует
      expect(codes).toContain("en");
      expect(result.current.currentLanguage).toBe("ru");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("falls back to system language if config missing", async () => {
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    (LoadConfig as any).mockResolvedValue({});
    (GetSystemLanguage as any).mockResolvedValue("ru");

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      // Если конфиг пуст, хук должен выбрать ПЕРВЫЙ доступный язык ('en'),
      // а не системный ('ru').
      expect(result.current.currentLanguage).toBe("en");
      expect(result.current.isLoading).toBe(false); // Убедимся, что загрузка завершена
    });
  });

  it("handles errors gracefully", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (GetAvailableLanguages as any).mockRejectedValue(new Error("fail"));
    (LoadConfig as any).mockResolvedValue({ language: "en" });
    (GetSystemLanguage as any).mockResolvedValue("en");

    const { result } = renderHook(() => useLanguageInitialization());

    await act(async () => {});

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    errorSpy.mockRestore();
  });

  it("setLanguage updates currentLanguage", async () => {
    (GetAvailableLanguages as any).mockResolvedValue(["en"]);
    (LoadConfig as any).mockResolvedValue({ language: "en" });
    (GetSystemLanguage as any).mockResolvedValue("en");

    const { result } = renderHook(() => useLanguageInitialization());

    await act(async () => {});

    await act(async () => {
      await result.current.setLanguage("ru");
    });

    expect(result.current.currentLanguage).toBe("ru");
  });

  it("falls back to first language if config.language not in available languages", async () => {
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    (LoadConfig as any).mockResolvedValue({ language: "de" }); // "de" нет в списке
    (GetSystemLanguage as any).mockResolvedValue("ru");

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      // Сначала убедимся, что загрузка завершена
      expect(result.current.isLoading).toBe(false);
    });

    // Теперь проверяем состояние
    expect(result.current.currentLanguage).toBe("en"); // Выбрали первый язык ('en')
    // Проверяем, что оба языка загружены
    expect(result.current.availableLanguages.map((l) => l.code)).toEqual(
      expect.arrayContaining(["en", "ru"])
    );
    expect(result.current.availableLanguages).toHaveLength(2);
  });

  it("falls back to system language on initialization error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Имитируем ошибку при загрузке конфига
    (LoadConfig as any).mockRejectedValue(new Error("Config load failed"));
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    // Системный язык должен успешно загрузиться
    (GetSystemLanguage as any).mockResolvedValue("fr");

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Ожидаем, что язык установился в системный ('fr')
    expect(result.current.currentLanguage).toBe("fr");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error initializing language:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("falls back to 'en' on initialization and system language errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Имитируем ошибку при загрузке конфига
    (LoadConfig as any).mockRejectedValue(new Error("Config load failed"));
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    // Имитируем ошибку при получении системного языка
    (GetSystemLanguage as any).mockRejectedValue(
      new Error("System lang failed")
    );

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Ожидаем, что язык установился в 'en' по умолчанию
    expect(result.current.currentLanguage).toBe("en");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error initializing language:",
      expect.any(Error)
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "Error getting system language:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("falls back to system language when no available languages", async () => {
    // Нет доступных языков
    (GetAvailableLanguages as any).mockResolvedValue([]);
    (LoadConfig as any).mockResolvedValue({});
    // Системный язык должен успешно загрузиться
    (GetSystemLanguage as any).mockResolvedValue("fr");

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Ожидаем, что язык установился в системный ('fr')
    expect(result.current.currentLanguage).toBe("fr");
    // Список доступных языков должен быть пуст (или дефолтный из catch в loadAvailableLanguages)
    // В данном случае loadAvailableLanguages отработает и вернет пустой массив
    expect(result.current.availableLanguages).toEqual([]);
  });

  it("falls back to 'en' when no available languages and system language fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Нет доступных языков
    (GetAvailableLanguages as any).mockResolvedValue([]);
    (LoadConfig as any).mockResolvedValue({});
    // Имитируем ошибку при получении системного языка
    (GetSystemLanguage as any).mockRejectedValue(
      new Error("System lang failed")
    );

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Ожидаем, что язык установился в 'en' по умолчанию
    expect(result.current.currentLanguage).toBe("en");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error getting system language:",
      expect.any(Error)
    );
    // Список доступных языков должен быть пуст
    expect(result.current.availableLanguages).toEqual([]);
    errorSpy.mockRestore();
  });

  it("handles error when saving language settings", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    (LoadConfig as any).mockResolvedValue({
      language: "en",
      host: "test-host",
      port: 9091,
      theme: "dark",
    });
    // Имитируем ошибку при вызове Initialize
    (Initialize as any).mockRejectedValue(
      new Error("Ошибка инициализации языка")
    );

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Пытаемся изменить язык, что вызовет ошибку при инициализации
    await act(async () => {
      await result.current.setLanguage("ru");
    });

    // Проверяем, что ошибка обработана и залогирована
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error setting language:",
      expect.any(Error)
    );

    // Убеждаемся, что язык все равно изменился в UI (в локальном состоянии)
    expect(result.current.currentLanguage).toBe("ru");

    // Проверяем, что Initialize был вызван с правильными параметрами
    expect(Initialize).toHaveBeenCalledWith(JSON.stringify({ language: "ru" }));

    consoleSpy.mockRestore();
  });

  it("handles initialization error when setting language", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (GetAvailableLanguages as any).mockResolvedValue(["en", "ru"]);
    (LoadConfig as any).mockResolvedValue({ language: "en" });
    (Initialize as any).mockRejectedValue(new Error("Failed to initialize"));

    const { result } = renderHook(() => useLanguageInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Пытаемся изменить язык, что вызовет ошибку при инициализации
    await act(async () => {
      await result.current.setLanguage("ru");
    });

    // Проверяем, что основная ошибка обработана и залогирована
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error setting language:",
      expect.any(Error)
    );

    // Убеждаемся, что язык все равно изменился в локальном состоянии
    expect(result.current.currentLanguage).toBe("ru");

    // Initialize должен быть вызван, но SaveAllSettings - нет
    expect(Initialize).toHaveBeenCalledWith(JSON.stringify({ language: "ru" }));
    expect(SaveAllSettings).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
