import React, { useState, useCallback, useRef, useEffect } from 'react'; // Add useEffect
import {
  Dialog,
  Button as RadixButton,
  Tabs as RadixTabs,
  Flex,
  Box,
  Text,
} from '@radix-ui/themes';
import { useLocalization } from '@contexts/LocalizationContext';
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
    updateSettings, // Renamed from setSettingsDirectly
  } = useSettingsStateManagement({ initialSettings: defaultSettings });

  const { isLoading, loadError } = useSettingsLoader({
    isFirstStart,
    defaultSettings,
    onLoadSuccess: updateSettings, // Updated name here too
  });

  const {
    isConnectionValid,
    connectionErrorMessage,
    handleConnectionTestResult,
    resetConnectionTest,
  } = useConnectionTester();

  const pathsTabRef = useRef<PathsTabRef>(null);
  const [pathsHaveChanges, setPathsHaveChanges] = useState(false);

  // Улучшаем форматирование ошибок для пользователя
  const formatErrorForDisplay = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    // Для других типов ошибок делаем безопасное преобразование
    return String(error).replace(/^Error:\s*/i, '');
  }, []);

  // Обновляем обработчик ошибок
  const handleSaveError = useCallback((error: unknown) => {
    console.error("Settings save/init failed:", error);
    const errorMessage = formatErrorForDisplay(error);
    handleConnectionTestResult(
      false,
      t('errors.failedToInitializeConnection', {
        0: errorMessage
      })
    );
  }, [handleConnectionTestResult, t, formatErrorForDisplay]);

  const {
    isSaving,
    handleSave,
    resetChanges: resetSaverChanges,
  } = useSettingsSaver({
    settings,
    validateSettings,
    onSaveSuccess: onClose,
    onSaveError: handleSaveError,
    onConnectionInitNeeded: async () => {
      try {
        resetConnectionTest();
        const success = await onSave(settings);
        if (!success) {
          handleSaveError(new Error(t('errors.failedToInitializeConnection', { 0: 'onSave returned false' })));
        }
        return success;
      } catch (initError) {
        handleSaveError(initError);
        return false;
      }
    },
    pathsTabRef,
    hasPendingPathsChanges: pathsHaveChanges,
    isFirstStart,
    currentLanguage,
    initialLanguage,
  });

  // Effect to reset connection test status when connection settings change
  useEffect(() => {
    resetConnectionTest();
  }, [settings.host, settings.port, settings.username, settings.password, resetConnectionTest]);

  const handleCancel = useCallback(() => {
    resetSaverChanges();

    if (pathsTabRef.current) {
      pathsTabRef.current.resetChanges();
    }

    setPathsHaveChanges(false);

    onClose();
  }, [onClose, resetSaverChanges, setPathsHaveChanges]);

  // Изменяем логику отображения статуса и сообщения
  const displayStatus = loadError ? 'error' :
    connectionErrorMessage === null ? 'none' :
      (isConnectionValid ? 'success' : 'error');

  const displayError = loadError || connectionErrorMessage;

  if (isLoading) {
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
          status={displayStatus}
          message={displayStatus === 'none' ? undefined : displayError ? t(displayError) : undefined}
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
                  className={styles.tabTrigger}
                  data-testid="settings-tab-connection"
                >
                  {t('settings.tabConnection')}
                </RadixTabs.Trigger>
                {!isFirstStart && (
                  <>
                    <RadixTabs.Trigger
                      value="limits"
                      className={styles.tabTrigger}
                      data-testid="settings-tab-limits"
                    >
                      {t('settings.tabLimits')}
                    </RadixTabs.Trigger>
                    <RadixTabs.Trigger
                      value="paths"
                      className={styles.tabTrigger}
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
                      onPathsChanged={setPathsHaveChanges}
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
