import React, { ReactNode, createContext, useContext, useState } from "react";
import { vi } from "vitest";
import { Theme } from "@radix-ui/themes";

// Создаем контекст для работы с темой в тестах
export const TestThemeContext = createContext({
  theme: "auto",
  setTheme: (theme: string) => {},
  systemTheme: "dark",
  getPreferredTheme: () => {
    return "dark" as string;
  },
});

// Экспортируем хук useTheme для использования в компонентах
export const useTheme = () => {
  const context = useContext(TestThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Создаем компонент ThemeProvider для тестов
export const ThemeProvider: React.FC<{ 
  children: ReactNode,
  initialTheme?: string 
}> = ({ 
  children,
  initialTheme = "auto"
}) => {
  const [theme, setTheme] = useState(initialTheme);
  const [systemTheme] = useState("dark");

  const contextValue = {
    theme,
    setTheme: (newTheme: string) => {
      setTheme(newTheme);
      window.localStorage.setItem("theme", newTheme);
    },
    systemTheme,
    getPreferredTheme: () => theme === "auto" ? systemTheme : theme,
  };

  return (
    <TestThemeContext.Provider value={contextValue}>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="mock-theme-provider" data-theme={theme === "auto" ? systemTheme : theme}>
        {children}
      </div>
    </TestThemeContext.Provider>
  );
};

// Создаем обертку для тестов с темой Radix UI
export const TestThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <Theme appearance="dark" accentColor="blue" radius="medium">
      {children}
    </Theme>
  );
};

// Мокируем контекст темы
vi.mock("../../contexts/ThemeContext", () => ({
  useTheme,
  ThemeProvider,
}));
