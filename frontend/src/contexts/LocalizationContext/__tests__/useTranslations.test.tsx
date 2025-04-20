import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTranslations } from '../hooks/useTranslations';
import { GetTranslation, GetAllTranslationKeys } from '@wailsjs/go/main/App';

vi.mock('@wailsjs/go/main/App', () => ({
    GetTranslation: vi.fn(),
    GetAllTranslationKeys: vi.fn(),
}));

describe('useTranslations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return translation function and initial empty cache', () => {
        const { result } = renderHook(() => useTranslations('en'));

        expect(result.current.t).toBeDefined();
        expect(result.current.allTranslations).toEqual({});
    });

    it('should fetch and cache translation when key is not found', async () => {
        (GetTranslation as ReturnType<typeof vi.fn>).mockResolvedValue('Hello');

        const { result } = renderHook(() => useTranslations('en'));

        let translation;
        await act(async () => {
            translation = result.current.t('greeting');
        });

        expect(translation).toBe('greeting'); // Initial return is key
        expect(GetTranslation).toHaveBeenCalledWith('greeting', 'en', []);

        // Wait for state update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Check that translation was cached
        expect(result.current.allTranslations).toEqual({
            en: {
                greeting: 'Hello'
            }
        });
    });

    it('should handle parameters in translations', async () => {
        (GetTranslation as ReturnType<typeof vi.fn>).mockResolvedValue('Hello, {0}!');

        const { result } = renderHook(() => useTranslations('en'));

        let translation;
        await act(async () => {
            translation = result.current.t('greeting.with.params', 'World');
        });

        expect(GetTranslation).toHaveBeenCalledWith('greeting.with.params', 'en', ['World']);
        expect(translation).toBe('greeting.with.params');

        // Wait for cache update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Check parameter substitution
        translation = result.current.t('greeting.with.params', 'World');
        expect(translation).toBe('Hello, World!');
    });

    it('should load all translations for multiple languages', async () => {
        (GetAllTranslationKeys as ReturnType<typeof vi.fn>).mockResolvedValue(['greeting', 'farewell']);
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key: string, lang: string) => {
            const translations: Record<string, Record<string, string>> = {
                en: {
                    greeting: 'Hello',
                    farewell: 'Goodbye'
                },
                ru: {
                    greeting: 'Привет',
                    farewell: 'До свидания'
                }
            };
            return Promise.resolve(translations[lang][key]);
        });

        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => {
            await result.current.loadAllTranslations(['en', 'ru']);
        });

        expect(result.current.allTranslations).toEqual({
            en: {
                greeting: 'Hello',
                farewell: 'Goodbye'
            },
            ru: {
                greeting: 'Привет',
                farewell: 'До свидания'
            }
        });
    });
});