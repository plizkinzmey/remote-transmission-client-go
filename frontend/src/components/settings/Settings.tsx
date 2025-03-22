import React, { useState, useEffect } from "react";
import {
  Dialog,
  Button as RadixButton,
  Tabs as RadixTabs,
  Flex,
  Box,
} from "@radix-ui/themes";
import { LoadConfig } from "../../../wailsjs/go/main/App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { ConnectionTab } from "./ConnectionTab";
import { LimitsTab } from "./LimitsTab";
import { Portal } from "../Portal";
import { ConnectionConfig } from "../../App";

interface SettingsProps {
  onSave: (settings: ConnectionConfig) => void;
  onClose: () => void;
}

const defaultSettings: ConnectionConfig = {
  host: "",
  port: undefined,
  username: "",
  password: "",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

export const Settings: React.FC<SettingsProps> = ({ onSave, onClose }) => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState<ConnectionConfig>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSavedSettings = async () => {
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
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedSettings();
  }, []);

  const handleSettingsChange = (newSettings: Partial<ConnectionConfig>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  if (isLoading) {
    return (
      <Portal>
        <Dialog.Root open>
          <Dialog.Content style={{ maxWidth: 500 }}>
            <LoadingSpinner />
          </Dialog.Content>
        </Dialog.Root>
      </Portal>
    );
  }

  return (
    <Portal>
      <Dialog.Root open>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>{t("settings.title")}</Dialog.Title>

          <Box mt="4">
            <RadixTabs.Root defaultValue="connection">
              <Flex direction="column" gap="2">
                <RadixTabs.List>
                  <RadixTabs.Trigger
                    value="connection"
                    style={{
                      whiteSpace: "normal",
                      minHeight: "32px",
                      height: "auto",
                    }}
                  >
                    {t("settings.tabConnection")}
                  </RadixTabs.Trigger>
                  <RadixTabs.Trigger
                    value="limits"
                    style={{
                      whiteSpace: "normal",
                      minHeight: "32px",
                      height: "auto",
                    }}
                  >
                    {t("settings.tabLimits")}
                  </RadixTabs.Trigger>
                </RadixTabs.List>

                <RadixTabs.Content value="connection">
                  <ConnectionTab
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                  />
                </RadixTabs.Content>

                <RadixTabs.Content value="limits">
                  <LimitsTab
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                  />
                </RadixTabs.Content>
              </Flex>
            </RadixTabs.Root>
          </Box>

          <Flex justify="end" mt="4" gap="2">
            <RadixButton size="1" variant="soft" onClick={onClose}>
              {t("settings.cancel")}
            </RadixButton>
            <RadixButton size="1" variant="solid" onClick={handleSave}>
              {t("settings.save")}
            </RadixButton>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Portal>
  );
};
