import React, { ReactNode, createContext, useContext, useState } from "react";
import { vi } from "vitest";

// Базовые типы для локализации
interface Language {
  code: string;
  name: string;
}

interface LocalizationContextType {
  t: (key: string, ...args: any[]) => string;
  currentLanguage: string;
  setLanguage: (lang: string) => Promise<void>;
  availableLanguages: Language[];
  isLoading: boolean;
}

// Создаем контекст для локализации
export const TestLocalizationContext = createContext<LocalizationContextType>({
  t: (key: string) => key,
  currentLanguage: "en",
  setLanguage: async () => {},
  availableLanguages: [
    { code: "en", name: "English" },
    { code: "ru", name: "Русский" },
  ],
  isLoading: false,
});

// Экспортируем хук для использования в компонентах
export const useLocalization = () => {
  const context = useContext(TestLocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};

// Мокируем компонент LocalizationProvider
export const LocalizationProvider: React.FC<{ 
  children: ReactNode,
  isLoading?: boolean,
  initialLanguage?: string
}> = ({
  children,
  isLoading = false,
  initialLanguage = "en",
}) => {
  const [currentLanguage, setCurrentLanguageState] = useState(initialLanguage);
  const [loading, setLoading] = useState(isLoading);

  // Функция для перевода с поддержкой параметров
  const translate = (key: string, ...args: any[]): string => {
    let translation = key;
    if (args && args.length > 0) {
      args.forEach((arg, index) => {
        translation = translation.replace(`{${index}}`, String(arg));
      });
    }
    return translation;
  };

  const contextValue = {
    t: translate,
    currentLanguage,
    setLanguage: async (lang: string) => {
      setLoading(true);
      try {
        setCurrentLanguageState(lang);
      } finally {
        setLoading(false);
      }
    },
    availableLanguages: [
      { code: "en", name: "English" },
      { code: "ru", name: "Русский" },
    ],
    isLoading: loading,
  };

  return (
    <TestLocalizationContext.Provider value={contextValue}>
      <div data-testid="mock-localization-provider" data-language={currentLanguage}>
        {children}
      </div>
    </TestLocalizationContext.Provider>
  );
};

// Для тестов, которым нужна обёртка
export const MockLocalizationProvider: React.FC<{ 
  children: ReactNode,
  isLoading?: boolean,
  initialLanguage?: string
}> = (props) => {
  return <LocalizationProvider {...props} />;
};

// Мокируем весь модуль
vi.mock("../../contexts/LocalizationContext", () => ({
  useLocalization,
  LocalizationProvider
}));
