import { useCallback, useState } from "react";
import { SaveAllSettings } from "@wailsjs/go/main/App"; // Use alias
import { useLocalization } from "@contexts/LocalizationContext"; // Use alias
import { ConnectionConfig } from "@app/App";
import { PathChanges } from "@app/types/settings"; // Исправлен импорт с @types/settings на @app/types/settings
import { PathsTabRef } from "@components/Settings/PathsTab"; // Use path alias

// Добавим типы для улучшения читаемости и безопасности
type SaveResult = {
  success: boolean;
  error?: Error | string;
};

interface UseSettingsSaverProps {
  settings: ConnectionConfig;
  validateSettings: () => boolean;
  onSaveSuccess: () => void; // Callback for successful save
  onSaveError: (error: Error | string) => void; // Callback for save error
  onConnectionInitNeeded: () => Promise<boolean>; // Callback to try initializing connection
  pathsTabRef: React.RefObject<PathsTabRef>;
  hasPendingPathsChanges: boolean;
  isFirstStart?: boolean;
  currentLanguage: string;
  initialLanguage: string;
}

interface UseSettingsSaverResult {
  isSaving: boolean;
  handleSave: () => Promise<void>;
  resetChanges: () => void; // Add resetChanges to the result type
}

export const useSettingsSaver = ({
  settings,
  validateSettings,
  onSaveSuccess,
  onSaveError,
  onConnectionInitNeeded,
  pathsTabRef,
  hasPendingPathsChanges,
  isFirstStart,
  currentLanguage,
  initialLanguage,
}: UseSettingsSaverProps): UseSettingsSaverResult => {
  const { t } = useLocalization();
  const [isSaving, setIsSaving] = useState(false);

  // Выносим логику сохранения в отдельную функцию
  const executeSave = async (pathChanges: PathChanges): Promise<SaveResult> => {
    try {
      await SaveAllSettings(settings, pathChanges);
      return { success: true };
    } catch (error) {
      const errorStr = String(error);

      if (errorStr.includes("service not initialized")) {
        try {
          const success = await onConnectionInitNeeded();
          if (!success) {
            return {
              success: false,
              error: t("errors.failedToInitializeConnection", {
                0: "Connection initialization failed",
              }),
            };
          }
          // Повторная попытка сохранения после успешной инициализации
          await SaveAllSettings(settings, pathChanges);
          return { success: true };
        } catch (initError) {
          return {
            success: false,
            error: t("errors.failedToInitializeConnection", {
              0: String(initError),
            }),
          };
        }
      }

      return {
        success: false,
        error: t("errors.failedToUpdateSettings", { 0: errorStr }),
      };
    }
  };

  // Выносим логику сборки изменений путей
  const getPathChanges = useCallback((): PathChanges => {
    if (!hasPendingPathsChanges || !pathsTabRef.current) {
      return {
        pathsToAdd: [],
        pathsToRemove: [],
        defaultPath: null,
      };
    }

    const changes = pathsTabRef.current.getPathChanges();
    return {
      pathsToAdd: changes.pathsToAdd || [],
      pathsToRemove: changes.pathsToRemove || [],
      defaultPath: changes.defaultPath || null,
    };
  }, [hasPendingPathsChanges, pathsTabRef]);

  const handleSave = useCallback(async () => {
    if (!validateSettings()) {
      return;
    }

    setIsSaving(true);
    try {
      if (isFirstStart) {
        const success = await onConnectionInitNeeded();
        if (success) {
          onSaveSuccess();
        }
      } else {
        const pathChanges = getPathChanges();
        const result = await executeSave(pathChanges);

        if (result.success) {
          onSaveSuccess();
        } else if (result.error) {
          onSaveError(result.error);
        }
      }
    } catch (error) {
      onSaveError(t("errors.failedToUpdateSettings", { 0: String(error) }));
    } finally {
      setIsSaving(false);
    }
  }, [
    validateSettings,
    settings,
    onSaveSuccess,
    onSaveError,
    onConnectionInitNeeded,
    t,
    isFirstStart,
    currentLanguage,
    initialLanguage,
    getPathChanges,
  ]);

  const resetChanges = useCallback(() => {
    setIsSaving(false);
  }, []);

  return { isSaving, handleSave, resetChanges };
};
