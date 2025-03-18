import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Button } from "../Button";
import { TestConnection, LoadConfig } from "../../../wailsjs/go/main/App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { ConnectionTab } from "./ConnectionTab";
import { LimitsTab } from "./LimitsTab";

type ThemeType = "light" | "dark" | "auto";

export interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
  language: string;
  theme: ThemeType;
  maxUploadRatio: number;
  slowSpeedLimit: number;
  slowSpeedUnit: "KiB/s" | "MiB/s";
}

type ConnectionStatusType = "success" | "error" | "none";

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
  margin: 0;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 4px 24px var(--modal-shadow);
  width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
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

const TabsContainer = styled.div`
  display: flex;
`;

const Sidebar = styled.div`
  width: 180px;
  border-right: 1px solid var(--border-color);
  background: var(--sidebar-background);
`;

const TabButton = styled.button<{ active: boolean }>`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: ${(props) =>
    props.active ? "var(--tab-active-background)" : "transparent"};
  color: ${(props) =>
    props.active ? "var(--tab-active-text)" : "var(--text-primary)"};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => !props.active && "var(--tab-hover-background)"};
  }
`;

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StatusMessage = styled.div<{ status: ConnectionStatusType }>`
  font-size: 13px;
  color: ${(props) =>
    props.status === "success" ? "var(--success-color)" : "var(--error-color)"};
`;

const defaultSettings: Config = {
  host: "localhost",
  port: 9091,
  username: "",
  password: "",
  language: "en",
  theme: "light",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

type TabType = "connection" | "limits";

export const Settings: React.FC<SettingsProps> = ({ onSave, onClose }) => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState<Config>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusType>("none");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("connection");

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          setSettings({
            ...defaultSettings,
            ...savedConfig,
            theme: (savedConfig.theme || "light") as ThemeType,
            slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as
              | "KiB/s"
              | "MiB/s",
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedSettings();
  }, []);

  const handleSettingsChange = (newSettings: Partial<Config>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
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

  const handleSave = () => {
    onSave(settings);
  };

  if (isLoading) {
    return (
      <Modal>
        <LoadingSpinner />
      </Modal>
    );
  }

  const tabs = [
    { id: "connection" as TabType, label: t("settings.tabConnection") },
    { id: "limits" as TabType, label: t("settings.tabLimits") },
  ];

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>{t("settings.title")}</h2>
        </ModalHeader>

        <TabsContainer>
          <Sidebar>
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </TabButton>
            ))}
          </Sidebar>

          <TabContent>
            {activeTab === "connection" && (
              <ConnectionTab
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            )}
            {activeTab === "limits" && (
              <LimitsTab
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            )}
          </TabContent>
        </TabsContainer>

        <Footer>
          <div>
            {connectionStatus !== "none" && (
              <StatusMessage status={connectionStatus}>
                {statusMessage}
              </StatusMessage>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="default" onClick={onClose}>
              {t("settings.cancel")}
            </Button>
            <Button
              variant="default"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection
                ? t("settings.testing")
                : t("settings.testConnection")}
            </Button>
            <Button variant="default" onClick={handleSave}>
              {t("settings.save")}
            </Button>
          </div>
        </Footer>
      </Modal>
    </>
  );
};
