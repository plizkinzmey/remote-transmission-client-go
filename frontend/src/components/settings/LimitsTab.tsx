import React from "react";
import { TextField, Select, Flex, Text, Grid } from "@radix-ui/themes";
import { Config } from "./Settings";
import { useLocalization } from "../../contexts/LocalizationContext";

interface LimitsTabProps {
  settings: Config;
  onSettingsChange: (newSettings: Partial<Config>) => void;
}

export const LimitsTab: React.FC<LimitsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Grid columns="1" gap="3">
      <Flex direction="column" gap="2">
        <Text as="label" size="2" weight="medium">
          {t("settings.maxUploadRatio")}
        </Text>
        <TextField.Root
          size="2"
          type="number"
          placeholder={t("settings.maxUploadRatioPlaceholder")}
          value={settings.maxUploadRatio}
          onChange={(e) =>
            onSettingsChange({
              maxUploadRatio: parseFloat(e.target.value) || 0,
            })
          }
        />
      </Flex>

      <Flex align="end" gap="3">
        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          <Text as="label" size="2" weight="medium">
            {t("settings.slowSpeedLimit")}
          </Text>
          <TextField.Root
            size="2"
            type="number"
            placeholder={t("settings.slowSpeedLimitPlaceholder")}
            value={settings.slowSpeedLimit}
            onChange={(e) =>
              onSettingsChange({
                slowSpeedLimit: parseInt(e.target.value) || 0,
              })
            }
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="2" weight="medium">
            {t("settings.slowSpeedUnit")}
          </Text>
          <Select.Root
            value={settings.slowSpeedUnit}
            onValueChange={(value) =>
              onSettingsChange({ slowSpeedUnit: value as "KiB/s" | "MiB/s" })
            }
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Group>
                <Select.Item value="KiB/s">KiB/s</Select.Item>
                <Select.Item value="MiB/s">MiB/s</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>
    </Grid>
  );
};
