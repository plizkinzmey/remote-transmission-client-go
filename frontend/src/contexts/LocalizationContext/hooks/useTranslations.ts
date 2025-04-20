import { useCallback, useState } from "react";
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

  const t = useCallback(
    (
      key: string,
      params?: string | string[] | Record<string, string>
    ): string => {
      if (!key) return "";

      const translations = allTranslations[currentLanguage] || {};
      let translation = translations[key];

      // Если перевод не найден, запрашиваем его и возвращаем ключ как fallback
      if (!translation) {
        GetTranslation(key, currentLanguage, [])
          .then((fetchedTranslation) => {
            if (fetchedTranslation && fetchedTranslation !== key) {
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

        translation = key;
      }

      if (!params) {
        return translation;
      }

      // Если params - строка, просто заменяем {0}
      if (typeof params === "string") {
        return translation.replace("{0}", params);
      }

      // Если params - массив, заменяем {0}, {1}, etc.
      if (Array.isArray(params)) {
        return params.reduce((result, param, index) => {
          return result.replace(`{${index}}`, param);
        }, translation);
      }

      // Если params - объект, заменяем {key}
      return Object.entries(params).reduce(
        (result, [paramKey, value]) => result.replace(`{${paramKey}}`, value),
        translation
      );
    },
    [currentLanguage, allTranslations]
  );

  const loadAllTranslations = useCallback(
    async (languages: string[]): Promise<void> => {
      try {
        const newTranslations: TranslationsCache = {};

        await Promise.all(
          languages.map(async (langCode) => {
            try {
              const keys = await GetAllTranslationKeys(langCode);
              if (!keys) return;

              const chunkSize = 100;
              const chunks: string[][] = [];
              for (let i = 0; i < keys.length; i += chunkSize) {
                chunks.push(keys.slice(i, i + chunkSize));
              }

              const langTranslations: Record<string, string> = {};

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

                  translationsForChunk.forEach(({ key, translation }) => {
                    if (translation && translation !== key) {
                      langTranslations[key] = translation;
                    }
                  });
                })
              );

              if (Object.keys(langTranslations).length > 0) {
                newTranslations[langCode] = langTranslations;
              }
            } catch (error) {
              console.error(
                `Failed to load translations for language: ${langCode}`,
                error
              );
            }
          })
        );

        setAllTranslations((prevTranslations) => ({
          ...prevTranslations,
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
