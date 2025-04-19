import { useState, useCallback } from "react";
import { SaveAllSettings } from "../../../../wailsjs/go/main/App"; // Corrected wailsjs path (relative)
import { ConnectionConfig } from "@app/App";
import { PathChanges } from "@app/types/settings"; // Исправлен импорт с @types/settings на @app/types/settings
import { PathsTabRef } from "@components/Settings/PathsTab"; // Use path alias
import { useLocalization } from "@contexts/LocalizationContext"; // Use path alias

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

  const handleSave = useCallback(async () => {
    if (!validateSettings()) {
      return;
    }

    setIsSaving(true);
    try {
      // Always use onConnectionInitNeeded for the first start scenario
      if (isFirstStart) {
        console.log(
          `First start save initiated. Language changed: ${
            currentLanguage !== initialLanguage
          }`
        );
        // Assuming onConnectionInitNeeded handles the initial save/connection attempt
        const success = await onConnectionInitNeeded(); // This maps to props.onSave in Settings
        if (success) {
          onSaveSuccess(); // This maps to props.onClose in Settings
        }
        // Error handling is likely managed within onConnectionInitNeeded (props.onSave) or its caller
      } else {
        // Normal save logic for subsequent saves
        let pathChanges: PathChanges = {
          pathsToAdd: [],
          pathsToRemove: [],
          defaultPath: null, // Match the type definition (string | null)
        };

        if (hasPendingPathsChanges && pathsTabRef.current) {
          const changes = pathsTabRef.current.getPathChanges();
          pathChanges = {
            pathsToAdd: changes.pathsToAdd || [],
            pathsToRemove: changes.pathsToRemove || [],
            // Ensure defaultPath is null if not provided or empty
            defaultPath: changes.defaultPath || null,
          };
          console.log("Saving path changes:", pathChanges);
        }

        try {
          await SaveAllSettings(settings, pathChanges);
          onSaveSuccess(); // Call success callback (e.g., close dialog)
        } catch (error) {
          console.error("Failed to save settings:", error);
          const errorStr = String(error);

          if (errorStr.includes("service not initialized")) {
            try {
              const success = await onConnectionInitNeeded();
              if (success) {
                // Retry saving after successful initialization
                await SaveAllSettings(settings, pathChanges);
                onSaveSuccess();
                return; // Exit after successful retry
              }
              // If init failed, the error should be handled by the caller of onConnectionInitNeeded
            } catch (initError) {
              console.error("Failed to initialize connection:", initError);
              onSaveError(
                t("errors.failedToInitializeConnection", {
                  0: String(initError),
                })
              );
            }
          } else {
            onSaveError(t("errors.failedToUpdateSettings", { 0: errorStr }));
          }
          // Let the caller decide when to reset isSaving based on error display/handling
          setIsSaving(false); // Reset saving state only if error is handled here
          return; // Prevent falling through to finally if error occurred
        }
      }
    } catch (error) {
      console.error("Error during save process:", error);
      // Use a generic error message or handle specific errors if needed
      onSaveError(t("errors.failedToUpdateSettings", { 0: String(error) }));
      setIsSaving(false); // Ensure reset on general error
      return; // Prevent falling through
    } finally {
      // Always ensure isSaving is reset
      setIsSaving(false);
    }
  }, [
    validateSettings,
    settings,
    onSaveSuccess,
    onSaveError,
    onConnectionInitNeeded,
    t,
    isFirstStart, // Keep isFirstStart dependency
    currentLanguage, // Keep language dependencies
    initialLanguage,
    hasPendingPathsChanges,
    pathsTabRef,
    // isSaving removed previously
  ]);

  const resetChanges = useCallback(() => {
    setIsSaving(false);
    // Add any other state resets needed within this hook
  }, []); // Add dependencies if needed, likely none for just resetting isSaving

  return { isSaving, handleSave, resetChanges };
};
