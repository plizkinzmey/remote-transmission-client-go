import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../../contexts/LocalizationContext";
import type { Config } from "./Settings";

const Container = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-background);
  color: var(--text-primary);
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 13px;
  background: var(--input-background);
  color: var(--text-primary);
`;

const Description = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
`;

interface LimitsTabProps {
  settings: Config;
  onSettingsChange: (changes: Partial<Config>) => void;
}

export const LimitsTab: React.FC<LimitsTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Container>
      <FormGroup>
        <Label>{t("settings.slowSpeedLimit")}</Label>
        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            type="number"
            min="1"
            value={settings.slowSpeedLimit}
            style={{ flex: 1 }}
            onChange={(e) =>
              onSettingsChange({
                slowSpeedLimit: parseInt(e.target.value, 10) || 1,
              })
            }
          />
          <Select
            value={settings.slowSpeedUnit}
            style={{ width: "80px" }}
            onChange={(e) =>
              onSettingsChange({
                slowSpeedUnit: e.target.value as "KiB/s" | "MiB/s",
              })
            }
          >
            <option value="KiB/s">KiB/s</option>
            <option value="MiB/s">MiB/s</option>
          </Select>
        </div>
        <Description>{t("settings.slowSpeedLimitHint")}</Description>
      </FormGroup>

      <FormGroup>
        <Label>{t("settings.maxUploadRatio")}</Label>
        <Input
          type="number"
          min="0"
          step="0.1"
          value={settings.maxUploadRatio}
          onChange={(e) =>
            onSettingsChange({
              maxUploadRatio: parseFloat(e.target.value) || 0,
            })
          }
        />
        <Description>{t("settings.maxUploadRatioHint")}</Description>
      </FormGroup>
    </Container>
  );
};
