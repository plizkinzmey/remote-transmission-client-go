export interface LocaleInfo {
  code: string;
  name: string;
}

export interface LocalizationContextType {
  t: (key: string, ...params: any[]) => string;
  currentLanguage: string;
  setLanguage: (language: string) => Promise<void>;
  availableLanguages: LocaleInfo[];
  isLoading: boolean;
}

export interface TranslationCache {
  [language: string]: {
    [key: string]: string;
  };
}

export interface LocalizationProviderProps {
  children: React.ReactNode;
}
