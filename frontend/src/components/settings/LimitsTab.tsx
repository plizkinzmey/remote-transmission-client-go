import React from "react";
import { TextField, Select, Flex, Text, Grid, Box } from "@radix-ui/themes";
import { ConnectionConfig } from "../../App";
import { useLocalization } from "../../contexts/LocalizationContext";

interface LimitsTabProps {
  settings: ConnectionConfig;
  onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void;
}

export const LimitsTab: React.FC<LimitsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  const handleMaxUploadRatioChange = (value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    onSettingsChange({ maxUploadRatio: numValue });
  };

  const handleSpeedLimitChange = (value: string) => {
    const numValue = value === "" ? 0 : parseInt(value);
    onSettingsChange({ slowSpeedLimit: numValue });
  };

  return (
    <Grid columns="1" gap="3">
      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.maxUploadRatio")}
        </Text>
        <Box style={{ maxWidth: "100px" }}>
          <TextField.Root
            size="1"
            type="number"
            placeholder="0"
            value={settings.maxUploadRatio || ""}
            onChange={(e) => handleMaxUploadRatioChange(e.target.value)}
          />
        </Box>
      </Flex>

      <Flex direction="column" gap="2">
        <Text as="label" size="1" weight="medium">
          {t("settings.slowSpeedLimit")}
        </Text>
        <Flex gap="2" align="start">
          <Box style={{ maxWidth: "100px" }}>
            <TextField.Root
              size="1"
              type="number"
              placeholder="0"
              value={settings.slowSpeedLimit || ""}
              onChange={(e) => handleSpeedLimitChange(e.target.value)}
            />
          </Box>
          <Box>
            <Select.Root
              size="1"
              value={settings.slowSpeedUnit}
              onValueChange={(value) =>
                onSettingsChange({ slowSpeedUnit: value as "KiB/s" | "MiB/s" })
              }
            >
              <Select.Trigger />
              <Select.Content>
                <Select.Group>
                  <Select.Item value="KiB/s">{t("settings.KiB/s")}</Select.Item>
                  <Select.Item value="MiB/s">{t("settings.MiB/s")}</Select.Item>
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>
        <Text size="1" color="gray">
          {t("settings.slowSpeedLimitHint")}
        </Text>
      </Flex>
    </Grid>
  );
};
