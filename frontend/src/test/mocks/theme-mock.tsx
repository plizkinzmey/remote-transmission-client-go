import React, { ReactNode } from 'react';
import { vi } from 'vitest';
import { Theme } from '@radix-ui/themes';

// Мокируем контекст темы
export const mockThemeContext = {
  theme: 'dark',
  setTheme: vi.fn(),
  systemTheme: 'dark',
  getPreferredTheme: vi.fn().mockReturnValue('dark'),
};

// Мокируем хук useThemeContext
export const mockUseThemeContext = vi.fn().mockReturnValue(mockThemeContext);

// Создаем обертку для тестов с темой Radix UI
export const TestThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Theme appearance="dark" accentColor="blue" radius="medium">
      {children}
    </Theme>
  );
};

// Мокируем контекст темы
vi.mock('../../contexts/ThemeContext', () => ({
  useThemeContext: mockUseThemeContext,
}));