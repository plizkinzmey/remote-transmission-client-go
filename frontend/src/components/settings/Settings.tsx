import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  Button as RadixButton,
  Tabs as RadixTabs,
  Flex,
  Box,
  Text,
} from '@radix-ui/themes';
import { useLocalization } from '../../contexts/LocalizationContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { ConnectionTab } from './ConnectionTab';
import { LimitsTab } from './LimitsTab';
import { PathsTab, PathsTabRef } from './PathsTab';
import { ConnectionConfig } from '../../App';
import { LanguageSelector } from '../LanguageSelector';
import StatusMessage from '../StatusMessage';
import { useSettingsLoader } from './hooks/useSettingsLoader';
import { useSettingsSaver } from './hooks/useSettingsSaver';
import { useConnectionTester } from './hooks/useConnectionTester';
import { useSettingsStateManagement } from './hooks/useSettingsStateManagement';
import styles from './Settings.module.css'; // Import CSS module

/**
 * @interface SettingsProps
 * @description Props for the Settings component.
 * @property {function(settings: ConnectionConfig): Promise<boolean>} onSave - Callback function triggered when settings need to be saved (especially for initial connection). Returns a promise indicating success.
 * @property {function(): void} onClose - Callback function triggered when the settings dialog should be closed.
 * @property {boolean} [isFirstStart=false] - Flag indicating if this is the first time the application is started, requiring initial setup.
 */
export interface SettingsProps {
  onSave: (settings: ConnectionConfig) => Promise<boolean>;
  onClose: () => void;
  isFirstStart?: boolean;
}

// Default settings remain the same
const defaultSettings: ConnectionConfig = {
  host: '',
  port: 9091,
  username: '',
  password: '',
  maxUploadRatio: 0,
  slowSpeedLimit: 50,
  slowSpeedUnit: 'KiB/s',
};

/**
 * @component Settings
 * @description A dialog component for configuring application settings, including connection, limits, and paths.
 * It handles loading existing settings, validating user input, testing the connection, and saving changes.
 * It adapts its behavior for the first application start.
 * @param {SettingsProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered Settings dialog component.
 */
export const Settings: React.FC<SettingsProps> = ({ onSave, onClose, isFirstStart = false }) => {
  const { t, currentLanguage } = useLocalization();
  const [initialLanguage] = useState(currentLanguage);

  const {
    settings,
    errors,
    handleSettingsChange,
    validateSettings,
    resetErrors,
    setSettingsDirectly,
  } = useSettingsStateManagement({ initialSettings: defaultSettings });

  const { isLoading } = useSettingsLoader({
    isFirstStart,
    defaultSettings,
  });

  const {
    isConnectionValid,
    connectionErrorMessage,
    handleConnectionTestResult,
    resetConnectionTest,
  } = useConnectionTester();

  const pathsTabRef = useRef<PathsTabRef>(null);
  const [hasPendingPathsChanges, setHasPendingPathsChanges] = useState(false);

  const { isSaving, handleSave } = useSettingsSaver({
    settings,
    validateSettings,
    onSaveSuccess: onClose,
    onSaveError: (errorMsg) => {
      handleConnectionTestResult(false, String(errorMsg));
    },
    onConnectionInitNeeded: async () => {
      try {
        resetConnectionTest();
        const success = await onSave(settings);
        handleConnectionTestResult(success, success ? undefined : t('errors.failedToInitializeConnection', { 0: 'Initialization failed' }));
        return success;
      } catch (initError) {
        console.error("Failed to initialize connection via onSave:", initError);
        handleConnectionTestResult(false, t('errors.failedToInitializeConnection', { 0: String(initError) }));
        return false;
      }
    },
    pathsTabRef,
    hasPendingPathsChanges,
    isFirstStart,
    currentLanguage,
    initialLanguage,
  });

  const [localSettings, setLocalSettings] = useState<ConnectionConfig>(defaultSettings);
  const [localIsLoading, setLocalIsLoading] = useState(!isFirstStart);

  const loadSavedSettings = useCallback(async () => {
    if (isFirstStart) {
      setLocalIsLoading(false);
      setSettingsDirectly(defaultSettings);
      return;
    }
    setLocalIsLoading(true);
    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        const loadedConfig: ConnectionConfig = {
          host: savedConfig.host,
          port: savedConfig.port,
          username: savedConfig.username,
          password: savedConfig.password,
          maxUploadRatio: savedConfig.maxUploadRatio,
          slowSpeedLimit: savedConfig.slowSpeedLimit,
          slowSpeedUnit: (savedConfig.slowSpeedUnit || 'KiB/s') as 'KiB/s' | 'MiB/s',
        };
        setSettingsDirectly(loadedConfig);
        setLocalSettings(loadedConfig);
      } else {
        setSettingsDirectly(defaultSettings);
        setLocalSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettingsDirectly(defaultSettings);
      setLocalSettings(defaultSettings);
    } finally {
      setLocalIsLoading(false);
    }
  }, [isFirstStart, setSettingsDirectly, defaultSettings]);

  useEffect(() => {
    loadSavedSettings();
  }, [loadSavedSettings]);

  const handleCancel = useCallback(() => {
    resetErrors();
    resetConnectionTest();
    if (hasPendingPathsChanges && pathsTabRef.current) {
      pathsTabRef.current.resetChanges();
      setHasPendingPathsChanges(false);
    }
    onClose();
  }, [hasPendingPathsChanges, onClose, resetErrors, resetConnectionTest]);

  if (localIsLoading) {
    return (
      <Dialog.Root open>
        <Dialog.Content style={{ maxWidth: 500 }} data-testid="settings-loading">
          <LoadingSpinner />
        </Dialog.Content>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) {
          handleCancel();
        }
        return !(isFirstStart || isSaving);
      }}
      data-testid="settings-modal"
    >
      <Dialog.Content
        style={{ maxWidth: 500 }}
        onPointerDownOutside={(e) => {
          if (isSaving || isFirstStart) {
            e.preventDefault();
          }
        }}
      >
        <Flex justify="between" align="center">
          <Dialog.Title data-testid="settings-title">
            {isFirstStart ? t('settings.firstStartTitle') : t('settings.title')}
          </Dialog.Title>
          {isFirstStart && <LanguageSelector data-testid="settings-language-selector" />}
        </Flex>

        {isFirstStart && (
          <Text as="p" size="2" mb="4" color="gray" data-testid="settings-first-start-message">
            {t('settings.firstStartMessage')}
          </Text>
        )}

        <StatusMessage
          status={
            connectionErrorMessage
              ? isConnectionValid
                ? 'success'
                : 'error'
              : 'none'
          }
          message={connectionErrorMessage}
          fixedHeight={true}
          height="60px"
          maxLines={2}
          data-testid="settings-status-message"
        />

        <Box mt="4">
          <RadixTabs.Root defaultValue="connection">
            <Flex direction="column" gap="2">
              <RadixTabs.List>
                <RadixTabs.Trigger
                  value="connection"
                  className={styles.tabTrigger} // Apply CSS module class
                  data-testid="settings-tab-connection"
                >
                  {t('settings.tabConnection')}
                </RadixTabs.Trigger>
                {!isFirstStart && (
                  <>
                    <RadixTabs.Trigger
                      value="limits"
                      className={styles.tabTrigger} // Apply CSS module class
                      data-testid="settings-tab-limits"
                    >
                      {t('settings.tabLimits')}
                    </RadixTabs.Trigger>
                    <RadixTabs.Trigger
                      value="paths"
                      className={styles.tabTrigger} // Apply CSS module class
                      data-testid="settings-tab-paths"
                    >
                      {t('settings.tabPaths')}
                    </RadixTabs.Trigger>
                  </>
                )}
              </RadixTabs.List>

              <RadixTabs.Content value="connection">
                <ConnectionTab
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                  onConnectionTest={handleConnectionTestResult}
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
              data-testid="settings-cancel-button"
            >
              {t('settings.cancel')}
            </RadixButton>
          )}
          <RadixButton
            size="1"
            variant="solid"
            onClick={handleSave}
            disabled={isSaving || (isFirstStart && !isConnectionValid)}
            data-testid="settings-save-button"
          >
            {isSaving ? t('settings.saving') : t('settings.save')}
          </RadixButton>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};

import { LoadConfig } from '../../../wailsjs/go/main/App';
