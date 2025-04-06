import React, { ReactNode } from 'react';
import { vi } from 'vitest';

// Создаем мок контекста локализации
export const mockLocalizationContext = {
  t: vi.fn().mockImplementation((key) => key), // Просто возвращает ключ как строку перевода
  currentLanguage: 'en',
  setLanguage: vi.fn().mockResolvedValue(undefined),
  availableLanguages: [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' }
  ],
  isLoading: false
};

// Мокируем хук useLocalization
export const mockUseLocalization = vi.fn().mockReturnValue(mockLocalizationContext);

// Мокируем компонент LocalizationProvider
export const MockLocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Мокируем весь модуль
vi.mock('../../contexts/LocalizationContext', () => ({
  useLocalization: mockUseLocalization,
  LocalizationProvider: MockLocalizationProvider
}));