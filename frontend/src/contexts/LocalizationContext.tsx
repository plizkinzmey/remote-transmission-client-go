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

interface LocalizationContextType {
  t: (key: string, ...params: string[]) => string;
  currentLanguage: string;
  setLanguage: (language: string) => void;
  availableLanguages: LocaleInfo[];
  isLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  currentLanguage: "en",
  setLanguage: () => {},
  availableLanguages: [{ code: "en", name: "English" }],
  isLoading: true,
});

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

  // Synchronous translation function that uses cache
  const t = (key: string, ...params: string[]): string => {
    // Return from cache if available
    if (translations[key]) {
      return formatTranslation(translations[key], params);
    }

    // If not in cache, return key and trigger async load
    GetTranslation(key, currentLanguage)
      .then((translation) => {
        setTranslations((prev) => ({
          ...prev,
          [key]: translation,
        }));
      })
      .catch((error) => {
        console.error(`Failed to get translation for key: ${key}`, error);
      });

    return formatTranslation(key, params);
  };

  // Preload common translations when language changes
  useEffect(() => {
    const preloadCommonTranslations = async () => {
      const commonKeys = [
        "app.title",
        "torrent.status.stopped",
        "torrent.status.downloading",
        "torrent.status.seeding",
        "torrent.status.checking",
        "torrent.status.queued",
        "torrent.status.completed",
        "torrent.start",
        "torrent.stop",
        "torrent.remove",
        "torrent.ratio",
        "torrent.seeds",
        "torrent.peers",
        "torrent.uploaded",
      ];

      try {
        const newTranslations: Record<string, string> = {};
        await Promise.all(
          commonKeys.map(async (key) => {
            try {
              const translation = await GetTranslation(key, currentLanguage);
              newTranslations[key] = translation;
            } catch (error) {
              console.error(
                `Failed to preload translation for key: ${key}`,
                error
              );
            }
          })
        );

        setTranslations((prev) => ({
          ...prev,
          ...newTranslations,
        }));
      } catch (error) {
        console.error("Failed to preload translations:", error);
      }
    };

    if (currentLanguage) {
      preloadCommonTranslations();
    }
  }, [currentLanguage]);

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
          const systemLang = await GetSystemLanguage();
          setCurrentLanguage(systemLang);
        }
      } catch (error) {
        console.error("Failed to load language from config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguageFromConfig();
  }, []);

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
    setTranslations({}); // Clear translations cache when language changes
  };

  // Memoize the context value
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
