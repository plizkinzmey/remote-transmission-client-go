import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

// Обновляем тип темы, добавляя "auto" для динамической темы
type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark"; // Фактическая применяемая тема (без авто)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Получаем сохраненную тему из localStorage с деструктуризацией
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "light";
  });

  // Определяем предпочтения системы с деструктуризацией
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Следим за изменениями системных предпочтений
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Определяем актуальную тему на основе выбранной темы и системных предпочтений
  const actualTheme = useMemo<"light" | "dark">(() => {
    if (theme === "auto") {
      return systemPrefersDark ? "dark" : "light";
    }
    return theme === "dark" ? "dark" : "light";
  }, [theme, systemPrefersDark]);

  // Применяем тему к документу
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", actualTheme);
  }, [theme, actualTheme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme, actualTheme }),
    [theme, actualTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
