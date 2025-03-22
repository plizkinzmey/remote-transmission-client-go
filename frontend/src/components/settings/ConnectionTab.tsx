import React, { useState } from "react";
import { TextField, Flex, Text, Grid, Box, Button } from "@radix-ui/themes";
import { ConnectionConfig } from "../../App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { TestConnection } from "../../../wailsjs/go/main/App";

interface ConnectionTabProps {
  settings: ConnectionConfig;
  onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void;
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "success" | "error" | "none"
  >("none");
  const [statusMessage, setStatusMessage] = useState("");

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus("success");
      setStatusMessage(t("settings.testSuccess"));
    } catch (error) {
      setConnectionStatus("error");
      setStatusMessage(t("settings.testError"));
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Grid columns="1" gap="3">
      <Flex direction="column" gap="2">
        <Flex gap="2" align="start">
          <Box style={{ width: "300px" }}>
            <Text as="label" size="1" weight="medium">
              {t("settings.host")}
            </Text>
            <TextField.Root
              size="1"
              placeholder={t("settings.hostPlaceholder")}
              value={settings.host}
              onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
          </Box>
          <Box style={{ width: "100px" }}>
            <Text as="label" size="1" weight="medium">
              {t("settings.port")}
            </Text>
            <TextField.Root
              type="number"
              size="1"
              value={settings.port ?? ""}
              placeholder={t("settings.portPlaceholder")}
              onChange={(e) =>
                onSettingsChange({
                  port: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </Box>
        </Flex>
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.username")}
        </Text>
        <Box style={{ maxWidth: "250px" }}>
          <TextField.Root
            size="1"
            placeholder={t("settings.usernamePlaceholder")}
            value={settings.username}
            onChange={(e) => onSettingsChange({ username: e.target.value })}
          />
        </Box>
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.password")}
        </Text>
        <Box style={{ maxWidth: "250px" }}>
          <TextField.Root
            type="password"
            size="1"
            placeholder={t("settings.passwordPlaceholder")}
            value={settings.password}
            onChange={(e) => onSettingsChange({ password: e.target.value })}
          />
        </Box>
      </Flex>

      <Flex align="center" gap="3" mt="2">
        <Button
          size="1"
          variant="soft"
          onClick={handleTestConnection}
          disabled={isTestingConnection}
        >
          {isTestingConnection
            ? t("settings.testing")
            : t("settings.testConnection")}
        </Button>

        {connectionStatus !== "none" && (
          <Text
            size="1"
            color={connectionStatus === "success" ? "green" : "red"}
          >
            {statusMessage}
          </Text>
        )}
      </Flex>
    </Grid>
  );
};
