import React from "react";
import { TextField, Flex, Text, Grid, Box } from "@radix-ui/themes";
import { Config } from "./Settings";
import { useLocalization } from "../../contexts/LocalizationContext";

interface ConnectionTabProps {
  settings: Config;
  onSettingsChange: (newSettings: Partial<Config>) => void;
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Grid columns="1" gap="3">
      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.host")}
        </Text>
        <Box style={{ maxWidth: "300px" }}>
          <TextField.Root
            size="1"
            placeholder={t("settings.hostPlaceholder")}
            value={settings.host}
            onChange={(e) => onSettingsChange({ host: e.target.value })}
          />
        </Box>
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.port")}
        </Text>
        <Box style={{ maxWidth: "100px" }}>
          <TextField.Root
            type="number"
            size="1"
            placeholder={t("settings.portPlaceholder")}
            value={settings.port}
            onChange={(e) =>
              onSettingsChange({ port: parseInt(e.target.value) || 0 })
            }
          />
        </Box>
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
    </Grid>
  );
};
