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
        (GetAllTranslationKeys as ReturnType<typeof vi.fn>).mockResolvedValue(['test.key', 'test.paramKey']);
        (GetTranslation as ReturnType<typeof vi.fn>).mockImplementation((key) => Promise.resolve(`Translated: ${key}`));
    });

    it('returns translation function', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        // Ждем загрузки переводов
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Проверяем базовый перевод
        expect(result.current.t('test.key')).toBe('test.key');
    });

    it('handles string parameters correctly', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Проверяем перевод с параметром-строкой
        expect(result.current.t('test.paramKey', 'value')).toBe('test.paramKey');
    });

    it('handles object parameters correctly', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Проверяем перевод с параметрами-объектом
        expect(result.current.t('test.key', { param: 'value' })).toBe('test.key');
    });

    it('loads translations on language change', async () => {
        const { result, rerender } = renderHook(
            (props) => useTranslations(props),
            { initialProps: 'en' }
        );

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Проверяем что переводы загружаются при смене языка
        rerender('ru');

        expect(GetTranslation).toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
        const consoleError = console.error;
        console.error = vi.fn();

        (GetAllTranslationKeys as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to load'));

        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Проверяем что при ошибке возвращается ключ
        expect(result.current.t('test.key')).toBe('test.key');
        expect(console.error).toHaveBeenCalled();

        console.error = consoleError;
    });
});