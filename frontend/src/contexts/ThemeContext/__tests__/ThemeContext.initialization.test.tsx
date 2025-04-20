import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider, useTheme, ThemeType } from "../index";
import {
    localStorageMock,
    matchMediaMock, // Убедитесь, что все необходимые моки и хелперы импортируются
    TestComponent,
    setupTests
} from './ThemeContext.common'; // Используем .common без расширения

// Применяем общие настройки
setupTests();

describe("ThemeContext Initialization & Basic Functionality", () => {
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
});
