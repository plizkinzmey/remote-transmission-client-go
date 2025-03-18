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
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
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
    // Получение перевода
    const cachedTranslation = translationsCache[key];

    // Если есть в кэше, используем его, иначе запрашиваем асинхронно
    if (!cachedTranslation) {
      // Асинхронно загружаем перевод, но возвращаем ключ пока он не загрузился
      GetTranslation(key, currentLanguage, params)
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

      // Пока возвращаем ключ
      return key;
    }

    // Если в запросе были переданы параметры, заменяем плейсхолдеры
    if (params.length > 0) {
      let result = cachedTranslation;
      params.forEach((param, index) => {
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
      ];

      try {
        const newTranslations: Record<string, string> = {};
        await Promise.all(
          commonKeys.map(async (key) => {
            try {
              const translation = await GetTranslation(
                key,
                currentLanguage,
                []
              );
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
            // Добавляем пустой массив как третий аргумент
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
      // Добавляем пустой массив как третий аргумент
      const title = await GetTranslation("app.title", currentLanguage, []);
      document.title = title;
    };
    updateTitle();
  }, [currentLanguage]);

  // Change language
  const setLanguage = (language: string) => {
    setCurrentLanguage(language);
    // Сбрасываем кэш переводов при смене языка
    setTranslationsCache({});
  };

  // Мемоизируем контекстное значение
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

  if (isLoading || !isTranslationReady) {
    return <LoadingSpinner />;
  }

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
};
