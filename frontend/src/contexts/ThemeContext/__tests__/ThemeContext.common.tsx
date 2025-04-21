// vi.mock должен быть в начале
vi.mock("@radix-ui/themes", () => ({
    // Упрощаем мок RadixTheme, просто добавляя атрибут на div
    Theme: ({ children, appearance }: { children: React.ReactNode, appearance: string }) => {
        console.log(`<<< Mock RadixTheme rendering with appearance: ${appearance} >>>`);
        return <div data-testid="radix-theme-root" data-appearance={appearance} className={`radix-themes ${appearance}`}>{children}</div>;
    },
}));

import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { ThemeProvider, useTheme, ThemeType } from "../index";
import '@testing-library/jest-dom/vitest';

// Mock localStorage - Исправлена структура IIFE и возвращаемого объекта
export const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string): string | null => store[key] || null),
        setItem: vi.fn((key: string, value: string): void => { store[key] = value.toString(); }),
        clear: vi.fn((): void => { store = {}; }),
        removeItem: vi.fn((key: string): void => { delete store[key]; }),
        // Добавляем недостающие свойства интерфейса Storage
        get length(): number { return Object.keys(store).length; },
        key: vi.fn((index: number): string | null => Object.keys(store)[index] || null),
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true, configurable: true });


// Mock matchMedia - Улучшим работу с addListener/removeListener
export let mediaQueryListener: ((ev: MediaQueryListEvent | { matches: boolean }) => any) | null = null;

// Определяем тип для функций слушателей, чтобы избежать повторений
type ListenerFunc = (listener: any) => void;
type EventListenerFunc = (type: string, listener: any) => void;

// Определяем тип для нашего мока, делая matches изменяемым
type MutableMediaQueryList = Omit<MediaQueryList, 'matches' | 'dispatchEvent'> & {
    matches: boolean;
    dispatchEvent: Mock;
};

// Улучшенный matchMediaMock
export const matchMediaMock = (
    matches: boolean,
    addEventListenerImpl: EventListenerFunc = vi.fn(),
    addListenerImpl: ListenerFunc = vi.fn(),
    removeEventListenerImpl: EventListenerFunc = vi.fn(),
    removeListenerImpl: ListenerFunc = vi.fn()
): MutableMediaQueryList => {
    // Создаем базовый объект с моками
    const mock: MutableMediaQueryList = {
        matches: matches,
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addListener: vi.fn(), // Сначала создаем простые моки, которые заменим ниже
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    };

    // Заменяем моки на версии с нужной реализацией
    mock.addListener = vi.fn((listener: any) => {
        console.log("Mock addListener called");
        mediaQueryListener = listener;
        // Вызываем переданную реализацию если она есть
        addListenerImpl(listener);
    });

    mock.removeListener = vi.fn((listener: any) => {
        console.log("Mock removeListener called");
        if (mediaQueryListener === listener) { mediaQueryListener = null; }
        removeListenerImpl(listener);
    });

    mock.addEventListener = vi.fn((type: string, listener: any) => {
        console.log(`Mock addEventListener called with type: ${type}`);
        if (type === "change") { mediaQueryListener = listener; }
        addEventListenerImpl(type, listener);
    });

    mock.removeEventListener = vi.fn((type: string, listener: any) => {
        console.log(`Mock removeEventListener called with type: ${type}`);
        if (type === "change" && mediaQueryListener === listener) { mediaQueryListener = null; }
        removeEventListenerImpl(type, listener);
    });

    return mock;
};

// Helper to simulate system theme change - остаётся прежним
export const simulateSystemThemeChange = (matches: boolean) => {
    act(() => {
        // Используем наш изменяемый тип при касте
        const currentMock = window.matchMedia("(prefers-color-scheme: dark)") as MutableMediaQueryList;
        // Теперь присваивание matches корректно с точки зрения типа
        currentMock.matches = matches;

        if (mediaQueryListener) {
            // Создаем объект, более похожий на MediaQueryListEvent
            const event = { matches: matches, media: "(prefers-color-scheme: dark)" } as MediaQueryListEvent;
            mediaQueryListener(event);
        }
    });
};

// Helper component - Убедимся, что он экспортируется
export const TestComponent: React.FC = () => {
    const { theme, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme("light")} data-testid="set-light">Set Light</button>
            <button onClick={() => setTheme("dark")} data-testid="set-dark">Set Dark</button>
            <button onClick={() => setTheme("auto")} data-testid="set-auto">Set Auto</button>
        </div>
    );
};

// Helper to get applied theme - Обновляем, чтобы искать реальный элемент в DOM
export const getAppliedTheme = (): "light" | "dark" | null => {
    // Ищем элемент с классом radix-themes
    const themeElement = document.querySelector('.radix-themes');
    if (themeElement) {
        if (themeElement.classList.contains('light')) return 'light';
        if (themeElement.classList.contains('dark')) return 'dark';
    }

    console.warn(`getAppliedTheme: Could not find valid theme element with class radix-themes. DOM: ${document.body.innerHTML}`);
    return null;
};

// Setup tests - Обновляем очистку
export const setupTests = () => {
    beforeEach(() => {
        localStorageMock.clear();
        mediaQueryListener = null;

        // Сохраняем оригинальный matchMedia
        const originalMatchMedia = window.matchMedia;

        // Создаем базовый мок
        const mockMatchMedia = vi.fn().mockImplementation(() => matchMediaMock(false));
        window.matchMedia = mockMatchMedia;

        Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
            writable: true,
            configurable: true
        });

        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'debug').mockImplementation(() => { });

        return () => {
            window.matchMedia = originalMatchMedia;
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Очищаем body
        document.body.innerHTML = '';
    });
};
