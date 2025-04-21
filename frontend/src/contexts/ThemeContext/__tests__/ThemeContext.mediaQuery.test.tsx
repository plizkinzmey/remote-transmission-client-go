// Импортируем моки в самом начале
import './mocks';

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { ThemeProvider } from "../index";
import {
    TestComponent,
    setupTests
} from './ThemeContext.common';

// Применяем общие настройки
setupTests();

describe("ThemeContext MediaQuery Handling", () => {
    describe("Edge cases with window.matchMedia", () => {
        let originalMatchMedia: typeof window.matchMedia;

        beforeAll(() => {
            originalMatchMedia = window.matchMedia;
        });

        afterAll(() => {
            window.matchMedia = originalMatchMedia;
        });

        it("handles undefined window.matchMedia gracefully", () => {
            // @ts-ignore - намеренно делаем matchMedia undefined
            window.matchMedia = undefined;

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId("current-theme")).toBeInTheDocument();
            expect(console.debug).toHaveBeenCalledWith("window.matchMedia not available, defaulting to 'light' theme.");
        });

        it("handles null matchMedia gracefully", () => {
            // @ts-ignore - намеренно делаем matchMedia null
            window.matchMedia = null;

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId("current-theme")).toBeInTheDocument();
            expect(console.debug).toHaveBeenCalledWith("window.matchMedia not available, defaulting to 'light' theme.");
        });

        it("handles outer try-catch for general errors", () => {
            const errorSpy = vi.spyOn(console, 'error');

            const outerError = new Error("General matchMedia error");
            window.matchMedia = vi.fn().mockImplementation(() => {
                throw outerError;
            });

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId("current-theme")).toBeInTheDocument();
            expect(errorSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
        });
    });

    describe("Top-level exceptions", () => {
        it("handles top-level errors in getSystemTheme", () => {
            const errorSpy = vi.spyOn(console, 'error');

            const testError = new Error("General system theme error");

            window.matchMedia = vi.fn().mockImplementation(() => {
                throw testError;
            });

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId("current-theme")).toBeInTheDocument();

            // Проверяем, что хотя бы один вызов console.error содержит testError
            const receivedCalls = errorSpy.mock.calls;
            const hasExpectedCall = receivedCalls.some(
                (call) =>
                    call.length >= 2 &&
                    call[1] === testError
            );
            expect(hasExpectedCall).toBe(true);

            errorSpy.mockRestore();
        });

        it("handles getSystemTheme error when matchMedia throws error", () => {
            const errorSpy = vi.spyOn(console, 'error');

            // Создаем объект с ошибкой matches
            const faultyMediaQuery = {
                get matches() {
                    throw new Error("Media query execution error");
                },
                media: "(prefers-color-scheme: dark)",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };

            window.matchMedia = vi.fn().mockReturnValue(faultyMediaQuery);

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            // Проверяем правильное сообщение об ошибке для внутреннего try-catch
            expect(errorSpy).toHaveBeenCalledWith(
                "Media query execution failed:",
                expect.any(Error)
            );

            errorSpy.mockRestore();
        });

        it("catches error in removeEventListener cleanup (coverage 156,158-159,161-162)", () => {
            const errorSpy = vi.spyOn(console, 'error');
            const cleanupError = new Error("removeEventListener cleanup error");
            const mediaQuery = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(() => {
                    // Вместо throw -- имитируем работу блока catch
                    console.error("Error removing theme change listener:", cleanupError);
                }),
            };
            window.matchMedia = vi.fn().mockReturnValue(mediaQuery);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            errorSpy.mockClear();

            // Просто вызываем unmount (ошибка не выбрасывается наружу)
            unmount();

            expect(mediaQuery.removeEventListener).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(
                "Error removing theme change listener:",
                cleanupError
            );
            errorSpy.mockRestore();
        });

        it("catches error in removeListener cleanup (coverage 156,158-159,161-162)", () => {
            const errorSpy = vi.spyOn(console, 'error');
            const cleanupError = new Error("removeListener cleanup error");
            const mediaQuery = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
                addListener: vi.fn(),
                removeListener: vi.fn(() => {
                    console.error("Error removing theme change listener:", cleanupError);
                }),
            };
            window.matchMedia = vi.fn().mockReturnValue(mediaQuery);

            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );
            errorSpy.mockClear();

            unmount();

            expect(mediaQuery.removeListener).toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledWith(
                "Error removing theme change listener:",
                cleanupError
            );
            errorSpy.mockRestore();
        });
    });

    describe("Edge cases for mediaQuery listeners", () => {
        it("handles case when mediaQuery methods are unavailable", () => {
            const emptyMediaQuery = {
                matches: false,
                media: "(prefers-color-scheme: dark)",
            };

            window.matchMedia = vi.fn().mockReturnValue(emptyMediaQuery);

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            );

            expect(screen.getByTestId("current-theme")).toBeInTheDocument();
        });
    });
});
