import React from 'react';
// Импортируем renderHook
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { LocalizationProvider, useLocalization, LocalizationContext } from '../LocalizationContext';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { GetAvailableLanguages, LoadConfig, GetTranslation, GetAllTranslationKeys, GetSystemLanguage } from '@wailsjs/go/main/App';
import * as LanguageInitializationHook from '../hooks/useLanguageInitialization';
import * as TranslationsHook from '../hooks/useTranslations';
import type { UseTranslationsResult } from '../hooks/useTranslations';

vi.mock('@wailsjs/go/main/App', () => ({
    GetAvailableLanguages: vi.fn(),
    LoadConfig: vi.fn(),
    GetTranslation: vi.fn(),
    GetAllTranslationKeys: vi.fn(),
    GetSystemLanguage: vi.fn(),
}));

vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../hooks/useLanguageInitialization');
vi.mock('../hooks/useTranslations');

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

const OutsideProviderComponent = () => {
    useLocalization();
    return <div>Should not render</div>;
};

describe('LocalizationProvider', () => {
    let mockUseLanguageInitialization: any;
    let mockUseTranslations: any;
    let mockLoadAllTranslations: Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseLanguageInitialization = vi.spyOn(LanguageInitializationHook, 'useLanguageInitialization').mockReturnValue({
            currentLanguage: 'en',
            availableLanguages: [{ code: 'en', name: 'English' }, { code: 'ru', name: 'Russian' }],
            setLanguage: vi.fn().mockResolvedValue(undefined),
            isLoading: false,
        });

        mockLoadAllTranslations = vi.fn().mockResolvedValue(undefined);
        mockUseTranslations = vi.spyOn(TranslationsHook, 'useTranslations').mockReturnValue({
            t: (key: string) => `Translated: ${key}`,
            allTranslations: { en: { 'test.key': 'Translated: test.key' } },
            loadAllTranslations: mockLoadAllTranslations,
        });

        (GetAvailableLanguages as Mock).mockResolvedValue(['en', 'ru']);
        (LoadConfig as Mock).mockResolvedValue({ language: 'en' });
        (GetAllTranslationKeys as Mock).mockResolvedValue(['test.key']);
        (GetTranslation as Mock).mockImplementation((key) => Promise.resolve(`Translated: ${key}`));
        (GetSystemLanguage as Mock).mockResolvedValue('en');
    });

    it('should render loading state initially', async () => {
        // --- Начальное состояние: Загрузка ---
        mockUseLanguageInitialization.mockReturnValue({
            currentLanguage: 'en',
            availableLanguages: [{ code: 'en', name: 'English' }],
            setLanguage: vi.fn().mockResolvedValue(undefined),
            isLoading: true, // Загрузка языка
        });
        mockUseTranslations.mockReturnValue({
            t: (key: string) => key,
            allTranslations: {}, // Переводы еще не загружены
            loadAllTranslations: mockLoadAllTranslations,
        });

        // Рендерим компонент и получаем функцию rerender
        const { rerender } = render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Проверяем наличие спиннера
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

        // --- Конечное состояние: Загрузка завершена ---
        mockUseLanguageInitialization.mockReturnValue({
            currentLanguage: 'en',
            availableLanguages: [{ code: 'en', name: 'English' }, { code: 'ru', name: 'Russian' }],
            setLanguage: vi.fn().mockResolvedValue(undefined),
            isLoading: false, // Загрузка языка завершена
        });
        mockUseTranslations.mockReturnValue({
            t: (key: string) => `Translated: ${key}`,
            allTranslations: { en: { 'test.key': 'Translated: test.key' } }, // Переводы загружены
            loadAllTranslations: mockLoadAllTranslations,
        });

        // Вызываем rerender, чтобы применить новые значения моков
        rerender(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Ждем исчезновения спиннера
        await waitFor(() => {
            expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });

        // Дополнительная проверка: убедимся, что контент отобразился
        expect(screen.getByTestId('translation')).toHaveTextContent('Translated: test.key');
    });

    it('should provide translations through context', async () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('translation')).toHaveTextContent('Translated: test.key');
        });
    });

    it('should update translations when language changes', async () => {
        const setLanguageMock = vi.fn().mockResolvedValue(undefined);
        mockUseLanguageInitialization.mockReturnValue({
            currentLanguage: 'en',
            availableLanguages: [{ code: 'en', name: 'English' }, { code: 'ru', name: 'Russian' }],
            setLanguage: setLanguageMock,
            isLoading: false,
        });
        mockUseTranslations.mockReturnValue({
            t: (key: string) => `en translation: ${key}`,
            allTranslations: { en: { 'test.key': 'en translation: test.key' } },
            loadAllTranslations: mockLoadAllTranslations,
        });

        const { rerender } = render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        expect(screen.getByTestId('translation')).toHaveTextContent('en translation: test.key');
        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');

        mockUseLanguageInitialization.mockReturnValue({
            currentLanguage: 'ru',
            availableLanguages: [{ code: 'en', name: 'English' }, { code: 'ru', name: 'Russian' }],
            setLanguage: setLanguageMock,
            isLoading: false,
        });
        mockUseTranslations.mockReturnValue({
            t: (key: string) => `ru translation: ${key}`,
            allTranslations: {
                en: { 'test.key': 'en translation: test.key' },
                ru: { 'test.key': 'ru translation: test.key' }
            },
            loadAllTranslations: mockLoadAllTranslations,
        });

        rerender(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('current-lang')).toHaveTextContent('ru');
            expect(screen.getByTestId('translation')).toHaveTextContent('ru translation: test.key');
        });
    });

    it('should handle errors gracefully (GetTranslation fails)', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        mockUseTranslations.mockReturnValue({
            t: (key: string) => {
                Promise.reject(new Error('Translation failed')).catch(err => console.error("GetTranslation failed in test", err));
                return key;
            },
            allTranslations: { en: {} },
            loadAllTranslations: mockLoadAllTranslations,
        });

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith("GetTranslation failed in test", expect.any(Error));
        });

        expect(screen.getByTestId('translation')).toHaveTextContent('test.key');
        consoleErrorSpy.mockRestore();
    });

    it('should throw an error when used outside LocalizationProvider', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        // Используем renderHook для тестирования хука
        expect(() => {
            renderHook(() => useLocalization(), {
                // Не предоставляем wrapper, чтобы контекст был undefined
                wrapper: ({ children }) => <>{children}</>
            });
        }).toThrow('useLocalization must be used within LocalizationProvider');

        consoleErrorSpy.mockRestore();
    });

    it('should handle loadAllTranslations errors', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        mockLoadAllTranslations.mockRejectedValue(new Error('Failed to load all translations'));

        mockUseTranslations.mockReturnValue({
            t: (key: string) => `Translated: ${key}`,
            allTranslations: { en: { 'test.key': 'Translated: test.key' } },
            loadAllTranslations: mockLoadAllTranslations,
        });

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load translations:', expect.any(Error));
        });

        const errorCall = consoleErrorSpy.mock.calls.find(call => call[0] === 'Failed to load translations:');
        expect(errorCall?.[1].message).toBe('Failed to load all translations');

        consoleErrorSpy.mockRestore();
    });
});