import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ThemeProvider, useTheme, ThemeType } from "../index"; // Import from index

// Mock RadixTheme to prevent actual rendering and potential side effects
vi.mock("@radix-ui/themes", () => ({
    Theme: ({ children, appearance }: { children: React.ReactNode, appearance: string }) => (
        <div data-radix-theme-appearance={appearance}>{children}</div>
    ),
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true, configurable: true });

// Mock matchMedia
let mediaQueryListener: ((ev: MediaQueryListEvent) => any) | null = null;
const matchMediaMock = (matches: boolean) => ({
    matches: matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn((listener) => {
        mediaQueryListener = listener;
    }),
    removeListener: vi.fn((listener) => {
        if (mediaQueryListener === listener) {
            mediaQueryListener = null;
        }
    }),
    addEventListener: vi.fn((type, listener) => {
        if (type === 'change') {
            mediaQueryListener = listener as any;
        }
    }),
    removeEventListener: vi.fn((type, listener) => {
        if (type === 'change' && mediaQueryListener === listener) {
            mediaQueryListener = null;
        }
    }),
    dispatchEvent: vi.fn(),
});

// Helper to simulate system theme change
const simulateSystemThemeChange = (matches: boolean) => {
    act(() => {
        const currentMock = window.matchMedia("(prefers-color-scheme: dark)") as ReturnType<typeof matchMediaMock>;
        currentMock.matches = matches;
        if (mediaQueryListener) {
            mediaQueryListener({ matches: matches, media: "(prefers-color-scheme: dark)" } as MediaQueryListEvent);
        }
    });
};

// Helper component to test useTheme hook
const TestComponent = () => {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme("light")} data-testid="set-light">
                Set Light
            </button>
            <button onClick={() => setTheme("dark")} data-testid="set-dark">
                Set Dark
            </button>
            <button onClick={() => setTheme("auto")} data-testid="set-auto">
                Set Auto
            </button>
        </div>
    );
};

// Helper to get the applied theme from RadixTheme's data attribute or appearance prop
const getAppliedTheme = (container: HTMLElement): "light" | "dark" => {
    const radixThemeDiv = container.querySelector('[data-radix-theme-appearance]');
    if (radixThemeDiv) {
        return radixThemeDiv.getAttribute('data-radix-theme-appearance') as "light" | "dark";
    }
    const bodyRadixThemeDiv = document.body.querySelector('[data-radix-theme-appearance]');
    if (bodyRadixThemeDiv) {
        return bodyRadixThemeDiv.getAttribute('data-radix-theme-appearance') as "light" | "dark";
    }
    console.warn("Could not find RadixTheme mock div, falling back to state check for getAppliedTheme");
    const themeSpan = screen.queryByTestId("current-theme");
    const selectedTheme = themeSpan?.textContent as ThemeType | undefined;
    if (selectedTheme === 'auto' || !selectedTheme) {
        return (window.matchMedia("(prefers-color-scheme: dark)").matches) ? 'dark' : 'light';
    }
    return selectedTheme;
};

describe("ThemeContext", () => {
    beforeEach(() => {
        localStorageMock.clear();
        mediaQueryListener = null;
        window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));
        Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true, configurable: true });
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders children correctly", () => {
        render(
            <ThemeProvider>
                <div>Child Content</div>
            </ThemeProvider>
        );
        expect(screen.getByText("Child Content")).toBeInTheDocument();
    });

    it("initializes with 'auto' theme by default", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
        expect(localStorageMock.getItem).toHaveBeenCalledWith("theme");
    });

    it("initializes with theme from localStorage if available", () => {
        localStorageMock.setItem("theme", "dark");
        localStorageMock.getItem.mockClear();

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
        expect(localStorageMock.getItem).toHaveBeenCalledWith("theme");
    });

    it("initializes with 'auto' if localStorage value is invalid", () => {
        localStorageMock.setItem("theme", "invalid-theme");
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("allows setting and updating the theme", async () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        localStorageMock.setItem.mockClear();

        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        await waitFor(() => {
            expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
            expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
        });
        expect(localStorageMock.getItem("theme")).toBe("dark");
        localStorageMock.setItem.mockClear();

        act(() => {
            fireEvent.click(screen.getByTestId("set-light"));
        });
        await waitFor(() => {
            expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
            expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "light");
        });
        expect(localStorageMock.getItem("theme")).toBe("light");
        localStorageMock.setItem.mockClear();

        act(() => {
            fireEvent.click(screen.getByTestId("set-auto"));
        });
        await waitFor(() => {
            expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
            expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "auto");
        });
        expect(localStorageMock.getItem("theme")).toBe("auto");
    });

    describe("Auto Theme Mode", () => {
        it("applies light theme when system prefers light", () => {
            window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));
            const { container } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            act(() => {
                fireEvent.click(screen.getByTestId("set-auto"));
            });
            expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
            expect(getAppliedTheme(container)).toBe("light");
        });

        it("applies dark theme when system prefers dark", () => {
            window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(true));
            const { container } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            act(() => {
                fireEvent.click(screen.getByTestId("set-auto"));
            });
            expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
            expect(getAppliedTheme(container)).toBe("dark");
        });

        it("reacts to system theme changes when in 'auto' mode", async () => {
            window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));

            const { container } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            act(() => {
                fireEvent.click(screen.getByTestId("set-auto"));
            });
            await waitFor(() => {
                expect(getAppliedTheme(container)).toBe("light");
            });

            simulateSystemThemeChange(true);

            await waitFor(() => {
                const applied = container.querySelector('[data-radix-theme-appearance]')?.getAttribute('data-radix-theme-appearance');
                expect(applied).toBe('dark');
            });

            expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
        });

        it("does not react to system theme changes when not in 'auto' mode", async () => {
            window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));

            const { container } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            act(() => {
                fireEvent.click(screen.getByTestId("set-dark"));
            });
            await waitFor(() => {
                expect(getAppliedTheme(container)).toBe("dark");
            });

            simulateSystemThemeChange(false);

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(getAppliedTheme(container)).toBe("dark");
            expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
        });

        it("adds and removes matchMedia listener correctly", () => {
            const mediaQueryInstance = matchMediaMock(false);
            window.matchMedia = vi.fn().mockImplementation(() => mediaQueryInstance);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(mediaQueryInstance.addEventListener).toHaveBeenCalledTimes(1);
            expect(mediaQueryInstance.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
            expect(mediaQueryInstance.removeEventListener).not.toHaveBeenCalled();

            unmount();
            expect(mediaQueryInstance.removeEventListener).toHaveBeenCalledTimes(1);
            expect(mediaQueryInstance.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
        });
    });

    it("useTheme throws error when used outside ThemeProvider", () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const ErrorComponent = () => {
            let error = null;
            try {
                useTheme();
            } catch (e) {
                error = e;
            }
            return <div data-testid="error-message">{error instanceof Error ? error.message : "No error"}</div>;
        };
        render(<ErrorComponent />);
        expect(screen.getByTestId("error-message")).toHaveTextContent(
            "useTheme must be used within a ThemeProvider"
        );
        vi.restoreAllMocks();
    });

    it("handles localStorage access errors gracefully", () => {
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: () => { throw new Error("getItem failed"); },
                setItem: () => { throw new Error("setItem failed"); },
                clear: () => { },
                removeItem: () => { },
            },
            configurable: true,
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
        expect(console.error).toHaveBeenCalledWith("Error accessing localStorage:", expect.any(Error));

        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
        expect(console.error).toHaveBeenCalledWith("Error saving theme to localStorage:", expect.any(Error));
    });

    it("handles matchMedia errors gracefully", () => {
        const error = new Error("matchMedia failed");
        window.matchMedia = vi.fn().mockImplementation(() => {
            throw error;
        });

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
        expect(getAppliedTheme(document.body)).toBe("light");

        expect(console.error).toHaveBeenCalledWith("Media query execution failed:", error);
        expect(console.error).toHaveBeenCalledWith("Error setting up theme change listener:", error);
    });
});
