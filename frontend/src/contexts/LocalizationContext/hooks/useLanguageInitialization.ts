import { useState, useCallback, useEffect } from "react";
import {
  LoadConfig,
  GetAvailableLanguages,
  GetSystemLanguage,
} from "@wailsjs/go/main/App";
import type { LanguageInfo } from "../types";

export const useLanguageInitialization = () => {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadAvailableLanguages = useCallback(async () => {
    try {
      const languages = await GetAvailableLanguages();
      setAvailableLanguages(languages.map((code) => ({ code, name: code })));
    } catch (error) {
      console.error("Error loading languages:", error);
      setAvailableLanguages([{ code: "en", name: "English" }]);
    }
  }, []);

  const initializeLanguage = useCallback(async () => {
    try {
      const config = await LoadConfig();
      if (config?.language) {
        setCurrentLanguage(config.language);
      } else {
        const systemLang = await GetSystemLanguage();
        setCurrentLanguage(systemLang || "en");
      }
    } catch (error) {
      console.error("Error initializing language:", error);
      setCurrentLanguage("en");
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([loadAvailableLanguages(), initializeLanguage()]);
      setIsLoading(false);
    };

    initialize();
  }, [loadAvailableLanguages, initializeLanguage]);

  const setLanguage = useCallback(async (lang: string) => {
    try {
      setCurrentLanguage(lang);
      // Здесь можно добавить сохранение выбранного языка
    } catch (error) {
      console.error("Error setting language:", error);
    }
  }, []);

  return {
    currentLanguage,
    availableLanguages,
    setLanguage,
    isLoading,
  };
};
