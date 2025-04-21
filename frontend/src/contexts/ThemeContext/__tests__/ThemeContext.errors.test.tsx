// Импортируем моки в самом начале
import './mocks'; // Импортируем моки первыми

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider, useTheme } from "../index";
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
        expect(console.error).toHaveBeenCalledWith("Error accessing localStorage:", getItemError);

        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
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
        expect(console.error).toHaveBeenCalledWith("Media query execution failed:", innerError);
    });
});
