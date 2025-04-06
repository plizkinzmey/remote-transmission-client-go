import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Theme as RadixTheme } from "@radix-ui/themes";

export type ThemeType = "light" | "dark" | "auto";

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Отдельная функция для получения системной темы
const getSystemTheme = (): "light" | "dark" => {
  try {
    // Тщательная проверка доступности matchMedia
    if (typeof window === "undefined") return "light";
    if (!window.matchMedia) return "light";

    // Дополнительная проверка, что matchMedia действительно функция
    if (typeof window.matchMedia !== "function") return "light";

    // Безопасный вызов с отловом возможных ошибок
    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (
        mediaQuery &&
        typeof mediaQuery === "object" &&
        "matches" in mediaQuery
      ) {
        return mediaQuery.matches ? "dark" : "light";
      }
    } catch (innerError) {
      console.debug("Media query execution failed:", innerError);
    }

    return "light";
  } catch (error) {
    console.debug("Error getting system theme:", error);
    return "light"; // Возвращаем light как безопасное значение по умолчанию
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeState, setThemeState] = useState<ThemeType>(() => {
    // Предотвращаем ошибки в SSR или тестовом окружении
    if (typeof window === "undefined") return "auto";

    try {
      const savedTheme = localStorage.getItem("theme");
      return (savedTheme as ThemeType) || "auto";
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return "auto";
    }
  });

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", themeState);
      }
    } catch (e) {
      console.error("Error saving theme to localStorage:", e);
    }
  }, [themeState]);

  // Мемоизированная функция для установки темы
  const setTheme = useCallback((theme: ThemeType) => {
    setThemeState(theme);
  }, []);

  // Обработчик изменения системной темы
  const handleSystemThemeChange = useCallback(() => {
    // Если текущая тема "auto", форсируем обновление
    if (themeState === "auto") {
      setThemeState("auto");
    }
  }, [themeState]);

  // Подписка на изменения системной темы
  useEffect(() => {
    // Быстрый выход, если не нужно следить за системной темой или среда не браузерная
    if (
      themeState !== "auto" ||
      typeof window === "undefined" ||
      !window.matchMedia ||
      typeof window.matchMedia !== "function"
    ) {
      return () => {}; // Пустая функция очистки
    }

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      // Проверяем, что mediaQuery существует и является объектом
      if (!mediaQuery || typeof mediaQuery !== "object") {
        return () => {};
      }

      // Используем современный API, если он доступен
      if (
        "addEventListener" in mediaQuery &&
        typeof mediaQuery.addEventListener === "function"
      ) {
        mediaQuery.addEventListener("change", handleSystemThemeChange);
        return () => {
          mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
      }
      // Поддержка старых браузеров через устаревший API
      else if (
        "addListener" in mediaQuery &&
        typeof mediaQuery.addListener === "function"
      ) {
        mediaQuery.addListener(handleSystemThemeChange);
        return () => {
          mediaQuery.removeListener(handleSystemThemeChange);
        };
      }
    } catch (error) {
      console.debug("Error setting up theme change listener:", error);
    }

    // Пустой return в случае ошибок
    return () => {};
  }, [themeState, handleSystemThemeChange]);

  // Определяем текущую тему
  const currentTheme = themeState === "auto" ? getSystemTheme() : themeState;

  // Мемоизируем контекстное значение
  const contextValue = React.useMemo(
    () => ({ theme: themeState, setTheme }),
    [themeState, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <RadixTheme
        appearance={currentTheme === "light" ? "light" : "dark"}
        scaling="100%"
        data-theme={currentTheme}
      >
        {children}
      </RadixTheme>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
