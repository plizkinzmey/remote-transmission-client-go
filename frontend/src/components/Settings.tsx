import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Button } from "./Button";
import { TestConnection, LoadConfig } from "../../wailsjs/go/main/App";
import { useLocalization } from "../contexts/LocalizationContext";
import { useTheme } from "../contexts/ThemeContext";
import { LoadingSpinner } from "./LoadingSpinner";

// Определяем псевдоним типа для темы
type ThemeType = "light" | "dark" | "auto";

// Создаем псевдоним для типа статуса соединения
type ConnectionStatusType = "success" | "error" | "none";

// Обновленный интерфейс с поддержкой "auto" темы
interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
  language: string;
  theme: ThemeType;
  maxUploadRatio?: number;
}

interface SettingsProps {
  onSave: (settings: Config) => void;
  onClose: () => void;
}

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--card-background);
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--modal-shadow);
  width: 400px;
  z-index: 1000;
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
`;

const ModalHeader = styled.div`
  background: var(--header-background);
  padding: 12px 16px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  user-select: none;
  h2 {
    color: var(--header-text);
    font-size: 16px;
    margin: 0;
    font-weight: 500;
    font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      Helvetica, Arial, sans-serif;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 14px;
  color: var(--text-primary);
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center; // Меняем с flex-end на center
  gap: 8px;
  margin-top: 16px;
`;

// Улучшаем стили для сообщений о статусе соединения
const StatusMessage = styled.div<{ status: ConnectionStatusType }>`
  padding: 8px;
  margin-top: 16px;
  border-radius: 4px;
  font-size: 14px;
  color: ${(props) => getStatusColor(props.status, "text")};
  background-color: ${(props) => getStatusColor(props.status, "bg")};
  display: ${(props) => (props.status === "none" ? "none" : "block")};
`;

// Вспомогательная функция для определения цветов статуса
function getStatusColor(
  status: ConnectionStatusType,
  type: "text" | "bg"
): string {
  if (status === "success") {
    return type === "text" ? "#27ae60" : "#e8f8f5";
  }
  if (status === "error") {
    return type === "text" ? "#e74c3c" : "#fdedec";
  }
  return "transparent";
}

const defaultSettings = {
  host: "localhost",
  port: 9091,
  username: "",
  password: "",
  language: "en",
  theme: "light",
  maxUploadRatio: 0,
};

const Description = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
`;

export const Settings: React.FC<SettingsProps> = ({ onSave, onClose }) => {
  const {
    t,
    currentLanguage,
    availableLanguages,
    isLoading: isLocalizationLoading,
  } = useLocalization();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Config>({
    ...defaultSettings,
    language: currentLanguage,
    theme: theme as ThemeType,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusType>("none");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          setSettings({
            ...savedConfig,
            language: savedConfig.language || currentLanguage,
            theme: (savedConfig.theme as ThemeType) || (theme as ThemeType),
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSettings();
  }, [currentLanguage, theme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Если тема изменилась, применяем новую тему
    if (settings.theme !== theme) {
      setTheme(settings.theme);
    }

    // Сохраняем настройки и закрываем форму
    onSave(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus("success");
      setStatusMessage(t("settings.connectionSuccess"));
    } catch (error) {
      setConnectionStatus("error");
      setStatusMessage(
        t(
          "settings.connectionFailed",
          String(error instanceof Error ? error.message : error)
        )
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading || isLocalizationLoading) {
    return (
      <Modal>
        <ModalContent>
          <LoadingSpinner />
        </ModalContent>
      </Modal>
    );
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>{t("settings.title")}</h2>
        </ModalHeader>
        <ModalContent>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>{t("settings.host")}</Label>
              <Input
                type="text"
                value={settings.host}
                onChange={(e) =>
                  setSettings({ ...settings, host: e.target.value })
                }
                placeholder="localhost"
              />
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.port")}</Label>
              <Input
                type="number"
                value={settings.port}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    port: parseInt(e.target.value, 10),
                  })
                }
                placeholder="9091"
              />
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.username")}</Label>
              <Input
                type="text"
                value={settings.username}
                onChange={(e) =>
                  setSettings({ ...settings, username: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.password")}</Label>
              <Input
                type="password"
                value={settings.password}
                onChange={(e) =>
                  setSettings({ ...settings, password: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.language")}</Label>
              <Select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.theme")}</Label>
              <Select
                value={settings.theme}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    theme: e.target.value as ThemeType,
                  })
                }
              >
                <option value="light">{t("settings.themeLight")}</option>
                <option value="dark">{t("settings.themeDark")}</option>
                <option value="auto">{t("settings.themeAuto")}</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>{t("settings.maxUploadRatio")}</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                name="maxUploadRatio"
                value={settings.maxUploadRatio ?? 0}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxUploadRatio: parseFloat(e.target.value) ?? 0,
                  })
                }
                placeholder={t("settings.maxUploadRatioHint")}
              />
              <Description>{t("settings.maxUploadRatioHint")}</Description>
            </FormGroup>
            <StatusMessage status={connectionStatus}>
              {statusMessage}
            </StatusMessage>
            <ButtonGroup>
              <Button type="button" onClick={onClose}>
                {t("settings.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection
                  ? t("settings.testing")
                  : t("settings.testConnection")}
              </Button>
              <Button type="submit">{t("settings.save")}</Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};
