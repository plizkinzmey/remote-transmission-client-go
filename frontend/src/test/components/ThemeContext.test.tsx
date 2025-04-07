import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

// Mock ThemeContext module
vi.mock("../../../src/contexts/ThemeContext", async () => {
  const actualModule = await vi.importActual<any>("../../../src/contexts/ThemeContext");
  
  // Moved the mock function inside to avoid the circular reference issue
  const mockGetSystemTheme = vi.fn().mockReturnValue("dark");
  
  return {
    ...actualModule,
    // Добавляем типизацию для children
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="theme-provider">{children}</div>
    ),
    getSystemTheme: mockGetSystemTheme,
    // Наш хук useTheme с правильной проверкой контекста
    useTheme: () => {
      const context = actualModule.ThemeContext ? React.useContext(actualModule.ThemeContext) : undefined;
      if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
      }
      return context;
    }
  };
});

// Import after mocking
import { ThemeProvider, useTheme } from "../../../src/contexts/ThemeContext";

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

// Отдельный компонент для теста на ошибку
const ErrorComponent = () => {
  useTheme();
  return <div>Should not render</div>;
};

// Мокируем объект localStorage
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
    // Directly mocking the implementation of getSystemTheme
    const contextModule = require("../../../src/contexts/ThemeContext");
    vi.spyOn(contextModule, "getSystemTheme").mockReturnValue("light");
    
    // Мокируем light mode
    window.matchMedia = vi.fn().mockImplementation((query) => {
      return {
        matches: query === "(prefers-color-scheme: dark)" ? false : false,
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
    
    // Создаем тестовую функцию, которая гарантированно выбросит ошибку
    function renderComponentWithoutProvider() {
      render(<ErrorComponent />);
    }
    
    // Проверяем, что функция выбрасывает ошибку с точным текстом
    expect(renderComponentWithoutProvider).toThrowError("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });
});
