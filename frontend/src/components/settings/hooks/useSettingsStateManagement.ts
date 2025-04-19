import { useState, useCallback } from "react";
import { ConnectionConfig } from "@app/App"; // Use path alias
import { useLocalization } from "@contexts/LocalizationContext"; // Use path alias

interface UseSettingsStateManagementProps {
  initialSettings: ConnectionConfig;
}

interface ValidationErrors {
  [key: string]: string;
}

interface UseSettingsStateManagementResult {
  settings: ConnectionConfig;
  errors: ValidationErrors;
  handleSettingsChange: (changes: Partial<ConnectionConfig>) => void;
  validateSettings: () => boolean;
  updateSettings: (newSettings: ConnectionConfig) => void;
  setSettingsDirectly: (newSettings: ConnectionConfig) => void; // Алиас для обратной совместимости
  resetErrors: () => void; // Добавляем новый метод
}

export const useSettingsStateManagement = ({
  initialSettings,
}: UseSettingsStateManagementProps): UseSettingsStateManagementResult => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState<ConnectionConfig>(initialSettings);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleSettingsChange = useCallback(
    (newSettings: Partial<ConnectionConfig>) => {
      setSettings((prev: ConnectionConfig) => ({ ...prev, ...newSettings })); // Added type for prev
      // Optionally clear errors related to changed fields
      if (Object.keys(newSettings).some((key) => errors[key])) {
        const currentErrors = { ...errors };
        Object.keys(newSettings).forEach((key) => {
          delete currentErrors[key];
        });
        setErrors(currentErrors);
      }
    },
    [errors] // Add errors dependency if clearing errors
  );

  const validateSettings = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!settings.host) {
      newErrors.host = t("settings.hostRequired");
    }

    if (
      settings.port !== undefined &&
      (settings.port < 1 || settings.port > 65535)
    ) {
      newErrors.port = t("settings.invalidPort");
    }

    if (settings.maxUploadRatio < 0) {
      newErrors.maxUploadRatio = t("settings.invalidRatio");
    }

    if (settings.slowSpeedLimit < 0) {
      newErrors.slowSpeedLimit = t("settings.invalidSpeed");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [settings, t]);

  const resetErrors = useCallback(() => {
    setErrors({});
  }, []);

  const updateSettings = useCallback((newSettings: ConnectionConfig) => {
    setSettings(newSettings);
    setErrors({});
  }, []);

  return {
    settings,
    errors,
    handleSettingsChange,
    validateSettings,
    updateSettings,
    setSettingsDirectly: updateSettings, // Алиас для обратной совместимости
    resetErrors,
  };
};
