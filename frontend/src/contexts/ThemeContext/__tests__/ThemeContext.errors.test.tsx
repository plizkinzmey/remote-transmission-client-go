// Импортируем моки в самом начале
import './mocks'; // Импортируем моки первыми

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider, useTheme, getSystemTheme } from "../index";
import {
    localStorageMock,
    TestComponent,
    setupTests
} from './ThemeContext.common';

// Применяем общие настройки
setupTests();

describe("ThemeContext Error Handling", () => {
    it("useTheme throws error when used outside ThemeProvider", () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
        errorSpy.mockRestore();
    });

    it("handles localStorage access errors gracefully", () => {
        const getItemError = new Error("getItem failed");
        const setItemError = new Error("setItem failed");
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn(() => { throw getItemError; }),
                setItem: vi.fn(() => { throw setItemError; }),
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
        // Обновляем ожидаемое сообщение для ошибки чтения
        expect(console.error).toHaveBeenCalledWith("Error accessing localStorage during initial state calculation:", getItemError);

        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
        // Обновляем ожидаемое сообщение и ошибку для ошибки записи
        expect(console.error).toHaveBeenCalledWith("Error saving theme to localStorage:", setItemError);
    });

    it("handles matchMedia errors gracefully (when matchMedia itself throws)", () => {
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
        expect(console.error).toHaveBeenCalledWith(expect.any(String), error);
    });

    it("handles inner matchMedia execution errors gracefully (when .matches throws)", () => {
        const innerError = new Error("Inner matchMedia execution failed");
        const faultyMediaQuery = {
            get matches() { throw innerError; },
            media: "(prefers-color-scheme: dark)",
            addListener: vi.fn(), removeListener: vi.fn(),
            addEventListener: vi.fn(), removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        };
        window.matchMedia = vi.fn().mockReturnValue(faultyMediaQuery);

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
        expect(console.error).toHaveBeenCalledWith("Error accessing media query matches:", innerError);
    });

    it("handles undefined window gracefully", () => {
        const debugSpy = vi.spyOn(console, 'debug');
        const originalWindow = global.window;

        // Создаем расширенное минимальное окружение
        const mockWindow = {
            document: {
                createElement: () => ({
                    style: {},
                    classList: { add: vi.fn(), remove: vi.fn() }
                }),
                documentElement: {
                    style: {},
                    classList: { add: vi.fn(), remove: vi.fn() }
                }
            },
            HTMLIFrameElement: function () { },
            event: { type: null },  // Добавляем type для event
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
            getComputedStyle: () => ({
                getPropertyValue: () => ''
            })
        };

        // Переопределяем window
        Object.defineProperty(global, 'window', {
            value: mockWindow,
            writable: true,
            configurable: true
        });

        // Проверяем getSystemTheme напрямую
        expect(getSystemTheme()).toBe('light');

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(debugSpy).toHaveBeenCalledWith("window.matchMedia not available, defaulting to 'light' theme.");
        expect(screen.getByTestId("current-theme")).toBeInTheDocument();

        // Восстанавливаем window
        Object.defineProperty(global, 'window', {
            value: originalWindow,
            writable: true,
            configurable: true
        });

        debugSpy.mockRestore();
    });

    describe("getSystemTheme edge cases", () => {
        let originalWindow: Window;
        let debugSpy: any;
        let errorSpy: any;
        let warnSpy: any;

        beforeEach(() => {
            originalWindow = global.window;
            debugSpy = vi.spyOn(console, 'debug');
            errorSpy = vi.spyOn(console, 'error');
            warnSpy = vi.spyOn(console, 'warn');
        });

        afterEach(() => {
            Object.defineProperty(global, 'window', {
                value: originalWindow,
                writable: true,
                configurable: true
            });
            debugSpy.mockRestore();
            errorSpy.mockRestore();
            warnSpy.mockRestore();
        });

        it("handles completely undefined window", () => {
            Object.defineProperty(global, 'window', { value: undefined });
            expect(getSystemTheme()).toBe('light');
            expect(debugSpy).toHaveBeenCalledWith("Window is not available, defaulting to 'light' theme.");
        });

        it("handles null window", () => {
            Object.defineProperty(global, 'window', { value: null });
            expect(getSystemTheme()).toBe('light');
            expect(debugSpy).toHaveBeenCalledWith("Window is not available, defaulting to 'light' theme.");
        });

        it("handles window without matchMedia", () => {
            const mockWindow = {
                document: { createElement: vi.fn() },
            };
            Object.defineProperty(global, 'window', { value: mockWindow });
            expect(getSystemTheme()).toBe('light');
            expect(debugSpy).toHaveBeenCalledWith("window.matchMedia not available, defaulting to 'light' theme.");
        });

        it("handles matchMedia creation error", () => {
            const mockWindow = {
                matchMedia: vi.fn(() => { throw new Error('matchMedia creation failed'); }),
            };
            Object.defineProperty(global, 'window', { value: mockWindow });
            expect(getSystemTheme()).toBe('light');
            expect(errorSpy).toHaveBeenCalledWith("Error creating media query:", expect.any(Error));
        });

        it("handles invalid media query result", () => {
            const mockWindow = {
                matchMedia: vi.fn(() => ({ matches: undefined })),
            };
            Object.defineProperty(global, 'window', { value: mockWindow });
            expect(getSystemTheme()).toBe('light');
            expect(warnSpy).toHaveBeenCalledWith("Invalid media query result, defaulting to 'light'.");
        });

        it("handles error accessing matches property", () => {
            const mockWindow = {
                matchMedia: vi.fn(() => ({
                    get matches() { throw new Error('matches access failed'); }
                })),
            };
            Object.defineProperty(global, 'window', { value: mockWindow });
            expect(getSystemTheme()).toBe('light');
            expect(errorSpy).toHaveBeenCalledWith("Error accessing media query matches:", expect.any(Error));
        });
    });
});
