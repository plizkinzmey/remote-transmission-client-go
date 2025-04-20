import { useState, useCallback, useEffect } from "react";
import {
  LoadConfig,
  GetAvailableLanguages,
  GetSystemLanguage,
  GetTranslation,
  Initialize,
} from "@wailsjs/go/main/App";
import type { LocaleInfo } from "../types";

export interface UseLanguageInitializationResult {
  currentLanguage: string;
  availableLanguages: LocaleInfo[];
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

export function useLanguageInitialization(): UseLanguageInitializationResult {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [availableLanguages, setAvailableLanguages] = useState<LocaleInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadAvailableLanguages = useCallback(async () => {
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
  }, []);

  const initializeLanguage = useCallback(async () => {
    try {
      const codes = await GetAvailableLanguages();

      // Try to load saved configuration first
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig?.language && codes.includes(savedConfig.language)) {
          setCurrentLanguage(savedConfig.language);
          setIsLoading(false);
          return;
        }
      } catch (configError) {
        console.error("Failed to load config:", configError);
      }

      // If no saved language or it's not available, try to use system language
      try {
        const systemLang = await GetSystemLanguage();
        if (systemLang && codes.includes(systemLang)) {
          setCurrentLanguage(systemLang);
          setIsLoading(false);
          return;
        }
      } catch (langError) {
        console.error("Failed to get system language:", langError);
      }

      // Fall back to English if nothing else works
      setCurrentLanguage("en");
    } catch (error) {
      console.error("Failed to initialize language:", error);
      setCurrentLanguage("en");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setLanguage = useCallback(
    async (language: string): Promise<void> => {
      if (language === currentLanguage) {
        return;
      }

      try {
        let currentConfig;
        try {
          currentConfig = await LoadConfig();

          if (currentConfig) {
            currentConfig.language = language;
            await Initialize(JSON.stringify(currentConfig));
            console.log(`Language changed to ${language}`);
          }
        } catch (error) {
          console.error("Failed to load config:", error);
        }

        setCurrentLanguage(language);
      } catch (error) {
        console.error("Failed to save language:", error);
        setCurrentLanguage(language);
      }
    },
    [currentLanguage]
  );

  // Initialize available languages and current language
  useEffect(() => {
    loadAvailableLanguages();
    initializeLanguage();
  }, [loadAvailableLanguages, initializeLanguage]);

  return {
    currentLanguage,
    availableLanguages,
    setLanguage,
    isLoading,
  };
}
