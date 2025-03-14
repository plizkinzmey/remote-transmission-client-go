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

// Вспомогательная функция для определения системных предпочтений
function getSystemPreference(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Получаем сохраненную тему из localStorage с деструктуризацией
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "light";
  });

  // Используем деструктуризацию для системных предпочтений
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    getSystemPreference()
  );

  // Следим за изменениями системных предпочтений
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Определяем актуальную тему на основе выбранной темы и системных предпочтений
  const actualTheme = useMemo<"light" | "dark">(() => {
    if (currentTheme === "auto") {
      return systemPrefersDark ? "dark" : "light";
    }
    return currentTheme === "dark" ? "dark" : "light";
  }, [currentTheme, systemPrefersDark]);

  // Применяем тему к документу
  useEffect(() => {
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", actualTheme);
  }, [currentTheme, actualTheme]);

  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  const setTheme = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
  };

  const value = useMemo(
    () => ({
      theme: currentTheme,
      toggleTheme,
      setTheme,
      actualTheme,
    }),
    [currentTheme, actualTheme]
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
