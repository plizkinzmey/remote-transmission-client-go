import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Theme as RadixTheme } from "@radix-ui/themes";

type ThemeType = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeType;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const htmlElement = document.documentElement;

    if (theme === "auto") {
      htmlElement.removeAttribute("data-theme");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      htmlElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      htmlElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const contextValue = useMemo(() => ({ theme, setTheme }), [theme]);

  const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const currentTheme = theme === "auto" ? getSystemTheme() : theme;

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
