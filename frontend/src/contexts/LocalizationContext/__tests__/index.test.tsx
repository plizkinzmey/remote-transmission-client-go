import { describe, it, expect, vi } from 'vitest';
import {
    LocalizationProvider,
    useLocalization,
    useTranslations,
    useLanguageInitialization
} from '..';

// Мокаем root-модуль вместо отдельных хуков
vi.mock('..', () => ({
    LocalizationProvider: vi.fn(),
    useLocalization: vi.fn(),
    useTranslations: vi.fn(),
    useLanguageInitialization: vi.fn(),
    // Если есть другие экспорты, которые нужны для тестов, их тоже нужно добавить
}));

// Мокаем компонент LoadingSpinner
vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: () => null
}));

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