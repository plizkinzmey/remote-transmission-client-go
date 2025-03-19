import React from "react";
import { TextField, Flex, Text, Grid } from "@radix-ui/themes";
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
        <Text as="label" size="2" weight="medium">
          {t("settings.host")}
        </Text>
        <TextField.Root
          size="2"
          placeholder={t("settings.hostPlaceholder")}
          value={settings.host}
          onChange={(e) => onSettingsChange({ host: e.target.value })}
        />
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="2" weight="medium">
          {t("settings.port")}
        </Text>
        <TextField.Root
          type="number"
          size="2"
          placeholder={t("settings.portPlaceholder")}
          value={settings.port}
          onChange={(e) =>
            onSettingsChange({ port: parseInt(e.target.value) || 0 })
          }
        />
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="2" weight="medium">
          {t("settings.username")}
        </Text>
        <TextField.Root
          size="2"
          placeholder={t("settings.usernamePlaceholder")}
          value={settings.username}
          onChange={(e) => onSettingsChange({ username: e.target.value })}
        />
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="2" weight="medium">
          {t("settings.password")}
        </Text>
        <TextField.Root
          type="password"
          size="2"
          placeholder={t("settings.passwordPlaceholder")}
          value={settings.password}
          onChange={(e) => onSettingsChange({ password: e.target.value })}
        />
      </Flex>
    </Grid>
  );
};
