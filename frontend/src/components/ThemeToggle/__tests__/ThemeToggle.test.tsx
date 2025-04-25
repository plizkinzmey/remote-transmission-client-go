import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { TestThemeProvider } from '../../../test/mocks/theme-mock';
import { useTheme } from '../../../contexts/ThemeContext';

// Мокируем хук useLocalization
vi.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.themeLight': 'Светлая',
        'settings.themeDark': 'Темная',
        'settings.themeAuto': 'Авто',
      };
      return translations[key] || key;
    },
  }),
}));

// Мокируем Radix UI компоненты
vi.mock('@radix-ui/themes', () => ({
  IconButton: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  DropdownMenu: {
    Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
    Trigger: ({ children }: any) => (
      <div data-testid="dropdown-trigger">{children}</div>
    ),
    Content: ({ children }: any) => (
      <div data-testid="theme-toggle-menu">{children}</div>
    ),
    Item: ({ onClick, children, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

// Мокируем ThemeContext для тестов
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: 'auto',
    setTheme: vi.fn(),
  })),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображается корректно с темой по умолчанию', () => {
    render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle-button')).toBeInTheDocument();
  });

  it('отображает меню при клике', () => {
    const { container } = render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );

    fireEvent.click(screen.getByTestId('theme-toggle-button'));
    expect(screen.getByTestId('theme-toggle-menu')).toBeInTheDocument();
  });

  it('корректно переключает тему на светлую', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'auto',
      setTheme: mockSetTheme,
    });

    render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );

    fireEvent.click(screen.getByTestId('theme-toggle-button'));
    fireEvent.click(screen.getByTestId('theme-toggle-light'));

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  it('корректно переключает тему на темную', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'auto',
      setTheme: mockSetTheme,
    });

    render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );

    fireEvent.click(screen.getByTestId('theme-toggle-button'));
    fireEvent.click(screen.getByTestId('theme-toggle-dark'));

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });
  });

  it('корректно переключает тему на авто', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );

    fireEvent.click(screen.getByTestId('theme-toggle-button'));
    fireEvent.click(screen.getByTestId('theme-toggle-auto'));

    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('auto');
    });
  });

  it('отображает правильную иконку для каждой темы', () => {
    const mockSetTheme = vi.fn();

    // Тест светлой темы
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    const { rerender } = render(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );
    expect(screen.getByTestId('theme-icon-light')).toBeInTheDocument();

    // Тест темной темы
    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    rerender(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );
    expect(screen.getByTestId('theme-icon-dark')).toBeInTheDocument();

    // Тест авто темы
    vi.mocked(useTheme).mockReturnValue({
      theme: 'auto',
      setTheme: mockSetTheme,
    });

    rerender(
      <TestThemeProvider>
        <ThemeToggle />
      </TestThemeProvider>
    );
    expect(document.querySelector('svg')).toBeInTheDocument(); // AutoThemeIcon - встроенный SVG
  });
});