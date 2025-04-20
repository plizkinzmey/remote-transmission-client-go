import { describe, it, expect, vi } from 'vitest';
import {
    LocalizationProvider,
    useLocalization,
    useTranslations,
    useLanguageInitialization
} from '..';

// Мокаем зависимости для хуков
vi.mock('../hooks/useTranslations', () => ({
    useTranslations: vi.fn(),
}));

vi.mock('../hooks/useLanguageInitialization', () => ({
    useLanguageInitialization: vi.fn(),
}));

// Мокаем компонент LoadingSpinner
// @ts-expect-error: TS не распознает перегрузку vi.mock с 3 аргументами, но Vitest работает
vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: () => null
}), { virtual: true });

describe('LocalizationContext exports', () => {
    it('should export LocalizationProvider', () => {
        expect(LocalizationProvider).toBeDefined();
        expect(typeof LocalizationProvider).toBe('function');
    });

    it('should export useLocalization hook', () => {
        expect(useLocalization).toBeDefined();
        expect(typeof useLocalization).toBe('function');
    });

    it('should export useTranslations hook', () => {
        expect(useTranslations).toBeDefined();
        expect(typeof useTranslations).toBe('function');
    });

    it('should export useLanguageInitialization hook', () => {
        expect(useLanguageInitialization).toBeDefined();
        expect(typeof useLanguageInitialization).toBe('function');
    });
});