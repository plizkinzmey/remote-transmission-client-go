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

  // Предзагружаем все переводы при изменении языка
  useEffect(() => {
    const preloadAllTranslations = async () => {
      setIsTranslationReady(false);
      
      try {
        // Импортируем функцию для получения всех ключей переводов
        const { GetAllTranslationKeys } = await import("../../wailsjs/go/main/App");
        
        // Получаем все ключи переводов для текущего языка
        const allKeys = await GetAllTranslationKeys(languageState);
        
        // Загружаем переводы для всех ключей
        const newTranslations: Record<string, string> = {};
        
        // Разбиваем загрузку на части, чтобы не перегружать систему
        const chunkSize = 50;
        for (let i = 0; i < allKeys.length; i += chunkSize) {
          const chunk = allKeys.slice(i, i + chunkSize);
          
          await Promise.all(
            chunk.map(async (key: string) => {
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
        }

        setTranslationsCache((prev) => ({
          ...prev,
          ...newTranslations,
        }));
        setIsTranslationReady(true);
      } catch (error) {
        console.error("Failed to preload translations:", error);
        
        // В случае ошибки загружаем основные ключи вручную
        try {
          const fallbackKeys = [
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
            "settings.title",
            "errors.timeoutExplanation",
          ];
          
          const fallbackTranslations: Record<string, string> = {};
          await Promise.all(
            fallbackKeys.map(async (key) => {
              try {
                const translation = await GetTranslation(key, languageState, []);
                fallbackTranslations[key] = translation;
              } catch (err) {
                console.error(`Failed to load fallback translation for key: ${key}`, err);
              }
            })
          );
          
          setTranslationsCache((prev) => ({
            ...prev,
            ...fallbackTranslations,
          }));
        } catch (fallbackError) {
          console.error("Failed to load fallback translations:", fallbackError);
        }
        
        setIsTranslationReady(true); // Продолжаем даже при ошибке
      }
    };

    if (languageState) {
      preloadAllTranslations();
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

  // Инициализация языка при загрузке приложения
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Сначала загружаем доступные языки
        const codes = await GetAvailableLanguages();
        const langs = await Promise.all(
          codes.map(async (code: string) => ({
            code,
            name: await GetTranslation(`language.${code}`, code, []),
          }))
        );
        setAvailableLanguages(langs);
        
        // Затем загружаем сохраненный язык
        const savedConfig = await LoadConfig();
        if (savedConfig && savedConfig.language) {
          // Проверяем, что сохраненный язык доступен
          if (codes.includes(savedConfig.language)) {
            setLanguageState(savedConfig.language);
          } else {
            // Если сохраненный язык недоступен, используем системный
            const systemLang = await GetSystemLanguage();
            // Проверяем, что системный язык доступен
            if (systemLang && codes.includes(systemLang)) {
              setLanguageState(systemLang);
            } else {
              setLanguageState("en"); // Используем английский по умолчанию
            }
          }
        } else {
          // Если язык не сохранен, используем системный
          const systemLang = await GetSystemLanguage();
          // Проверяем, что системный язык доступен
          if (systemLang && codes.includes(systemLang)) {
            setLanguageState(systemLang);
          } else {
            setLanguageState("en"); // Используем английский по умолчанию
          }
        }
      } catch (error) {
        console.error("Failed to initialize language:", error);
        setLanguageState("en"); // Используем английский по умолчанию при ошибке
        setAvailableLanguages([{ code: "en", name: "English" }, { code: "ru", name: "Русский" }]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
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
