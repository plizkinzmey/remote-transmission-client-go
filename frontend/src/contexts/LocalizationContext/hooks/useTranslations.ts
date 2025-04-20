import { useCallback, useState } from "react";
import { GetTranslation, GetAllTranslationKeys } from "@wailsjs/go/main/App";
import type { TranslationCache } from "../types";

export interface UseTranslationsResult {
  t: (key: string, ...params: any[]) => string;
  allTranslations: TranslationCache;
  loadAllTranslations: (languages: string[]) => Promise<void>;
}

export function useTranslations(
  currentLanguage: string
): UseTranslationsResult {
  const [allTranslations, setAllTranslations] = useState<TranslationCache>({});

  const t = useCallback(
    (key: string, ...params: any[]): string => {
      const translations = allTranslations[currentLanguage] || {};
      const translation = translations[key];

      if (!translation) {
        // If translation is not in cache, request it and add to cache
        GetTranslation(key, currentLanguage, params)
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

        return key;
      }

      // If parameters were passed, replace placeholders
      if (params.length > 0) {
        let result = translation;
        const paramsArray = Array.isArray(params[0]) ? params[0] : params;
        paramsArray.forEach((param, index) => {
          result = result.replace(`{${index}}`, String(param));
        });
        return result;
      }
      return translation;
    },
    [currentLanguage, allTranslations]
  );

  const loadAllTranslations = useCallback(
    async (languages: string[]): Promise<void> => {
      try {
        const newTranslations: TranslationCache = {};

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
                    langTranslations[key] = translation;
                  });
                })
              );

              newTranslations[langCode] = langTranslations;
            } catch (error) {
              console.error(
                `Failed to load translations for language: ${langCode}`,
                error
              );
            }
          })
        );

        setAllTranslations(newTranslations);
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
