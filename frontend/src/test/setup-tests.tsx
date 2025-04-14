import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import React from 'react'; // <--- Добавьте этот импорт
import "./mocks/app-mocks";
import "./mocks/localization-context-mock";
import "./mocks/theme-mock";

// Очистка после каждого теста
afterEach(() => {
    cleanup();
});

// Мокируем window.matchMedia глобально для всех тестов
// Это улучшенная версия, которая обрабатывает все возможные сценарии
beforeAll(() => {
    // Убеждаемся, что window определен
    if (typeof window === "undefined") {
        Object.defineProperty(global, "window", {
            value: {},
            writable: true,
        });
    }

    // Мок для ResizeObserver (необходим для Radix UI)
    class ResizeObserverMock {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
    }
    window.ResizeObserver = ResizeObserverMock;

    // Определяем надежный мок для matchMedia
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query) => {
            // Определяем значение matches в зависимости от запроса
            // По умолчанию используем темную тему в тестах для большего покрытия
            const isDarkMode = query === "(prefers-color-scheme: dark)";

            return {
                matches: isDarkMode,
                media: query,
                onchange: null,
                addListener: vi.fn((callback) => {
                    if (callback) callback({ matches: isDarkMode, media: query });
                }),
                removeListener: vi.fn(),
                addEventListener: vi.fn((event, callback) => {
                    if (event === "change" && callback) {
                        callback({ matches: isDarkMode, media: query });
                    }
                }),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            };
        }),
    });

    // Мок для localStorage
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
            key: vi.fn((index: number) => {
                return Object.keys(store)[index] || null;
            }),
            length: 0,
        };
    })();

    Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
        configurable: true,
    });

    // Настройка RadixUI для тестов
    // Создаем заглушку для data-theme атрибута в document
    if (!document.documentElement.hasAttribute("data-radix-theme-direction")) {
        document.documentElement.setAttribute("data-radix-theme-direction", "ltr");
    }
});

// Мок для функций Wails runtime
const wailsMocks = {
    LogDebug: vi.fn(),
    LogInfo: vi.fn(),
    LogWarning: vi.fn(),
    LogError: vi.fn(),
    EventsOn: vi.fn(),
    EventsOff: vi.fn(),
    EventsOnce: vi.fn(),
    EventsEmit: vi.fn(),
};

// Создаем моки для Wails runtime API
vi.mock("../../wailsjs/runtime", () => ({
    LogDebug: wailsMocks.LogDebug,
    LogInfo: wailsMocks.LogInfo,
    LogWarning: wailsMocks.LogWarning,
    LogError: wailsMocks.LogError,
    EventsOn: wailsMocks.EventsOn,
    EventsOff: wailsMocks.EventsOff,
    EventsOnce: wailsMocks.EventsOnce,
    EventsEmit: wailsMocks.EventsEmit,
}));

// Мок для CSS модулей - важно использовать правильный путь и формат с default экспортом
vi.mock("../styles/StatusMessage.module.css", () => ({
    default: {
        statusContainer: "statusContainer-mock",
        messageContainer: "messageContainer-mock",
        animated: "animated-mock",
        success: "success-mock",
        error: "error-mock",
        info: "info-mock",
        expandableMessage: "expandableMessage-mock",
    },
}));

vi.mock("../styles/LoadingSpinner.module.css", () => ({
    default: {
        spinner: "spinner-mock",
        container: "container-mock",
        label: "label-mock",
    },
}));

// Мок для @radix-ui/react-checkbox
vi.mock('@radix-ui/react-checkbox', async () => {
    const actual = await vi.importActual('@radix-ui/react-checkbox');
    return {
        ...actual, // Сохраняем остальные экспорты (например, CheckboxIndicator)
        // Мокаем только Checkbox.Root
        Root: ({ checked, onCheckedChange, disabled, ...props }: any) => {
            // Определяем data-state на основе пропа checked
            let state = 'unchecked';
            if (checked === true) {
                state = 'checked';
            } else if (checked === 'indeterminate') { // <--- Обработка indeterminate
                state = 'indeterminate';
            }

            // Симулируем поведение кнопки, которую рендерит Radix
            return (
                <button
                    type="button"
                    role="checkbox"
                    aria-checked={state === 'indeterminate' ? 'mixed' : state === 'checked'}
                    data-state={state} // <--- Устанавливаем правильный data-state
                    disabled={disabled}
                    // Симулируем вызов onCheckedChange при клике
                    onClick={() => {
                        if (onCheckedChange && !disabled) {
                            let nextChecked: boolean | 'indeterminate' = false;
                            if (state === 'unchecked') nextChecked = true;
                            if (state === 'checked') nextChecked = false;
                            // Если indeterminate, клик обычно переводит в checked
                            if (state === 'indeterminate') nextChecked = true;
                            onCheckedChange(nextChecked);
                        }
                    }}
                    {...props} // Передаем остальные пропсы, включая data-testid
                />
            );
        },
    };
});