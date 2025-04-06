import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ThemeProvider,
  useTheme,
  ThemeType,
} from "../../../src/contexts/ThemeContext";
import React, { ReactNode } from "react";

// Тестовый компонент для проверки работы ThemeContext
const TestComponent = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button data-testid="set-light" onClick={() => setTheme("light")}>
        Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme("dark")}>
        Dark
      </button>
      <button data-testid="set-auto" onClick={() => setTheme("auto")}>
        Auto
      </button>
    </div>
  );
};

// Мокируем объект localStorage перед каждым тестом
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

describe("ThemeContext", () => {
  // Сохраняем оригинальный matchMedia
  const originalMatchMedia = window.matchMedia;

  // Перед каждым тестом настраиваем окружение
  beforeEach(() => {
    // Мокируем localStorage
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    localStorageMock.clear();

    // Мокируем window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(), // Для обратной совместимости
        removeListener: vi.fn(), // Для обратной совместимости
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
  });

  // После каждого теста восстанавливаем оригинальные объекты
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.clearAllMocks();
  });

  it("использует тему 'auto' по умолчанию", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("auto");
  });

  it("позволяет изменить тему на светлую", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setLightButton = screen.getByTestId("set-light");
    fireEvent.click(setLightButton);

    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("light");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
  });

  it("позволяет изменить тему на темную", () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = screen.getByTestId("set-dark");
    fireEvent.click(setDarkButton);

    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("dark");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("позволяет изменить тему на автоматическую", () => {
    // Сначала устанавливаем другую тему
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Изменяем на темную
    const setDarkButton = screen.getByTestId("set-dark");
    fireEvent.click(setDarkButton);

    // Затем на авто
    const setAutoButton = screen.getByTestId("set-auto");
    fireEvent.click(setAutoButton);

    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("auto");
    expect(localStorageMock.setItem).toHaveBeenLastCalledWith("theme", "auto");
  });

  it("загружает предпочитаемую тему из localStorage при монтировании", () => {
    // Устанавливаем значение в localStorage
    localStorageMock.getItem.mockReturnValueOnce("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("dark");
  });

  it("применяет системную тему dark когда установлено auto", () => {
    // Мокируем dark mode
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === "(prefers-color-scheme: dark)" ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    const { container } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Убедимся что авто режим отображается в контексте
    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("auto");

    // Проверяем что применяется правильная тема через атрибут data-theme
    const radixThemeElement = container.querySelector("[data-theme]");
    expect(radixThemeElement).not.toBeNull();
    expect(radixThemeElement).toHaveAttribute("data-theme", "dark");
  });

  it("применяет системную тему light когда установлено auto", () => {
    // Мокируем light mode
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === "(prefers-color-scheme: dark)" ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });

    const { container } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Убедимся что авто режим отображается в контексте
    const themeDisplay = screen.getByTestId("current-theme");
    expect(themeDisplay.textContent).toBe("auto");

    // Проверяем что применяется правильная тема через атрибут data-theme
    const radixThemeElement = container.querySelector("[data-theme]");
    expect(radixThemeElement).not.toBeNull();
    expect(radixThemeElement).toHaveAttribute("data-theme", "light");
  });

  it("выбрасывает ошибку если useTheme используется вне ThemeProvider", () => {
    // Подавляем ошибки консоли для этого теста
    const consoleSpy = vi.spyOn(console, "error");
    consoleSpy.mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });
});
