import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTranslations } from './useTranslations';
import { GetAllTranslationKeys, GetTranslation } from '@wailsjs/go/main/App';

vi.mock('@wailsjs/go/main/App', () => ({
    GetAllTranslationKeys: vi.fn(),
    GetTranslation: vi.fn(),
}));

describe('useTranslations hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (GetAllTranslationKeys as any).mockResolvedValue(['a', 'b']);
        (GetTranslation as any).mockImplementation((key: string, lang: string) => Promise.resolve(`${key}-${lang}`));
    });

    it('loads all keys on init and returns t()', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => { });

        await waitFor(() => {
            expect(result.current.allTranslations.en).toEqual({ a: 'a-en', b: 'b-en' });
            expect(result.current.t('a')).toBe('a-en');
        });
    });

    it('t() with params string', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => { });

        expect(result.current.t('a', 'val')).toBe('a-en');
    });

    it('t() with params object', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => { });

        expect(result.current.t('b', { foo: 'bar' })).toBe('b-en');
    });

    it('loadAllTranslations can load additional languages', async () => {
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => {
            await result.current.loadAllTranslations(['fr']);
        });

        expect(GetAllTranslationKeys).toHaveBeenCalledWith('fr');
        expect(GetTranslation).toHaveBeenCalled();
    });

    it('handles loadAllTranslation error', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (GetAllTranslationKeys as any).mockRejectedValue(new Error('fail'));

        renderHook(() => useTranslations('en'));
        await act(async () => { });

        expect(spy).toHaveBeenCalledWith('Failed to load translations:', expect.any(Error));
        spy.mockRestore();
    });

    it('fetches missing key on t()', async () => {
        (GetAllTranslationKeys as any).mockResolvedValue([]);
        const { result } = renderHook(() => useTranslations('en'));

        await act(async () => { });

        // key not preloaded => returns key, then tries async fetch
        expect(result.current.t('x')).toBe('x');
        await act(async () => { /* let async fetch occur */ });

        expect(GetTranslation).toHaveBeenCalledWith('x', 'en', []);
    });

    it('logs and falls back when individual key fetch fails', async () => {
        (GetAllTranslationKeys as any).mockResolvedValue(['fail.key']);
        (GetTranslation as any).mockRejectedValueOnce(new Error('key fetch failed'));

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const { result } = renderHook(() => useTranslations('en'));
        await act(async () => { });

        // t должен вернуть ключ при ошибке и залогировать
        expect(result.current.t('fail.key')).toBe('fail.key');
        expect(errorSpy).toHaveBeenCalledWith(
            `Failed to load translation for key: fail.key (en)`,
            expect.any(Error)
        );

        errorSpy.mockRestore();
    });

    it('t returns empty on empty key', async () => {
        (GetAllTranslationKeys as any).mockResolvedValue(['a']);
        (GetTranslation as any).mockResolvedValueOnce('a-en');

        const { result } = renderHook(() => useTranslations('en'));
        await act(async () => { });

        // На пустой ключ возвращаем ""
        expect(result.current.t('')).toBe('');
    });
});
