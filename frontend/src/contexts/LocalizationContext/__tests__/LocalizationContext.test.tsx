import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalizationProvider, useLocalization } from '..';
import { LoadConfig, GetAvailableLanguages, GetTranslation, GetAllTranslationKeys, GetSystemLanguage } from '@wailsjs/go/main/App';

// Мок LoadingSpinner
vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Моки для Wails API
vi.mock('@wailsjs/go/main/App', () => ({
    LoadConfig: vi.fn(),
    GetAvailableLanguages: vi.fn(),
    GetSystemLanguage: vi.fn(),
    GetTranslation: vi.fn(),
    GetAllTranslationKeys: vi.fn(),
}));

// Тестовый компонент
const TestComponent = () => {
    const { t, currentLanguage, availableLanguages } = useLocalization();
    return (
        <div data-testid="test-component">
            <div data-testid="translation">{t('test.key')}</div>
            <div data-testid="current-lang">{currentLanguage}</div>
            <div data-testid="available-langs">
                {availableLanguages.map(lang => lang.code).join(',')}
            </div>
        </div>
    );
};

describe('LocalizationProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Устанавливаем базовые моки
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'en' });
        (GetAllTranslationKeys as ReturnType<typeof vi.fn>).mockResolvedValue(['test.key']);
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key) =>
            Promise.resolve(`Translated: ${key}`));
        (GetSystemLanguage as ReturnType<typeof vi.fn>).mockResolvedValue('en');
    });

    it('should render loading state initially', async () => {
        // Делаем загрузку асинхронной
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockImplementation(() =>
            new Promise(resolve => setTimeout(() => resolve(['en', 'ru']), 100)));

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // LoadingSpinner должен отображаться сразу
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should provide translations through context', async () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Ждем загрузки переводов
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(await screen.findByTestId('translation')).toHaveTextContent('Translated: test.key');
        expect(await screen.findByTestId('current-lang')).toHaveTextContent('en');
        expect(await screen.findByTestId('available-langs')).toHaveTextContent('en,ru');
    });

    it('should update translations when language changes', async () => {
        const LanguageChanger = () => {
            const { setLanguage } = useLocalization();
            React.useEffect(() => {
                setLanguage('ru');
            }, [setLanguage]);
            return <TestComponent />;
        };

        render(
            <LocalizationProvider>
                <LanguageChanger />
            </LocalizationProvider>
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(await screen.findByTestId('current-lang')).toHaveTextContent('ru');
    });

    it('should handle errors gracefully', async () => {
        const consoleError = console.error;
        const mockError = new Error('Failed to load languages');
        console.error = vi.fn();

        // Имитируем ошибку загрузки языков
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockRejectedValueOnce(mockError);

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Проверяем вызов console.error
        expect(console.error).toHaveBeenCalled();
        // Проверяем fallback на английский язык
        expect(await screen.findByTestId('current-lang')).toHaveTextContent('en');

        // Восстанавливаем console.error
        console.error = consoleError;
    });
});