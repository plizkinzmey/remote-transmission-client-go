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

  // Обновляем внутреннее состояние конфига, если initialConfig изменился
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSettingsSave = useCallback(
    async (connectionSettings: ConnectionConfig): Promise<boolean> => {
      setIsSettingsSaving(true);
      setError(null);
      try {
        // Используем текущий язык и тему, если они есть, иначе значения по умолчанию
        const uiSettings: UIConfig = {
          language: config?.language || languageState || "en",
          theme: (config?.theme || "light") as "light" | "dark" | "auto",
        };

        const fullConfig: AppConfig = {
          ...connectionSettings, // Новые настройки соединения
          ...uiSettings, // Текущие или дефолтные настройки UI
        };

        // Вызываем колбэк для сохранения и переинициализации соединения
        const success = await onConfigSave(fullConfig);

        if (success) {
          setConfig(fullConfig); // Обновляем локальное состояние конфига при успехе
          return true;
        } else {
          // Ошибка будет установлена в onConfigSave (через useConnectionManager)
          setError(t("errors.failedToUpdateSettings", "Connection failed")); // Запасной текст ошибки
          return false;
        }
      } catch (saveError) {
        console.error("Failed to save settings:", saveError);
        setError(t("errors.failedToUpdateSettings", String(saveError)));
        return false;
      } finally {
        setIsSettingsSaving(false);
      }
    },
    [config, languageState, onConfigSave, t]
  );

  return {
    config,
    isSettingsSaving,
    error, // Ошибка сохранения настроек
    handleSettingsSave,
    setConfig, // Добавим возможность обновить конфиг извне (например, при смене темы/языка)
  };
}
