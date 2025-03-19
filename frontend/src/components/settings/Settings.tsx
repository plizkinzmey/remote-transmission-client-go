import React, { useState, useEffect } from "react";
import {
  Dialog,
  Button as RadixButton,
  Tabs as RadixTabs,
  Flex,
  Text,
  Box,
} from "@radix-ui/themes";
import { TestConnection, LoadConfig } from "../../../wailsjs/go/main/App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { ConnectionTab } from "./ConnectionTab";
import { LimitsTab } from "./LimitsTab";
import { Portal } from "../Portal";

type ThemeType = "light" | "dark" | "auto";

export interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
  language: string;
  theme: ThemeType;
  maxUploadRatio: number;
  slowSpeedLimit: number;
  slowSpeedUnit: "KiB/s" | "MiB/s";
}

type ConnectionStatusType = "success" | "error" | "none";

interface SettingsProps {
  onSave: (settings: Config) => void;
  onClose: () => void;
}

const defaultSettings: Config = {
  host: "localhost",
  port: 9091,
  username: "",
  password: "",
  language: "en",
  theme: "light",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

type TabType = "connection" | "limits";

export const Settings: React.FC<SettingsProps> = ({ onSave, onClose }) => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState<Config>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusType>("none");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          setSettings({
            ...defaultSettings,
            ...savedConfig,
            theme: (savedConfig.theme || "light") as ThemeType,
            slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as
              | "KiB/s"
              | "MiB/s",
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedSettings();
  }, []);

  const handleSettingsChange = (newSettings: Partial<Config>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus("success");
      setStatusMessage(t("settings.connectionSuccess"));
    } catch (error) {
      setConnectionStatus("error");
      setStatusMessage(
        t(
          "settings.connectionFailed",
          String(error instanceof Error ? error.message : error)
        )
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = () => {
    onSave(settings);
  };

  if (isLoading) {
    return (
      <Portal>
        <Dialog.Root open>
          <Dialog.Content>
            <LoadingSpinner />
          </Dialog.Content>
        </Dialog.Root>
      </Portal>
    );
  }

  return (
    <Portal>
      <Dialog.Root open>
        <Dialog.Content style={{ maxWidth: 600 }}>
          <Dialog.Title>{t("settings.title")}</Dialog.Title>

          <Box mt="4">
            <RadixTabs.Root defaultValue="connection">
              <Flex direction="column" gap="3">
                <RadixTabs.List>
                  <RadixTabs.Trigger value="connection">
                    {t("settings.tabConnection")}
                  </RadixTabs.Trigger>
                  <RadixTabs.Trigger value="limits">
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

          <Flex justify="between" align="center" mt="4" gap="3">
            <Box>
              {connectionStatus !== "none" && (
                <Text
                  color={connectionStatus === "success" ? "green" : "red"}
                  size="2"
                >
                  {statusMessage}
                </Text>
              )}
            </Box>
            <Flex gap="3">
              <RadixButton variant="soft" onClick={onClose}>
                {t("settings.cancel")}
              </RadixButton>
              <RadixButton
                variant="soft"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection
                  ? t("settings.testing")
                  : t("settings.testConnection")}
              </RadixButton>
              <RadixButton variant="solid" onClick={handleSave}>
                {t("settings.save")}
              </RadixButton>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Portal>
  );
};
