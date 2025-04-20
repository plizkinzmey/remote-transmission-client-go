import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalizationProvider, useLocalization } from '..';
import { LoadConfig, GetAvailableLanguages, GetTranslation, GetAllTranslationKeys } from '@wailsjs/go/main/App';

vi.mock('@wailsjs/go/main/App', () => ({
    LoadConfig: vi.fn(),
    GetAvailableLanguages: vi.fn(),
    GetSystemLanguage: vi.fn(),
    GetTranslation: vi.fn(),
    GetAllTranslationKeys: vi.fn(),
    Initialize: vi.fn(),
}));

// Test component that uses the context
const TestComponent = () => {
    const { t, currentLanguage, availableLanguages } = useLocalization();
    return (
        <div>
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
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'en' });
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key: string) =>
            Promise.resolve(`Translated: ${key}`));
        (GetAllTranslationKeys as ReturnType<typeof vi.fn>).mockResolvedValue(['test.key']);
    });

    it('should render loading state initially', async () => {
        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should provide translations through context', async () => {
        const { container } = render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByTestId('translation')).toHaveTextContent('Translated: test.key');
        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
        expect(screen.getByTestId('available-langs')).toHaveTextContent('en,ru');
    });

    it('should update translations when language changes', async () => {
        const { rerender } = render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const { setLanguage } = useLocalization();
        await act(async () => {
            await setLanguage('ru');
        });

        rerender(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        expect(screen.getByTestId('current-lang')).toHaveTextContent('ru');
    });

    it('should handle errors gracefully', async () => {
        const consoleError = console.error;
        console.error = vi.fn();

        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to load'));

        render(
            <LocalizationProvider>
                <TestComponent />
            </LocalizationProvider>
        );

        // Wait for error handling
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
        expect(console.error).toHaveBeenCalled();

        console.error = consoleError;
    });
});