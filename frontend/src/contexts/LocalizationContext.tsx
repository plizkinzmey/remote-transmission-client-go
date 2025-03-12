import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import {
  LoadConfig,
  GetTranslation,
  GetAvailableLanguages,
  GetSystemLanguage,
} from "../../wailsjs/go/main/App";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface LocaleInfo {
  code: string;
  name: string;
}

// Define the context type
interface LocalizationContextType {
  t: (key: string, ...params: string[]) => string;
  currentLanguage: string;
  setLanguage: (language: string) => void;
  availableLanguages: LocaleInfo[];
  isLoading: boolean;
}

// Create the context with default values
const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  currentLanguage: "en",
  setLanguage: () => {},
  availableLanguages: [{ code: "en", name: "English" }],
  isLoading: true,
});

// Custom hook for using the localization context
export const useLocalization = () => useContext(LocalizationContext);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [availableLanguages, setAvailableLanguages] = useState<LocaleInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Format translation with parameters
  const formatTranslation = (text: string, params: string[]) => {
    let result = text;
    params.forEach((param, index) => {
      result = result.replace(`{${index}}`, param);
    });
    return result;
  };

  // Translation function that gets translations from backend
  const t = (key: string, ...params: string[]): string => {
    // Use window runtime cache if available for better performance
    const cacheKey = `i18n_${currentLanguage}_${key}`;
    if ((window as any)[cacheKey]) {
      return formatTranslation((window as any)[cacheKey], params);
    }

    // Use loaded translations
    if (translations[key]) {
      return formatTranslation(translations[key], params);
    }

    // Fallback to key if translation not found
    return formatTranslation(key, params);
  };

  // Load available languages
  useEffect(() => {
    const loadAvailableLanguages = async () => {
      try {
        const codes = await GetAvailableLanguages();
        const langs = await Promise.all(
          codes.map(async (code: string) => ({
            code,
            name: await GetTranslation(`language.${code}`, code),
          }))
        );
        setAvailableLanguages(langs);
      } catch (error) {
        console.error("Failed to load available languages:", error);
        // Fallback to English only
        setAvailableLanguages([{ code: "en", name: "English" }]);
      }
    };

    loadAvailableLanguages();
  }, []);

  // Load language from config
  useEffect(() => {
    const loadLanguageFromConfig = async () => {
      try {
        const config = await LoadConfig();
        if (config?.language) {
          setCurrentLanguage(config.language);
        } else {
          // If no language set in config, try to get system language
          const systemLang = await GetSystemLanguage();
          setCurrentLanguage(systemLang);
        }
      } catch (error) {
        console.error("Failed to load language from config:", error);
      }
    };

    loadLanguageFromConfig();
  }, []);

  // Preload translations for current language
  useEffect(() => {
    const preloadTranslations = async () => {
      try {
        setIsLoading(true);

        // Get all translation keys from locales/en.json (this assumes we have all keys in English)
        const response = await fetch("/locales/en.json");
        const enTranslations = await response.json();

        // Preload translations for current language
        const newTranslations: Record<string, string> = {};
        for (const key of Object.keys(enTranslations)) {
          const translation = await GetTranslation(key, currentLanguage);
          newTranslations[key] = translation;
          (window as any)[`i18n_${currentLanguage}_${key}`] = translation;
        }

        setTranslations(newTranslations);
      } catch (error) {
        console.error("Failed to preload translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentLanguage) {
      preloadTranslations();
    }
  }, [currentLanguage]);

  // Update window title when language changes
  useEffect(() => {
    const updateTitle = async () => {
      const title = await GetTranslation("app.title", currentLanguage);
      document.title = title;
    };
    updateTitle();
  }, [currentLanguage]);

  // Change language
  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    // Cache will be updated on next render due to useEffect
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      t,
      currentLanguage,
      setLanguage,
      availableLanguages,
      isLoading,
    }),
    [t, currentLanguage, availableLanguages, isLoading]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};
