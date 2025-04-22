import { useState, useEffect, useCallback } from "react";
import { LoadConfig } from "@wailsjs/go/main/App"; // Use alias
import { ConnectionConfig } from "@/App"; // Use alias

interface UseSettingsLoaderProps {
  isFirstStart?: boolean;
  defaultSettings: ConnectionConfig;
  onLoadSuccess?: (loadedSettings: ConnectionConfig) => void; // Optional callback
}

interface UseSettingsLoaderResult {
  settings: ConnectionConfig;
  isLoading: boolean;
  loadError: string | null; // Add state for load error
  loadSavedSettings: () => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<ConnectionConfig>>; // Expose setSettings
}

export const useSettingsLoader = ({
  isFirstStart,
  defaultSettings,
  onLoadSuccess,
}: UseSettingsLoaderProps): UseSettingsLoaderResult => {
  const [settings, setSettings] = useState<ConnectionConfig>(defaultSettings);
  const [isLoading, setIsLoading] = useState(!isFirstStart);
  const [loadError, setLoadError] = useState<string | null>(null); // Add state for load error

  const loadSavedSettings = useCallback(async () => {
    if (isFirstStart) {
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    setIsLoading(true); // Set loading true when starting load
    setLoadError(null); // Reset error on new load attempt
    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        const connectionSettings: ConnectionConfig = {
          host: savedConfig.host,
          port: savedConfig.port,
          username: savedConfig.username,
          password: savedConfig.password,
          maxUploadRatio: savedConfig.maxUploadRatio,
          slowSpeedLimit: savedConfig.slowSpeedLimit,
          slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as
            | "KiB/s"
            | "MiB/s",
        };
        setSettings(connectionSettings);
        if (onLoadSuccess) {
          onLoadSuccess(connectionSettings);
        }
      } else {
        // If no saved config, keep default settings but ensure loading is false
        setSettings(defaultSettings);
        if (onLoadSuccess) {
          onLoadSuccess(defaultSettings);
        }
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      setLoadError("errors.failedToLoadSettings"); // Set error state
      // On error, keep default settings but ensure loading is false
      setSettings(defaultSettings);
      if (onLoadSuccess) {
        onLoadSuccess(defaultSettings);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isFirstStart, defaultSettings, onLoadSuccess]); // Added defaultSettings and onLoadSuccess dependencies

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]); // Keep dependency on the memoized function

  return { settings, isLoading, loadError, loadSavedSettings, setSettings };
};
