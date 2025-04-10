import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageSelector } from '../LanguageSelector';

// Создаем мок-функцию для useLocalization
const mockSetLanguage = vi.fn().mockResolvedValue(undefined);
const mockUseLocalization = vi.fn(() => ({
  currentLanguage: 'en',
  availableLanguages: [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' }
  ],
  setLanguage: mockSetLanguage,
}));

// Мокаем контекст локализации
vi.mock('../../../contexts/LocalizationContext', () => ({
  useLocalization: () => mockUseLocalization()
}));

// Мокаем компоненты Radix UI
vi.mock('@radix-ui/themes', () => ({
  IconButton: ({ children, disabled, ...props }: any) => (
    <button 
      data-testid="language-selector-button" 
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  DropdownMenu: {
    Root: ({ children }: any) => <div data-testid="dropdown-menu-root">{children}</div>,
    Trigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
    Content: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
    Item: ({ children, disabled, onClick, ...props }: any) => (
      <div 
        data-testid="dropdown-menu-item" 
        onClick={disabled ? undefined : onClick}
        aria-disabled={disabled ? 'true' : undefined} 
        {...props}
      >
        {children}
      </div>
    )
  },
  Flex: ({ children, ...props }: any) => (
    <div data-testid="radix-flex" {...props}>{children}</div>
  ),
  Text: ({ children, ...props }: any) => (
    <span data-testid="radix-text" {...props}>{children}</span>
  )
}));

// Мок для CircleFlag
vi.mock('react-circle-flags', () => ({
  CircleFlag: ({ countryCode, ...props }: any) => (
    <div data-testid={`flag-${countryCode}`} {...props}>
      {countryCode}
    </div>
  )
}));

// Мок для LoadingSpinner
vi.mock('../../LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}));

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocalization.mockImplementation(() => ({
      currentLanguage: 'en',
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Русский' }
      ],
      setLanguage: mockSetLanguage,
    }));
  });

  it('отображает компонент с флагом текущего языка', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByTestId('language-selector-container')).toBeInTheDocument();
    expect(screen.getByTestId('language-selector-flag')).toBeInTheDocument();
  });

  it('отображает выпадающее меню при клике на кнопку', async () => {
    render(<LanguageSelector />);
    
    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);
    
    expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument();
    expect(screen.getByTestId('language-item-en')).toBeInTheDocument();
    expect(screen.getByTestId('language-item-ru')).toBeInTheDocument();
  });

  it('вызывает setLanguage при выборе языка', async () => {
    render(<LanguageSelector />);
    
    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);
    
    // Находим элемент русского языка и кликаем на него
    const russianItem = screen.getByTestId('language-item-ru');
    await waitFor(async () => {
      fireEvent.click(russianItem);
    });
    
    await waitFor(() => {
      expect(mockSetLanguage).toHaveBeenCalledWith('ru');
    });
  });

  it('отображает спиннер во время смены языка', async () => {
    let resolvePromise: (value: unknown) => void;
    const languageChangePromise = new Promise((resolve) => { resolvePromise = resolve; });
    mockSetLanguage.mockImplementation(() => languageChangePromise);
    
    render(<LanguageSelector />);
    
    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);
    
    // Находим элемент русского языка и кликаем на него
    const russianItem = screen.getByTestId('language-item-ru');
    
    await waitFor(async () => {
      fireEvent.click(russianItem);
      const spinner = await screen.findByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });
    
    // Завершаем асинхронную операцию
    await waitFor(async () => {
      resolvePromise!(undefined);
      await languageChangePromise;
    });
    
    // Проверяем, что спиннер больше не отображается
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.getByTestId('language-selector-flag')).toBeInTheDocument();
    });
  });

  it('не вызывает setLanguage при клике на текущий язык', async () => {
    render(<LanguageSelector />);
    
    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);
    
    // Находим элемент английского языка (текущий) и кликаем на него
    const englishItem = screen.getByTestId('language-item-en');
    
    // Проверяем, что элемент отключен (disabled)
    expect(englishItem.getAttribute('aria-disabled')).toBe('true');
    
    // Кликаем на него и проверяем, что setLanguage не вызвался
    await waitFor(async () => {
      fireEvent.click(englishItem);
    });
    
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });
});