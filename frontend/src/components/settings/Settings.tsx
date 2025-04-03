import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  Button as RadixButton,
  Tabs as RadixTabs,
  Flex,
  Box,
  Text,
} from "@radix-ui/themes";
import { LoadConfig, SaveAllSettings } from "../../../wailsjs/go/main/App";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { ConnectionTab } from "./ConnectionTab";
import { LimitsTab } from "./LimitsTab";
import { PathsTab, PathsTabRef } from "./PathsTab";
import { ConnectionConfig } from "../../App";
import { LanguageSelector } from "../LanguageSelector";

interface SettingsProps {
  onSave: (settings: ConnectionConfig) => Promise<boolean>;
  onClose: () => void;
  isFirstStart?: boolean;
}

const defaultSettings: ConnectionConfig = {
  host: "",
  port: 9091,
  username: "",
  password: "",
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

export const Settings: React.FC<SettingsProps> = ({
  onSave,
  onClose,
  isFirstStart = false,
}) => {
  const { t, currentLanguage, setLanguage } = useLocalization();
  const [settings, setSettings] = useState<ConnectionConfig>(defaultSettings);
  const [isLoading, setIsLoading] = useState(!isFirstStart);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [initialLanguage] = useState(currentLanguage); // Запоминаем начальный язык

  // Ссылка на компонент PathsTab для доступа к его методам
  const pathsTabRef = useRef<PathsTabRef>(null);
  const [hasPendingPathsChanges, setHasPendingPathsChanges] = useState(false);

  const loadSavedSettings = useCallback(async () => {
    if (isFirstStart) {
      setIsLoading(false);
      return;
    }

    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        const connectionSettings: ConnectionConfig = {
          host: savedConfig.host,
          port: savedConfig.port,
          username: savedConfig.username,
          password: savedConfig.password,
          maxUploadRatio: savedConfig.maxUploadRatio,
          slowSpeedLimit: savedConfig.slowSpeedLimit,
          slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as
            | "KiB/s"
            | "MiB/s",
        };
        setSettings(connectionSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isFirstStart]);

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]);

  const handleSettingsChange = useCallback(
    (newSettings: Partial<ConnectionConfig>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  const validateSettings = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!settings.host) {
      newErrors.host = t("settings.hostRequired");
    }

    if (
      settings.port !== undefined &&
      (settings.port < 1 || settings.port > 65535)
    ) {
      newErrors.port = t("settings.invalidPort");
    }

    if (settings.maxUploadRatio < 0) {
      newErrors.maxUploadRatio = t("settings.invalidRatio");
    }

    if (settings.slowSpeedLimit < 0) {
      newErrors.slowSpeedLimit = t("settings.invalidSpeed");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [settings, t]);

  const handleSave = useCallback(async () => {
    if (!validateSettings()) {
      return;
    }

    setIsSaving(true);
    try {
      // Проверяем, был ли изменен язык при первом запуске
      if (isFirstStart && currentLanguage !== initialLanguage) {
        console.log(
          `Language changed from ${initialLanguage} to ${currentLanguage} during first start`
        );
        // Особая логика для первого запуска с изменением языка
        // Сначала сохраняем настройки, затем переключаем язык обратно и потом устанавливаем язык через API
        const success = await onSave(settings);
        if (success) {
          onClose();
        }
      } else {
        // Получаем изменения путей, если есть
        let pathChanges = null;
        if (hasPendingPathsChanges && pathsTabRef.current) {
          const changes = pathsTabRef.current.getPathChanges();
          pathChanges = {
            pathsToAdd: changes.pathsToAdd || [],
            pathsToRemove: changes.pathsToRemove || [],
            defaultPath: changes.defaultPath || "",
          };
          console.log("Сохранение изменений путей:", pathChanges);
        } else {
          // Если изменений путей нет, передаем пустой объект вместо null
          pathChanges = {
            pathsToAdd: [],
            pathsToRemove: [],
            defaultPath: "",
          };
        }

        // Сохраняем все настройки в одной транзакции через новый метод
        try {
          await SaveAllSettings(settings, pathChanges);
          onClose();
        } catch (error) {
          console.error("Failed to save settings:", error);
          setErrors((prev) => ({
            ...prev,
            submit: t("settings.savingError"),
          }));
        }
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrors((prev) => ({
        ...prev,
        submit: t("settings.savingError"),
      }));
    } finally {
      setIsSaving(false);
    }
  }, [
    validateSettings,
    settings,
    onSave,
    onClose,
    t,
    isFirstStart,
    currentLanguage,
    initialLanguage,
    hasPendingPathsChanges,
    pathsTabRef,
  ]);

  const handleCancel = useCallback(() => {
    // Если есть ожидающие изменения в путях, сбрасываем их
    if (hasPendingPathsChanges && pathsTabRef.current) {
      pathsTabRef.current.resetChanges();
    }
    onClose();
  }, [hasPendingPathsChanges, onClose]);

  if (isLoading) {
    return (
      <Dialog.Root open>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <LoadingSpinner />
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) =>
        !open && !isFirstStart && !isSaving && handleCancel()
      }
    >
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Flex justify="between" align="center">
          <Dialog.Title>
            {isFirstStart ? t("settings.firstStartTitle") : t("settings.title")}
          </Dialog.Title>
          {/* Показываем селектор языка только при первичной настройке */}
          {isFirstStart && <LanguageSelector />}
        </Flex>

        {isFirstStart && (
          <Text as="p" size="2" mb="4" color="gray">
            {t("settings.firstStartMessage")}
          </Text>
        )}

        {errors.submit && (
          <Text as="p" size="2" mb="4" color="red">
            {errors.submit}
          </Text>
        )}

        <Box mt="4">
          <RadixTabs.Root defaultValue="connection">
            <Flex direction="column" gap="2">
              <RadixTabs.List>
                <RadixTabs.Trigger
                  value="connection"
                  style={{
                    whiteSpace: "normal",
                    minHeight: "32px",
                    height: "auto",
                  }}
                >
                  {t("settings.tabConnection")}
                </RadixTabs.Trigger>
                {!isFirstStart && (
                  <>
                    <RadixTabs.Trigger
                      value="limits"
                      style={{
                        whiteSpace: "normal",
                        minHeight: "32px",
                        height: "auto",
                      }}
                    >
                      {t("settings.tabLimits")}
                    </RadixTabs.Trigger>
                    <RadixTabs.Trigger
                      value="paths"
                      style={{
                        whiteSpace: "normal",
                        minHeight: "32px",
                        height: "auto",
                      }}
                    >
                      {t("settings.tabPaths")}
                    </RadixTabs.Trigger>
                  </>
                )}
              </RadixTabs.List>

              <RadixTabs.Content value="connection">
                <ConnectionTab
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  errors={errors}
                />
              </RadixTabs.Content>

              {!isFirstStart && (
                <>
                  <RadixTabs.Content value="limits">
                    <LimitsTab
                      settings={settings}
                      onSettingsChange={handleSettingsChange}
                      errors={errors}
                    />
                  </RadixTabs.Content>

                  <RadixTabs.Content value="paths">
                    <PathsTab
                      ref={pathsTabRef}
                      errors={errors}
                      onPathsChanged={setHasPendingPathsChanges}
                    />
                  </RadixTabs.Content>
                </>
              )}
            </Flex>
          </RadixTabs.Root>
        </Box>

        <Flex justify="end" mt="4" gap="2">
          {!isFirstStart && (
            <RadixButton
              size="1"
              variant="soft"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {t("settings.cancel")}
            </RadixButton>
          )}
          <RadixButton
            size="1"
            variant="solid"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t("settings.saving") : t("settings.save")}
          </RadixButton>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
