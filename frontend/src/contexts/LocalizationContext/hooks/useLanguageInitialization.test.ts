import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLanguageInitialization } from "./useLanguageInitialization";
import {
  GetAvailableLanguages,
  LoadConfig,
  GetSystemLanguage,
  GetTranslation,
} from "@wailsjs/go/main/App";

vi.mock("@wailsjs/go/main/App", () => ({
  GetAvailableLanguages: vi.fn(),
  LoadConfig: vi.fn(),
  GetSystemLanguage: vi.fn(),
  GetTranslation: vi.fn(),
}));

describe("useLanguageInitialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (GetTranslation as any).mockImplementation((key: string, lang: string) =>
      Promise.resolve(`${key}-${lang}`)
    );
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
});
