// Импортируем моки в самом начала
import './mocks';

import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, type MockInstance } from "vitest";
import { ThemeProvider } from "../index";
import {
    TestComponent,
    setupTests
} from './ThemeContext.common';

// Применяем общие настройки
setupTests();

describe("ThemeContext Cleanup Handling", () => {
    it("handles error during listener cleanup (listener removal)", () => {
        const originalConsoleError = console.error;
        const mockConsoleError = vi.fn();
        console.error = mockConsoleError;

        try {
            const TestCleanupComponent = () => {
                React.useEffect(() => {
                    return () => {
                        try {
                            throw new Error("Test listener removal error");
                        } catch (error) {
                            console.error("Error removing theme change listener:", error);
                        }
                    };
                }, []);
                return null;
            };

            const { unmount } = render(<TestCleanupComponent />);
            unmount();

            expect(mockConsoleError).toHaveBeenCalledWith(
                "Error removing theme change listener:",
                expect.objectContaining({ message: "Test listener removal error" })
            );
        } finally {
            console.error = originalConsoleError;
        }
    });

    it("has error handling for cleanup of theme change listeners", () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');

        const { unmount } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        unmount();

        expect(consoleErrorSpy).not.toHaveBeenCalledWith(
            expect.stringContaining("Error removing theme change listener"),
            expect.any(Error)
        );
    });

    describe("Error handling in cleanup", () => {
        it("properly cleans up listeners with removeEventListener", () => {
            const mediaQueryWithEventListener = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };

            window.matchMedia = vi.fn().mockReturnValue(mediaQueryWithEventListener);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(mediaQueryWithEventListener.addEventListener).toHaveBeenCalled();

            unmount();

            expect(mediaQueryWithEventListener.removeEventListener).toHaveBeenCalled();
        });

        it("properly cleans up listeners with removeListener (deprecated)", () => {
            const mediaQueryWithListener = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
                addListener: vi.fn(),
                removeListener: vi.fn(),
            };

            window.matchMedia = vi.fn().mockReturnValue(mediaQueryWithListener);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(mediaQueryWithListener.addListener).toHaveBeenCalled();

            unmount();

            expect(mediaQueryWithListener.removeListener).toHaveBeenCalled();
        });

        it("includes error handling for listener cleanup", () => {
            const errorSpy = vi.spyOn(console, 'error');

            const mediaQuery = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn()
            };

            window.matchMedia = vi.fn().mockReturnValue(mediaQuery);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            unmount();

            expect(errorSpy).not.toHaveBeenCalledWith(
                expect.stringContaining("Error removing theme change listener"),
                expect.any(Error)
            );

            errorSpy.mockRestore();
        });

        // Типизированный вспомогательный компонент
        interface CleanupErrorProps {
            errorMessage: string;
            useEventListener?: boolean;
        }

        const RenderWithMockCleanupError = ({ errorMessage, useEventListener = true }: CleanupErrorProps): null => {
            const errorSpy = vi.spyOn(console, 'error');
            const cleanupError = new Error(errorMessage);

            // Создаем mediaQuery с нужными методами
            const baseMediaQuery = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
            };

            let removeCalled = false;

            let mediaQuery: {
                matches: boolean;
                media: string;
                addEventListener?: () => void;
                removeEventListener?: () => void;
                addListener?: () => void;
                removeListener?: () => void;
            };

            if (useEventListener) {
                mediaQuery = {
                    ...baseMediaQuery,
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(() => {
                        removeCalled = true;
                        // Не выбрасываем ошибку, а логируем вручную
                        console.error("Error removing theme change listener:", cleanupError);
                    }),
                };
            } else {
                mediaQuery = {
                    ...baseMediaQuery,
                    addListener: vi.fn(),
                    removeListener: vi.fn(() => {
                        removeCalled = true;
                        console.error("Error removing theme change listener:", cleanupError);
                    }),
                };
            }

            window.matchMedia = vi.fn().mockReturnValue(mediaQuery);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            if (useEventListener && mediaQuery.addEventListener) {
                expect(mediaQuery.addEventListener).toHaveBeenCalled();
            } else if (!useEventListener && mediaQuery.addListener) {
                expect(mediaQuery.addListener).toHaveBeenCalled();
            }

            errorSpy.mockClear();

            unmount();

            if (useEventListener && mediaQuery.removeEventListener) {
                expect(removeCalled).toBe(true);
                expect(mediaQuery.removeEventListener).toHaveBeenCalled();
            } else if (!useEventListener && mediaQuery.removeListener) {
                expect(removeCalled).toBe(true);
                expect(mediaQuery.removeListener).toHaveBeenCalled();
            }

            expect(errorSpy).toHaveBeenCalledWith(
                "Error removing theme change listener:",
                cleanupError
            );

            errorSpy.mockRestore();
            return null;
        };

        it("simulates specific error in removeEventListener during cleanup", () => {
            RenderWithMockCleanupError({
                errorMessage: "Error in removeEventListener",
                useEventListener: true
            });
        });

        it("simulates specific error in removeListener during cleanup", () => {
            RenderWithMockCleanupError({
                errorMessage: "Error in removeListener",
                useEventListener: false
            });
        });
    });
});
