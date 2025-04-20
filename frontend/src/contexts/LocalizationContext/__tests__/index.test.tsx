import { describe, it, expect } from 'vitest';
import { LocalizationProvider, useLocalization, useTranslations, useLanguageInitialization } from '..';

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