import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  LoadConfig,
  GetTranslation,
  GetAvailableLanguages,
  GetSystemLanguage,
  Initialize,
  GetAllTranslationKeys,
} from "../../wailsjs/go/main/App";
import { LoadingSpinner } from "../components/LoadingSpinner";

interface LocaleInfo {
  code: string;
  name: string;
}

interface LocalizationContextType {
  t: (key: string, ...params: any[]) => string;
  currentLanguage: string;
  setLanguage: (language: string) => Promise<void>;
  availableLanguages: LocaleInfo[];
  isLoading: boolean;
}

const LocalizationContext = createContext<LocalizationContextType>({
  t: (key) => key,
  currentLanguage: "en",
  setLanguage: () => Promise.resolve(),
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
  const [allTranslations, setAllTranslations] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isTranslationReady, setIsTranslationReady] = useState(false);

  // Синхронная функция перевода, которая использует параметры
  const t = useCallback(
    (key: string, ...params: any[]): string => {
      const translations = allTranslations[languageState] || {};
      const translation = translations[key];

      if (!translation) {
        // Если перевода нет в кэше, запросим его и добавим в кэш
        GetTranslation(key, languageState, params)
          .then((fetchedTranslation) => {
            if (fetchedTranslation !== key) {
              setAllTranslations((prev) => ({
                ...prev,
                [languageState]: {
                  ...(prev[languageState] || {}),
                  [key]: fetchedTranslation,
                },
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
        let result = translation;
        // Убедимся что параметры переданы как массив
        const paramsArray = Array.isArray(params[0]) ? params[0] : params;
        paramsArray.forEach((param, index) => {
          result = result.replace(`{${index}}`, String(param));
        });
        return result;
      }
      return translation;
    },
    [languageState, allTranslations]
  );

  // Load available languages
  useEffect(() => {
    const loadAvailableLanguages = async () => {
      try {
        const codes = await GetAvailableLanguages();
        const langs = await Promise.all(
          codes.map(async (code: string) => ({
            code,
            name: await GetTranslation(`language.${code}`, code, []),
          }))
        );
        setAvailableLanguages(langs);
      } catch (error) {
        console.error("Failed to load available languages:", error);
        setAvailableLanguages([
          { code: "en", name: "English" },
          { code: "ru", name: "Русский" },
        ]);
      }
    };
    loadAvailableLanguages();
  }, []);

  // Инициализация языка при загрузке приложения
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const codes = await GetAvailableLanguages();

        // Сначала пытаемся загрузить сохраненную конфигурацию
        try {
          const savedConfig = await LoadConfig();
          if (savedConfig?.language && codes.includes(savedConfig.language)) {
            setLanguageState(savedConfig.language);
            setIsLoading(false);
            return;
          }
        } catch (configError) {
          console.error("Failed to load config:", configError);
        }

        // Если нет сохраненного языка или он недоступен, пробуем использовать системный
        try {
          const systemLang = await GetSystemLanguage();
          if (systemLang && codes.includes(systemLang)) {
            setLanguageState(systemLang);
            setIsLoading(false);
            return;
          }
        } catch (langError) {
          console.error("Failed to get system language:", langError);
        }

        // Если ничего не получилось, используем английский
        setLanguageState("en");
      } catch (error) {
        console.error("Failed to initialize language:", error);
        setLanguageState("en");
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  // Загрузка всех переводов для всех языков при инициализации приложения
  useEffect(() => {
    const loadAllLanguageTranslations = async () => {
      setIsLoading(true);
      try {
        // Получаем список всех доступных языков
        const codes = await GetAvailableLanguages();
        if (!codes || codes.length === 0) {
          console.error("No language codes available");
          setIsLoading(false);
          setIsTranslationReady(true);
          return;
        }

        // Загружаем переводы для каждого языка
        const allLangTranslations: Record<string, Record<string, string>> = {};

        await Promise.all(
          codes.map(async (langCode) => {
            try {
              // Получаем все ключи для языка
              const keys = await GetAllTranslationKeys(langCode);
              if (!keys) return;

              // Загружаем переводы большими блоками
              const chunkSize = 100;
              const chunks: string[][] = [];
              for (let i = 0; i < keys.length; i += chunkSize) {
                chunks.push(keys.slice(i, i + chunkSize));
              }

              const langTranslations: Record<string, string> = {};

              // Загружаем все чанки для данного языка
              await Promise.all(
                chunks.map(async (chunk) => {
                  const translationsForChunk = await Promise.all(
                    chunk.map(async (key) => {
                      try {
                        const translation = await GetTranslation(
                          key,
                          langCode,
                          []
                        );
                        return { key, translation };
                      } catch (error) {
                        console.error(
                          `Failed to load translation for key: ${key} (${langCode})`,
                          error
                        );
                        return { key, translation: key };
                      }
                    })
                  );

                  // Добавляем переводы в кэш для текущего языка
                  translationsForChunk.forEach(({ key, translation }) => {
                    langTranslations[key] = translation;
                  });
                })
              );

              // Сохраняем все переводы для текущего языка
              allLangTranslations[langCode] = langTranslations;
            } catch (error) {
              console.error(
                `Failed to load translations for language: ${langCode}`,
                error
              );
            }
          })
        );

        // Устанавливаем все переводы для всех языков
        setAllTranslations(allLangTranslations);
      } catch (error) {
        console.error("Failed to preload all translations:", error);
      } finally {
        setIsLoading(false);
        setIsTranslationReady(true);
      }
    };

    loadAllLanguageTranslations();
  }, []);

  // Change language handler - просто меняем текущий язык без повторной загрузки переводов
  const setLanguage = useCallback(
    async (language: string): Promise<void> => {
      // Проверка, нужно ли менять язык
      if (language === languageState) {
        return Promise.resolve();
      }

      try {
        // Загружаем текущую конфигурацию
        let currentConfig;
        try {
          currentConfig = await LoadConfig();

          // Просто изменяем язык конфигурации и не вызываем полную инициализацию клиента
          if (currentConfig) {
            currentConfig.language = language;
            // Сохраняем обновленную конфигурацию
            await Initialize(JSON.stringify(currentConfig));
            console.log(`Language changed to ${language}`);
          }
        } catch (error) {
          console.error("Failed to load config:", error);
        }

        // Изменяем состояние языка вне зависимости от успешного сохранения конфигурации
        setLanguageState(language);
      } catch (error) {
        console.error("Failed to save language:", error);
        // Даже при ошибке сохранения конфигурации меняем язык, чтобы UI был консистентным
        setLanguageState(language);
      }

      return Promise.resolve();
    },
    [languageState]
  );

  // Update window title when language changes
  useEffect(() => {
    const updateTitle = async () => {
      const title = await GetTranslation("app.title", languageState, []);
      document.title = title;
    };
    updateTitle();
  }, [languageState]);

  const contextValue = useMemo(
    () => ({
      t,
      currentLanguage: languageState,
      setLanguage,
      availableLanguages,
      isLoading: isLoading || !isTranslationReady,
    }),
    [
      t,
      languageState,
      setLanguage,
      availableLanguages,
      isLoading,
      isTranslationReady,
    ]
  );

  return (
    <LocalizationContext.Provider value={contextValue}>
      {isLoading || !isTranslationReady ? <LoadingSpinner /> : children}
    </LocalizationContext.Provider>
  );
};
