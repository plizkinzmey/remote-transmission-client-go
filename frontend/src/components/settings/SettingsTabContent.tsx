import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../../contexts/LocalizationContext";
import type { Config } from "./Settings";

const Container = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  font-size: 13px;
  color: var(--text-primary);
`;

const Input = styled.input`
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-background);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: var(--focus-border);
  }
`;

const Select = styled.select`
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-background);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: var(--focus-border);
  }
`;

const Description = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
`;

interface SettingsTabContentProps {
  settings: Config;
  onSettingsChange: (settings: Partial<Config>) => void;
}

export const ConnectionTab: React.FC<SettingsTabContentProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Container>
      <Section>
        <SectionTitle>{t("settings.connectionSettings")}</SectionTitle>
        <FormGroup>
          <Label>{t("settings.host")}</Label>
          <Input
            type="text"
            value={settings.host}
            onChange={(e) => onSettingsChange({ host: e.target.value })}
            placeholder="localhost"
          />
        </FormGroup>
        <FormGroup>
          <Label>{t("settings.port")}</Label>
          <Input
            type="number"
            value={settings.port}
            onChange={(e) =>
              onSettingsChange({ port: parseInt(e.target.value, 10) })
            }
            placeholder="9091"
          />
        </FormGroup>
        <FormGroup>
          <Label>{t("settings.username")}</Label>
          <Input
            type="text"
            value={settings.username}
            onChange={(e) => onSettingsChange({ username: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <Label>{t("settings.password")}</Label>
          <Input
            type="password"
            value={settings.password}
            onChange={(e) => onSettingsChange({ password: e.target.value })}
          />
        </FormGroup>
      </Section>
    </Container>
  );
};

export const LimitsTab: React.FC<SettingsTabContentProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Container>
      <Section>
        <SectionTitle>{t("settings.speedLimits")}</SectionTitle>
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
      </Section>

      <Section>
        <SectionTitle>{t("settings.ratioLimit")}</SectionTitle>
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
      </Section>
    </Container>
  );
};
