// Импортируем моки в самом начале
import './mocks'; // Импортируем моки первыми

import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "../index";
import {
    matchMediaMock,
    simulateSystemThemeChange,
    TestComponent,
    getAppliedTheme,
    setupTests,
} from './ThemeContext.common';

// Применяем общие настройки
setupTests();

describe("ThemeContext Auto Theme Mode & Listeners", () => {
    it("applies light theme when system prefers light", async () => {
        window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-auto"));
        });

        // Проверяем наличие элемента с правильным классом
        await waitFor(() => {
            const themeElement = document.querySelector('.radix-themes.light');
            expect(themeElement).not.toBeNull();
        });

        expect(getAppliedTheme()).toBe("light");
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("applies dark theme when system prefers dark", async () => {
        window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(true));
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-auto"));
        });

        // Проверяем наличие элемента с правильным классом
        await waitFor(() => {
            const themeElement = document.querySelector('.radix-themes.dark');
            expect(themeElement).not.toBeNull();
        });

        expect(getAppliedTheme()).toBe("dark");
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("reacts to system theme changes when in 'auto' mode", async () => {
        window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-auto"));
        });

        // Проверяем начальную тему
        await waitFor(() => {
            const themeElement = document.querySelector('.radix-themes.light');
            expect(themeElement).not.toBeNull();
        });
        expect(getAppliedTheme()).toBe("light");

        simulateSystemThemeChange(true);

        // Проверяем изменение темы
        await waitFor(() => {
            const themeElement = document.querySelector('.radix-themes.dark');
            expect(themeElement).not.toBeNull();
        });
        expect(getAppliedTheme()).toBe("dark");
        expect(screen.getByTestId("current-theme")).toHaveTextContent("auto");
    });

    it("does not react to system theme changes when not in 'auto' mode", async () => {
        window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
        act(() => {
            fireEvent.click(screen.getByTestId("set-dark"));
        });

        // Проверяем начальную тему
        await waitFor(() => {
            const themeElement = document.querySelector('.radix-themes.dark');
            expect(themeElement).not.toBeNull();
        });
        expect(getAppliedTheme()).toBe("dark");

        simulateSystemThemeChange(false);

        await new Promise(resolve => setTimeout(resolve, 50)); // Даем время на (не)реакцию

        // Проверяем, что тема не изменилась
        const themeElement = document.querySelector('.radix-themes.dark');
        expect(themeElement).not.toBeNull();
        expect(getAppliedTheme()).toBe("dark");
        expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    });

    it("adds and removes matchMedia listener correctly (addEventListener)", async () => {
        let storedListener: any = null;
        const addEventListenerMock = vi.fn((type, listener) => {
            if (type === 'change') { storedListener = listener; }
        });
        const removeEventListenerMock = vi.fn();
        // Используем matchMediaMock для создания экземпляра
        const mediaQueryInstance = matchMediaMock(false, addEventListenerMock, undefined, removeEventListenerMock, undefined);
        window.matchMedia = vi.fn().mockReturnValue(mediaQueryInstance);

        const { unmount } = render(<ThemeProvider><TestComponent /></ThemeProvider>);

        await waitFor(() => {
            expect(addEventListenerMock).toHaveBeenCalledTimes(1);
            expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
        });
        expect(removeEventListenerMock).not.toHaveBeenCalled();

        unmount();

        await waitFor(() => {
            expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
            expect(removeEventListenerMock).toHaveBeenCalledWith('change', storedListener);
        });
    });

    it("uses addListener/removeListener fallback when addEventListener is unavailable", async () => {
        // Создаем моки с явной реализацией
        let storedListener: any = null;
        const addListenerMock = vi.fn((listener: any) => {
            console.log("Test addListenerMock called");
            storedListener = listener;
        });
        const removeListenerMock = vi.fn();

        // Создаем mediaQueryInstance, явно указывая, что addEventListener НЕ доступен
        const mediaQueryInstance = {
            matches: false,
            media: "(prefers-color-scheme: dark)",
            // Отсутствие addEventListener/removeEventListener принудит код использовать fallback
            addListener: addListenerMock,
            removeListener: removeListenerMock,
            dispatchEvent: vi.fn(),
        };

        // Мокируем matchMedia напрямую
        window.matchMedia = vi.fn().mockReturnValue(mediaQueryInstance);

        const { unmount } = render(<ThemeProvider><TestComponent /></ThemeProvider>);

        // Проверяем, что addListener был вызван
        await waitFor(() => {
            expect(addListenerMock).toHaveBeenCalledTimes(1);
        });

        expect(addListenerMock).toHaveBeenCalledWith(expect.any(Function));
        expect(console.debug).toHaveBeenCalledWith("Added system theme change listener (addListener - deprecated).");
        expect(removeListenerMock).not.toHaveBeenCalled();

        // После размонтирования проверяем вызов removeListener
        unmount();

        await waitFor(() => {
            expect(removeListenerMock).toHaveBeenCalledTimes(1);
        });

        expect(removeListenerMock).toHaveBeenCalledWith(storedListener);
        expect(console.debug).toHaveBeenCalledWith("Removed system theme change listener (removeListener - deprecated).");
    });
});
