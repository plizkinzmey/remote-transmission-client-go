import React from "react";
import { TextField, Select, Flex, Text, Grid, Box } from "@radix-ui/themes";
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
        <Text as="label" size="1" weight="medium">
          {t("settings.maxUploadRatio")}
        </Text>
        <Box style={{ maxWidth: "100px" }}>
          <TextField.Root
            size="1"
            type="number"
            placeholder="0"
            value={settings.maxUploadRatio}
            onChange={(e) =>
              onSettingsChange({
                maxUploadRatio: parseFloat(e.target.value) || 0,
              })
            }
          />
        </Box>
        <Text size="1" color="gray">
          {t("settings.maxUploadRatioHint")}
        </Text>
      </Flex>

      <Flex align="end" gap="3">
        <Flex direction="column" gap="2" style={{ flex: 1 }}>
          <Text as="label" size="1" weight="medium">
            {t("settings.slowSpeedLimit")}
          </Text>
          <Box style={{ maxWidth: "100px" }}>
            <TextField.Root
              size="1"
              type="number"
              value={settings.slowSpeedLimit}
              onChange={(e) =>
                onSettingsChange({
                  slowSpeedLimit: parseInt(e.target.value) || 0,
                })
              }
            />
          </Box>
          <Text size="1" color="gray">
            {t("settings.slowSpeedLimitHint")}
          </Text>
        </Flex>

        <Flex direction="column" gap="2">
          <Text as="label" size="1" weight="medium">
            {t("settings.slowSpeedUnit")}
          </Text>
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
        </Flex>
      </Flex>
    </Grid>
  );
};
