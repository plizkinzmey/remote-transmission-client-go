import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLanguageInitialization } from '../hooks/useLanguageInitialization';
import { LoadConfig, GetAvailableLanguages, GetSystemLanguage, GetTranslation, Initialize } from '@wailsjs/go/main/App';

vi.mock('@wailsjs/go/main/App', () => ({
    LoadConfig: vi.fn(),
    GetAvailableLanguages: vi.fn(),
    GetSystemLanguage: vi.fn(),
    GetTranslation: vi.fn(),
    Initialize: vi.fn(),
}));

describe('useLanguageInitialization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with English as fallback', async () => {
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No config'));
        (GetSystemLanguage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No system language'));

        const { result } = renderHook(() => useLanguageInitialization());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.currentLanguage).toBe('en');
        expect(result.current.isLoading).toBe(false);
    });

    it('should use saved language from config if available', async () => {
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'ru' });
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key: string, lang: string) => {
            const translations: Record<string, Record<string, string>> = {
                en: { 'language.en': 'English' },
                ru: { 'language.ru': 'Русский' }
            };
            return Promise.resolve(translations[lang][key]);
        });

        const { result } = renderHook(() => useLanguageInitialization());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.currentLanguage).toBe('ru');
        expect(result.current.isLoading).toBe(false);
    });

    it('should use system language if no config is available', async () => {
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('No config'));
        (GetSystemLanguage as ReturnType<typeof vi.fn>).mockResolvedValue('ru');

        const { result } = renderHook(() => useLanguageInitialization());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.currentLanguage).toBe('ru');
        expect(result.current.isLoading).toBe(false);
    });

    it('should load available languages', async () => {
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key: string, lang: string) => {
            const translations: Record<string, Record<string, string>> = {
                en: { 'language.en': 'English' },
                ru: { 'language.ru': 'Русский' }
            };
            return Promise.resolve(translations[lang][key]);
        });

        const { result } = renderHook(() => useLanguageInitialization());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.availableLanguages).toEqual([
            { code: 'en', name: 'English' },
            { code: 'ru', name: 'Русский' }
        ]);
    });

    it('should handle language change', async () => {
        (GetAvailableLanguages as ReturnType<typeof vi.fn>).mockResolvedValue(['en', 'ru']);
        (LoadConfig as ReturnType<typeof vi.fn>).mockResolvedValue({ language: 'en' });
        (Initialize as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        const { result } = renderHook(() => useLanguageInitialization());

        // Wait for initialization
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.setLanguage('ru');
        });

        expect(result.current.currentLanguage).toBe('ru');
        expect(Initialize).toHaveBeenCalledWith(JSON.stringify({ language: 'ru' }));
    });
});