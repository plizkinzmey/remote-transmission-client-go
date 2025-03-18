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

interface ConnectionTabProps {
  settings: Config;
  onSettingsChange: (changes: Partial<Config>) => void;
}

export const ConnectionTab: React.FC<ConnectionTabProps> = ({
  settings,
  onSettingsChange,
}) => {
  const { t } = useLocalization();

  return (
    <Container>
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
    </Container>
  );
};
