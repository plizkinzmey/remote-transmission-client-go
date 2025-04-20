import { useState, useCallback, useEffect } from "react";
import {
  LoadConfig,
  GetAvailableLanguages,
  GetSystemLanguage,
  GetTranslation,
  Initialize,
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
      const languageInfos = await Promise.all(
        languages.map(async (code) => {
          const name = await GetTranslation(`language.${code}`, code, []);
          return { code, name };
        })
      );
      setAvailableLanguages(languageInfos);
    } catch (error) {
      console.error("Error loading languages:", error);
      setAvailableLanguages([{ code: "en", name: "English" }]);
    }
  }, []);

  const initializeLanguage = useCallback(async () => {
    try {
      const config = await LoadConfig();
      const languages = await GetAvailableLanguages();
      if (config?.language && languages.includes(config.language)) {
        setCurrentLanguage(config.language);
      } else if (languages.length > 0) {
        setCurrentLanguage(languages[0]);
      } else {
        try {
          const systemLang = await GetSystemLanguage();
          setCurrentLanguage(systemLang);
        } catch (error) {
          console.error("Error getting system language:", error);
          setCurrentLanguage("en");
        }
      }
    } catch (error) {
      console.error("Error initializing language:", error);
      try {
        const systemLang = await GetSystemLanguage();
        setCurrentLanguage(systemLang);
      } catch (sysError) {
        console.error("Error getting system language:", sysError);
        setCurrentLanguage("en");
      }
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
      await Initialize(JSON.stringify({ language: lang }));
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
