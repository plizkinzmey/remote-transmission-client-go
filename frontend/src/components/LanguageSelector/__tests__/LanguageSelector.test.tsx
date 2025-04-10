import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

    const container = screen.getByTestId('language-selector-container');
    const flag = within(container).getByTestId('language-selector-flag');
    expect(flag).toBeInTheDocument();

    // Проверяем, что внутри флага содержится правильная иконка
    const flagIcon = within(flag).getByTestId('flag-gb');
    expect(flagIcon).toBeInTheDocument();
  });

  it('отображает выпадающее меню при клике на кнопку', async () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);

    const content = screen.getByTestId('dropdown-menu-content');
    expect(content).toBeInTheDocument();

    // Проверяем наличие элементов меню по их конкретным test-id
    expect(screen.getByTestId('language-item-en')).toBeInTheDocument();
    expect(screen.getByTestId('language-item-ru')).toBeInTheDocument();
  });

  it('вызывает setLanguage при выборе языка', async () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);

    // Находим элемент русского языка по его специфичному test-id
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

    // Находим элемент русского языка по его специфичному test-id
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
      const flag = screen.getByTestId('language-selector-flag');
      expect(flag).toBeInTheDocument();
    });
  });

  it('не вызывает setLanguage при клике на текущий язык', async () => {
    render(<LanguageSelector />);

    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);

    // Находим элемент английского языка по его специфичному test-id
    const englishItem = screen.getByTestId('language-item-en');

    // Проверяем, что элемент отключен (disabled)
    expect(englishItem.getAttribute('aria-disabled')).toBe('true');

    // Кликаем на него и проверяем, что setLanguage не вызвался
    await waitFor(async () => {
      fireEvent.click(englishItem);
    });

    expect(mockSetLanguage).not.toHaveBeenCalled();
  });

  // Тест для проверки отображения дефолтного флага для неизвестного языка в кнопке
  it('отображает флаг GB по умолчанию для неизвестного языка', () => {
    mockUseLocalization.mockImplementation(() => ({
      currentLanguage: 'unknown',
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Русский' },
        { code: 'unknown', name: 'Unknown' }
      ],
      setLanguage: mockSetLanguage,
    }));

    render(<LanguageSelector />);

    // Проверяем флаг в кнопке выбора языка
    const flag = screen.getByTestId('language-selector-flag');
    const flagIcon = within(flag).getByTestId('flag-gb');
    expect(flagIcon).toBeInTheDocument();
  });

  // Тест для проверки отображения дефолтного флага для неизвестного языка в меню
  it('отображает флаг GB по умолчанию для неизвестных языков в меню', () => {
    mockUseLocalization.mockImplementation(() => ({
      currentLanguage: 'en',
      availableLanguages: [
        { code: 'en', name: 'English' },
        { code: 'ru', name: 'Русский' },
        { code: 'fr', name: 'French' }  // Для этого языка нет соответствия в languageToCountryCode
      ],
      setLanguage: mockSetLanguage,
    }));

    render(<LanguageSelector />);

    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);

    // Проверяем элемент французского языка
    const frenchItem = screen.getByTestId('language-item-fr');
    const frenchFlag = within(frenchItem).getByTestId('flag-gb');
    expect(frenchFlag).toBeInTheDocument();
  });

  // Тест для проверки передачи дополнительного CSS класса
  it('применяет переданный className к контейнеру', () => {
    render(<LanguageSelector className="custom-class" />);
    const container = screen.getByTestId('language-selector-container');
    expect(container.className).toContain('custom-class');
  });
});