import { useCallback, useState, useEffect } from "react";
import { GetTranslation, GetAllTranslationKeys } from "@wailsjs/go/main/App";
import type { TranslationsCache } from "../types";

export interface UseTranslationsResult {
  t: (
    key: string,
    params?: string | string[] | Record<string, string>
  ) => string;
  allTranslations: TranslationsCache;
  loadAllTranslations: (languages: string[]) => Promise<void>;
}

export function useTranslations(
  currentLanguage: string
): UseTranslationsResult {
  const [allTranslations, setAllTranslations] = useState<TranslationsCache>({});

  // Загружаем переводы при изменении языка
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const keys = await GetAllTranslationKeys(currentLanguage);
        if (!keys) return;

        const translations = await Promise.all(
          keys.map(async (key) => {
            try {
              const translation = await GetTranslation(
                key,
                currentLanguage,
                []
              );
              return { key, translation };
            } catch (error) {
              console.error(
                `Failed to load translation for key: ${key} (${currentLanguage})`,
                error
              );
              return { key, translation: key };
            }
          })
        );

        const newTranslations: TranslationsCache = {
          [currentLanguage]: {},
        };

        translations.forEach(({ key, translation }) => {
          if (translation !== key) {
            newTranslations[currentLanguage][key] = translation;
          }
        });

        setAllTranslations((prev) => ({
          ...prev,
          ...newTranslations,
        }));
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  const t = useCallback(
    (
      key: string,
      params?: string | string[] | Record<string, string>
    ): string => {
      if (!key) return "";

      const translations = allTranslations[currentLanguage] || {};
      let translation = translations[key];

      if (!translation) {
        translation = key;
        // Асинхронно загружаем перевод для будущего использования
        GetTranslation(key, currentLanguage, [])
          .then((fetchedTranslation) => {
            if (fetchedTranslation !== key) {
              setAllTranslations((prev) => ({
                ...prev,
                [currentLanguage]: {
                  ...(prev[currentLanguage] || {}),
                  [key]: fetchedTranslation,
                },
              }));
            }
          })
          .catch((error) => {
            console.error(`Failed to get translation for key: ${key}`, error);
          });
      }

      if (!params) {
        return translation;
      }

      if (typeof params === "string") {
        return translation.replace("{0}", params);
      }

      if (Array.isArray(params)) {
        return params.reduce((result, param, index) => {
          return result.replace(`{${index}}`, String(param));
        }, translation);
      }

      return Object.entries(params).reduce(
        (result, [paramKey, value]) =>
          result.replace(`{${paramKey}}`, String(value)),
        translation
      );
    },
    [currentLanguage, allTranslations]
  );

  const loadAllTranslations = useCallback(
    async (languages: string[]): Promise<void> => {
      try {
        const newTranslations: TranslationsCache = {};
        for (const langCode of languages) {
          try {
            const keys = await GetAllTranslationKeys(langCode);
            if (!keys) continue;

            newTranslations[langCode] = {};
            const translations = await Promise.all(
              keys.map(async (key) => {
                try {
                  const translation = await GetTranslation(key, langCode, []);
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

            translations.forEach(({ key, translation }) => {
              if (translation !== key) {
                newTranslations[langCode][key] = translation;
              }
            });
          } catch (error) {
            console.error(
              `Failed to load translations for language: ${langCode}`,
              error
            );
          }
        }

        setAllTranslations((prev) => ({
          ...prev,
          ...newTranslations,
        }));
      } catch (error) {
        console.error("Failed to preload all translations:", error);
      }
    },
    []
  );

  return {
    t,
    allTranslations,
    loadAllTranslations,
  };
}
