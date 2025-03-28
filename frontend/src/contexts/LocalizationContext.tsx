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
  Initialize,
} from "../../wailsjs/go/main/App";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface LocaleInfo {
  code: string;
  name: string;
}

interface LocalizationContextType {
  t: (key: string, ...params: any[]) => string;
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
  const [languageState, setLanguageState] = useState<string>("en");
  const [availableLanguages, setAvailableLanguages] = useState<LocaleInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [translationsCache, setTranslationsCache] = useState<
    Record<string, string>
  >({});
  const [isTranslationReady, setIsTranslationReady] = useState(false);

  // Синхронная функция перевода, которая использует параметры
  const t = (key: string, ...params: any[]): string => {
    const cachedTranslation = translationsCache[key];

    if (!cachedTranslation) {
      // Передаем params как массив
      GetTranslation(key, languageState, params)
        .then((translation) => {
          if (translation !== key) {
            setTranslationsCache((prev) => ({
              ...prev,
              [key]: translation,
            }));
          }
        })
        .catch((error) => {
          console.error(`Failed to get translation for key: ${key}`, error);
        });

      return key;
    }

    // Если в запросе были переданы параметры, заменяем плейсхолдеры
    if (params.length > 0) {
      let result = cachedTranslation;
      // Убедимся что параметры переданы как массив
      const paramsArray = Array.isArray(params[0]) ? params[0] : params;
      paramsArray.forEach((param, index) => {
        result = result.replace(`{${index}}`, String(param));
      });
      return result;
    }
    return cachedTranslation;
  };

  // Предзагружаем общие переводы при изменении языка
  useEffect(() => {
    const preloadCommonTranslations = async () => {
      setIsTranslationReady(false);
      const commonKeys = [
        "app.title",
        "filters.downloading",
        "filters.seeding",
        "filters.stopped",
        "filters.checking",
        "filters.queued",
        "filters.completed",
        "filters.slow",
        "torrent.status.stopped",
        "torrent.status.downloading",
        "torrent.status.seeding",
        "torrent.status.checking",
        "torrent.status.queued",
        "torrent.status.completed",
        "torrent.status.queuedCheck",
        "torrent.status.queuedDownload",
        "torrent.start",
        "torrent.stop",
        "torrent.remove",
        "torrent.ratio",
        "torrent.seeds",
        "torrent.peers",
        "torrent.uploaded",
        "torrent.size",
        "torrent.speed",
        "torrent.slowSpeed",
        "torrent.normalSpeed",
        "torrent.verify",
        "torrent.verifying",
        "header.slowSpeed",
        "header.normalSpeed",
        "torrents.search",
        "torrents.selectAll",
        "torrents.selected",
        "torrents.startSelected",
        "torrents.stopSelected",
        "add.title",
        "settings.title",
        "remove.title",
        "remove.cancel",
        "remove.confirm",
        "remove.withData",
        "remove.confirmation",
        "remove.selectedConfirmation",
        "remove.selectedCount",
        "remove.message",
        "settings.testSuccess",
        "settings.testError",
        "settings.testing",
        "settings.testConnection",
        "errors.timeoutExplanation",
      ];

      try {
        const newTranslations: Record<string, string> = {};
        await Promise.all(
          commonKeys.map(async (key) => {
            try {
              // Передаём пустой массив для третьего параметра
              const translation = await GetTranslation(key, languageState, []);
              newTranslations[key] = translation;
            } catch (error) {
              console.error(
                `Failed to preload translation for key: ${key}`,
                error
              );
            }
          })
        );

        setTranslationsCache((prev) => ({
          ...prev,
          ...newTranslations,
        }));
        setIsTranslationReady(true);
      } catch (error) {
        console.error("Failed to preload translations:", error);
        setIsTranslationReady(true); // Продолжаем даже при ошибке
      }
    };

    if (languageState) {
      preloadCommonTranslations();
    }
  }, [languageState]);

  // Load available languages
  useEffect(() => {
    const loadAvailableLanguages = async () => {
      try {
        const codes = await GetAvailableLanguages();
        const langs = await Promise.all(
          codes.map(async (code: string) => ({
            code,
            // Передаём пустой массив для третьего параметра
            name: await GetTranslation(`language.${code}`, code, []),
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
          setLanguageState(config.language);
        } else {
          const systemLang = await GetSystemLanguage();
          setLanguageState(systemLang);
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
      // Передаём пустой массив для третьего параметра
      const title = await GetTranslation("app.title", languageState, []);
      document.title = title;
    };
    updateTitle();
  }, [languageState]);

  // Change language with config update
  const setLanguage = async (language: string) => {
    try {
      const currentConfig = await LoadConfig();
      const updatedConfig = {
        ...currentConfig,
        language,
      };
      await Initialize(JSON.stringify(updatedConfig));
      setLanguageState(language);
      // Сбрасываем кэш переводов при смене языка
      setTranslationsCache({});
    } catch (error) {
      console.error("Failed to save language:", error);
      // Всё равно меняем язык локально, даже если сохранение не удалось
      setLanguageState(language);
      setTranslationsCache({});
    }
  };

  // Мемоизируем контекстное значение
  const contextValue = useMemo(
    () => ({
      t,
      currentLanguage: languageState,
      setLanguage,
      availableLanguages,
      isLoading,
    }),
    [t, languageState, availableLanguages, isLoading]
  );

  if (isLoading || !isTranslationReady) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};
