import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Theme as RadixTheme } from "@radix-ui/themes";
import { LoadConfig, Initialize } from "../../wailsjs/go/main/App";

type ThemeType = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeState, setThemeState] = useState<ThemeType>("light");

  // Загрузка темы при монтировании
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig?.theme) {
          setThemeState(savedConfig.theme as ThemeType);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadTheme();
  }, []);

  // Обновление темы с сохранением в конфиг
  const setTheme = async (newTheme: ThemeType) => {
    try {
      const currentConfig = await LoadConfig();
      const updatedConfig = {
        ...currentConfig,
        theme: newTheme,
      };
      await Initialize(JSON.stringify(updatedConfig));
      setThemeState(newTheme);
    } catch (error) {
      console.error("Failed to save theme:", error);
      // Всё равно меняем тему локально, даже если сохранение не удалось
      setThemeState(newTheme);
    }
  };

  useEffect(() => {
    const htmlElement = document.documentElement;

    if (themeState === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      htmlElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      htmlElement.setAttribute("data-theme", themeState);
    }
  }, [themeState]);

  const contextValue = useMemo(
    () => ({ theme: themeState, setTheme }),
    [themeState]
  );

  const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const currentTheme = themeState === "auto" ? getSystemTheme() : themeState;

  return (
    <ThemeContext.Provider value={contextValue}>
      <RadixTheme appearance={currentTheme}>{children}</RadixTheme>
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
