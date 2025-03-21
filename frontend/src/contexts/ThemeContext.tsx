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
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeState, setThemeState] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as ThemeType) || "auto";
  });

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("theme", themeState);
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
    if (themeState === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      };
    }
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
