import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { Theme as RadixTheme } from "@radix-ui/themes";
import { themeCleanup } from "./themeCleanup";
// import { LogDebug, LogError } from "../../../wailsjs/runtime";

/**
 * Represents the possible theme types.
 * 'auto' means the theme follows the system preference.
 */
export type ThemeType = "light" | "dark" | "auto";

/**
 * Defines the shape of the Theme context.
 */
export interface ThemeContextProps {
    /** The currently selected theme type ('light', 'dark', or 'auto'). */
    theme: ThemeType;
    /** Function to set a new theme type. */
    setTheme: (theme: ThemeType) => void;
}

/**
 * React context for managing the application theme.
 */
export const ThemeContext = createContext<ThemeContextProps | undefined>(
    undefined
);

/**
 * Gets the current system theme preference ('light' or 'dark').
 * Safely checks for `window.matchMedia` availability and handles potential errors.
 * Defaults to 'light' in case of errors or non-browser environments.
 * @returns {'light' | 'dark'} The detected system theme.
 */
export const getSystemTheme = (): "light" | "dark" => {
    // Проверяем наличие window
    if (typeof window === "undefined" || !window) {
        console.debug("Window is not available, defaulting to 'light' theme.");
        return "light";
    }

    // Проверяем наличие matchMedia
    if (typeof window.matchMedia !== "function") {
        console.debug("window.matchMedia not available, defaulting to 'light' theme.");
        return "light";
    }

    let mediaQuery: MediaQueryList;
    try {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    } catch (error) {
        console.error("Error creating media query:", error);
        return "light";
    }

    try {
        if (!mediaQuery || typeof mediaQuery.matches !== 'boolean') {
            console.warn("Invalid media query result, defaulting to 'light'.");
            return "light";
        }
        return mediaQuery.matches ? "dark" : "light";
    } catch (matchesError) {
        console.error("Error accessing media query matches:", matchesError);
        return "light";
    }
};

/**
 * Provides the theme state and management functions to its children.
 * Handles theme persistence in localStorage and system theme detection ('auto' mode).
 * Integrates with Radix UI's `<RadixTheme>` component.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [themeState, setThemeState] = useState<ThemeType>(() => {
        if (typeof window === "undefined") return "auto";

        try {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "auto") {
                return savedTheme;
            }
            return "auto";
        } catch (e) {
            console.error("Error accessing localStorage:", e);
            return "auto";
        }
    });

    // State to store the current actual system theme
    const [systemTheme, setSystemTheme] = useState(getSystemTheme);

    // Effect to save theme to localStorage when it changes.
    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                localStorage.setItem("theme", themeState);
                console.debug(`Theme saved to localStorage: ${themeState}`);
            }
        } catch (e) {
            console.error("Error saving theme to localStorage:", e);
        }
    }, [themeState]);

    /**
     * Memoized function to update the theme state.
     * @param {ThemeType} theme - The new theme to set.
     */
    const setTheme = useCallback((theme: ThemeType) => {
        setThemeState(theme);
    }, []);

    /**
     * Memoized handler for system theme changes.
     * Updates the system theme state based on the event's `matches` value.
     */
    const handleSystemThemeChange = useCallback((event: MediaQueryListEvent | { matches: boolean }) => {
        const prefersDark = event.matches;
        console.debug(`System theme change detected. Prefers dark: ${prefersDark}`);
        setSystemTheme(prefersDark ? "dark" : "light");
    }, []);

    // Effect to subscribe/unsubscribe to system theme changes when theme is 'auto'.
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return () => { };
        }

        let mediaQuery: MediaQueryList | null = null;
        try {
            mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener("change", handleSystemThemeChange);
                console.debug("Added system theme change listener (addEventListener).");
                return () => {
                    if (mediaQuery) {
                        themeCleanup(mediaQuery, handleSystemThemeChange);
                    }
                };
            } else if (mediaQuery.addListener) {
                mediaQuery.addListener(handleSystemThemeChange);
                console.debug("Added system theme change listener (addListener - deprecated).");
                return () => {
                    if (mediaQuery) {
                        themeCleanup(mediaQuery, handleSystemThemeChange);
                    }
                };
            }
        } catch (error) {
            console.error("Error setting up theme change listener:", error);
        }

        return () => {
            if (mediaQuery) {
                themeCleanup(mediaQuery, handleSystemThemeChange);
            }
        };
    }, [handleSystemThemeChange]);

    // Determine the actual theme ('light' or 'dark') to apply based on state and system preference.
    const currentTheme = useMemo(() => {
        return themeState === "auto" ? systemTheme : themeState;
    }, [themeState, systemTheme]);

    // Memoize the context value to prevent unnecessary re-renders of consumers.
    const contextValue = useMemo(
        () => ({ theme: themeState, setTheme }),
        [themeState, setTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <RadixTheme
                appearance={currentTheme}
                scaling="100%"
            >
                {children}
            </RadixTheme>
        </ThemeContext.Provider>
    );
};

/**
 * Custom hook to access the Theme context.
 * Throws an error if used outside of a ThemeProvider.
 * @returns {ThemeContextProps} The theme context value ({ theme, setTheme }).
 * @throws {Error} If the hook is used outside a ThemeProvider.
 */
export const useTheme = (): ThemeContextProps => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
