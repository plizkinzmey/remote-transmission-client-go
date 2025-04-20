import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LocalizationProvider, useLocalization } from '../LocalizationContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GetAvailableLanguages, LoadConfig, GetTranslation, GetAllTranslationKeys, GetSystemLanguage } from '@wailsjs/go/main/App';

vi.mock('@wailsjs/go/main/App', () => ({
    GetAvailableLanguages: vi.fn(),
    LoadConfig: vi.fn(),
    GetTranslation: vi.fn(),
    GetAllTranslationKeys: vi.fn(),
    GetSystemLanguage: vi.fn(),
}));

// Мок для компонента LoadingSpinner
vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

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
        // Настраиваем базовые моки
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

        // Проверяем наличие спиннера сразу после рендера
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });
    });

    it('should provide translations through context', async () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Ждем загрузки переводов
        await waitFor(() => {
            expect(screen.getByTestId('translation')).toHaveTextContent('Translated: test.key');
        });
    });

    it('should update translations when language changes', async () => {
        const { rerender } = render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Меняем язык и проверяем обновление перевода
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key, lang) =>
            Promise.resolve(`${lang} translation: ${key}`));

        rerender(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('translation')).toHaveTextContent('en translation: test.key');
        });
    });

    it('should handle errors gracefully', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        (GetTranslation as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Translation failed'));

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Проверяем вызов console.error
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        // Проверяем, что при ошибке отображается ключ
        expect(screen.getByTestId('translation')).toHaveTextContent('test.key');
    });
});