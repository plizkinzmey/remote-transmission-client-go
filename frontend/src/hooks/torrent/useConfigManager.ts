import { useState, useCallback, useEffect } from "react";
import { AppConfig } from "./types";
import { ConnectionConfig, UIConfig } from "@/App"; // Используем алиас
import { useLocalization } from "@/contexts/LocalizationContext";

interface ConfigManagerProps {
  initialConfig: AppConfig | null; // Начальный конфиг из useConnectionManager
  onConfigSave: (newConfig: AppConfig) => Promise<boolean>; // Функция для инициализации/сохранения из useConnectionManager
}

/**
 * Хук для управления конфигурацией приложения (загрузка, сохранение).
 */
export function useConfigManager({
  initialConfig,
  onConfigSave,
}: ConfigManagerProps) {
  const { t, currentLanguage: languageState } = useLocalization();
  const [config, setConfig] = useState<AppConfig | null>(initialConfig);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Универсальная функция для установки ошибки с безопасным fallback
  const setErrorSafe = useCallback(
    (message: string, fallback?: string) => {
      try {
        setError(t(message, fallback));
      } catch {
        setError(message);
      }
    },
    [t]
  );

  const handleSettingsSave = useCallback(
    async (connectionSettings: ConnectionConfig): Promise<boolean> => {
      setIsSettingsSaving(true);
      setError(null);
      let result = false;
      try {
        const uiSettings: UIConfig = {
          language: config?.language || languageState || "en",
          theme: (config?.theme || "light") as "light" | "dark" | "auto",
        };
        const fullConfig: AppConfig = { ...connectionSettings, ...uiSettings };
        result = await onConfigSave(fullConfig);

        if (result) {
          setConfig(fullConfig);
        } else {
          setErrorSafe("errors.failedToUpdateSettings", "Connection failed");
        }
      } catch (saveError) {
        console.error("Failed to save settings:", saveError);
        setErrorSafe("errors.failedToUpdateSettings", String(saveError));
      } finally {
        safeSetIsSettingsSaving(setIsSettingsSaving, false);
      }
      return result;
    },
    [config, languageState, onConfigSave, setErrorSafe]
  );

  function safeSetIsSettingsSaving(
    setter: (v: boolean) => void,
    value: boolean
  ) {
    try {
      setter(value);
    } catch {}
  }

  return {
    config,
    isSettingsSaving,
    error,
    handleSettingsSave,
    setConfig,
  };
}
