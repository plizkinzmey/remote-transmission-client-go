/**
 * Информация о языке
 */
export interface LanguageInfo {
  /** Код языка (например, 'en', 'ru') */
  code: string;
  /** Название языка */
  name: string;
}

/**
 * Контекст локализации
 */
export interface LocalizationContextType {
  /** Текущий язык */
  currentLanguage: string;
  /** Доступные языки */
  availableLanguages: LanguageInfo[];
  /** Функция перевода */
  t: (
    key: string,
    params?: string | string[] | Record<string, string>
  ) => string;
  /** Функция смены языка */
  setLanguage: (lang: string) => Promise<void>;
  /** Флаг загрузки */
  isLoading: boolean;
}

/**
 * Настройки для контекста локализации
 */
export interface LocalizationProviderProps {
  /** Дочерние элементы */
  children: React.ReactNode;
}

/**
 * Кэш переводов
 */
export interface TranslationsCache {
  [key: string]: {
    [key: string]: string;
  };
}
