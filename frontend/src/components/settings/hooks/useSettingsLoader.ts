import { useState, useEffect, useCallback } from "react";
import { LoadConfig } from "../../../../wailsjs/go/main/App";
import { ConnectionConfig } from "../../../App"; // Corrected import path

interface UseSettingsLoaderProps {
  isFirstStart?: boolean;
  defaultSettings: ConnectionConfig;
}

interface UseSettingsLoaderResult {
  settings: ConnectionConfig;
  isLoading: boolean;
  loadSavedSettings: () => Promise<void>;
  setSettings: React.Dispatch<React.SetStateAction<ConnectionConfig>>; // Expose setSettings
}

export const useSettingsLoader = ({
  isFirstStart,
  defaultSettings,
}: UseSettingsLoaderProps): UseSettingsLoaderResult => {
  const [settings, setSettings] = useState<ConnectionConfig>(defaultSettings);
  const [isLoading, setIsLoading] = useState(!isFirstStart);

  const loadSavedSettings = useCallback(async () => {
    if (isFirstStart) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true); // Set loading true when starting load
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
      } else {
        // If no saved config, keep default settings but ensure loading is false
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      // On error, keep default settings but ensure loading is false
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [isFirstStart, defaultSettings]); // Added defaultSettings dependency

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]); // Keep dependency on the memoized function

  return { settings, isLoading, loadSavedSettings, setSettings };
};
