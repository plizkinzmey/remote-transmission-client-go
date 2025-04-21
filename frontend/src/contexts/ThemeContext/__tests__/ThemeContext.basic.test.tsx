// Импортируем моки в самом начале
import './mocks';

import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "../index";
import {
    TestComponent,
    getAppliedTheme,
    setupTests
} from './ThemeContext.common';

// Применяем общие настройки
setupTests();

describe("ThemeContext Basic Functionality", () => {
    it("renders children correctly", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId("current-theme")).toBeInTheDocument();
    });

    it("default theme is 'auto'", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("allows changing theme to 'light'", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-light"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("light");
    });

    it("allows changing theme to 'dark'", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    });

    it("allows changing theme back to 'auto'", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");

        act(() => {
            fireEvent.click(screen.getByTestId("set-auto"));
        });
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("persists theme choice in localStorage", () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });

        expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    it("uses persisted theme from localStorage", () => {
        localStorage.getItem = vi.fn().mockReturnValue("dark");

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    });
});
