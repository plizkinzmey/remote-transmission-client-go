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
      // Handle first start language change separately if needed (or simplify if logic is the same)
      if (isFirstStart && currentLanguage !== initialLanguage) {
        console.log(
          `Language changed from ${initialLanguage} to ${currentLanguage} during first start`
        );
        // Assuming onConnectionInitNeeded handles the initial save/connection attempt
        const success = await onConnectionInitNeeded();
        if (success) {
          onSaveSuccess(); // Close dialog on success
        }
        // Error handling is likely managed within onConnectionInitNeeded or its caller
      } else {
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
      console.error("Error saving settings:", error);
      onSaveError(t("errors.failedToUpdateSettings", { 0: String(error) }));
      // Also set saving to false here in case of general catch
      setIsSaving(false);
      return; // Prevent falling through to finally
    } finally {
      // Always ensure isSaving is reset when the function completes execution
      // The checks within try/catch handle specific scenarios, this is the final guarantee.
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
    hasPendingPathsChanges,
    pathsTabRef,
    // Removed isSaving from dependencies as it caused potential issues with the finally block logic
  ]);

  return { isSaving, handleSave };
};
