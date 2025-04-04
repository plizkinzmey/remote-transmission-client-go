import React, { useState, useEffect } from "react";
import { TextField, Flex, Text, Grid, Box, Button } from "@radix-ui/themes";
import { ConnectionConfig } from "../../App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { TestConnection } from "../../../wailsjs/go/main/App";
import StatusMessage, { StatusType } from "../StatusMessage";

interface ConnectionTabProps {
  settings: ConnectionConfig;
  onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void;
  onConnectionTest?: (success: boolean, errorMessage?: string) => void;
  errors?: { [key: string]: string };
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({
  settings,
  onSettingsChange,
  onConnectionTest,
  errors = {},
}) => {
  const { t } = useLocalization();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>("none");
  const [statusMessage, setStatusMessage] = useState("");

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus("success");
      setStatusMessage(t("settings.testSuccess"));
      // Уведомляем родительский компонент об успешном подключении
      if (onConnectionTest) {
        onConnectionTest(true);
      }
    } catch (error) {
      setConnectionStatus("error");
      let errorMessage = t("settings.testError");

      // Проверяем, содержит ли ошибка информацию об аутентификации
      const errorStr = String(error);
      if (errorStr.includes("errors.connectionAuthRequired")) {
        errorMessage = t("errors.connectionAuthRequired");
      } else if (errorStr.includes("connection refused")) {
        errorMessage = t("errors.connectionRefused");
      } else if (errorStr.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      }

      setStatusMessage(errorMessage);
      // Уведомляем родительский компонент о неудачном подключении
      if (onConnectionTest) {
        onConnectionTest(false, errorMessage);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Сбрасываем статус соединения при изменении настроек
  useEffect(() => {
    setConnectionStatus("none");
    setStatusMessage("");
    if (onConnectionTest) {
      onConnectionTest(false);
    }
  }, [settings.host, settings.port, settings.username, settings.password]);

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
              color={errors.host ? "red" : undefined}
            />
            {errors.host && (
              <Text size="1" color="red">
                {errors.host}
              </Text>
            )}
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
              color={errors.port ? "red" : undefined}
            />
            {errors.port && (
              <Text size="1" color="red">
                {errors.port}
              </Text>
            )}
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

      <Flex direction="column" gap="2">
        <Box>
          <Button
            size="1"
            variant="soft"
            onClick={handleTestConnection}
            disabled={isTestingConnection || !settings.host}
          >
            {isTestingConnection
              ? t("settings.testing")
              : t("settings.testConnection")}
          </Button>
        </Box>
        {/* Удаляем блок отображения сообщений об ошибках - теперь они будут только вверху формы */}
      </Flex>
    </Grid>
  );
};
