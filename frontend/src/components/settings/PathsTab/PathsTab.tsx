import {
  forwardRef,
  useImperativeHandle,
  useState, // Добавляем импорт useState для отслеживания скопированного пути
  useCallback, // Добавляем импорт useCallback для оптимизации функций
  useEffect, // Добавляем импорт useEffect для управления таймером анимации
} from "react";
import {
  TextField,
  Flex,
  Text,
  Grid,
  Box,
  Button,
  IconButton,
  Tooltip,
} from "@radix-ui/themes";
import { useLocalization } from "@contexts/LocalizationContext";
import {
  TrashIcon,
  StarIcon,
  ClipboardIcon, // Импортируем иконку копирования
  ClipboardDocumentCheckIcon, // Иконка успешного копирования
  ExclamationCircleIcon, // Иконка ошибки копирования
} from "@heroicons/react/24/outline";
import { usePathsManagement } from "./hooks/usePathsManagement";
import styles from "./PathsTab.module.css"; // Импортируем CSS модуль

/**
 * Props for the PathsTab component.
 */
interface PathsTabProps {
  /** Callback function invoked when the list of pending changes is updated. */
  onPathsChanged?: (hasChanges: boolean) => void;
}

/**
 * Ref handle for the PathsTab component.
 */
export interface PathsTabRef {
  /** Saves all pending changes. */
  saveChanges: () => Promise<void>;
  /** Discards all pending changes and resets to the initial state. */
  resetChanges: () => void;
  /** Returns the current pending changes. */
  getPathChanges: () => {
    pathsToAdd: string[];
    pathsToRemove: string[];
    defaultPath: string | null;
  };
  /** Indicates if there are pending changes. */
  hasChanges: boolean;
}

/**
 * @description Component representing the 'Paths' tab in the settings dialog.
 * Allows users to manage download paths: view, add, remove, and set a default path.
 * Uses the `usePathsManagement` hook for state logic.
 * @param {PathsTabProps} props - Component props.
 * @param {React.Ref<PathsTabRef>} ref - Ref for accessing component methods.
 */
export const PathsTab = forwardRef<PathsTabRef, PathsTabProps>(
  ({ onPathsChanged }, ref) => {
    const { t } = useLocalization();
    const {
      paths,
      defaultPath,
      newPath,
      isLoading,
      pathError,
      pathWithConfirmDelete,
      isDuplicatePath,
      showDuplicateTooltip,
      hasChanges,
      setNewPathValue,
      handleAddPath,
      handleDeletePathRequest,
      handleConfirmInlineDelete,
      cancelDelete,
      handleSetDefaultPath,
      saveChanges,
      resetChanges,
      getPathChanges,
    } = usePathsManagement({ onPathsChanged });

    // Новое состояние для управления копированием путей
    const [copiedPath, setCopiedPath] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Очистка статуса копирования через заданное время
    useEffect(() => {
      if (copiedPath) {
        const timer = setTimeout(() => {
          setCopiedPath(null);
          setCopyStatus('idle');
        }, 1500); // Сброс статуса через 1.5 секунды

        return () => clearTimeout(timer);
      }
    }, [copiedPath, copyStatus]);

    // Функция для копирования пути в буфер обмена
    const handleCopyPath = useCallback(async (path: string) => {
      try {
        await navigator.clipboard.writeText(path);
        setCopiedPath(path);
        setCopyStatus('success');
      } catch (error) {
        console.error('Failed to copy path:', error);
        setCopiedPath(path);
        setCopyStatus('error');
      }
    }, []);

    // Expose methods and state via ref
    useImperativeHandle(
      ref,
      () => ({
        saveChanges,
        resetChanges,
        getPathChanges,
        hasChanges, // Экспортируем состояние hasChanges
      }),
      [saveChanges, resetChanges, getPathChanges, hasChanges] // Добавляем hasChanges в зависимости
    );

    // Render loading state if necessary
    if (isLoading) {
      // TODO: Replace with a proper loading indicator/spinner component
      return <Text data-testid="loading-indicator">{t("loading")}</Text>;
    }

    return (
      <Grid columns="1" gap="3" className={styles.pathsTabContainer}>
        {/* List of existing paths */}
        {paths.length > 0 && (
          <Box data-testid="paths-list-container">
            <Text as="div" size="1" mb="2" weight="bold">
              {t("settings.savedPaths")}
            </Text>
            <Box className={styles.pathsListScrollbox}>
              <Flex direction="column" gap="2">
                {paths
                  .sort((a, b) => {
                    if (a === defaultPath) return -1;
                    if (b === defaultPath) return 1;
                    return 0;
                  })
                  .map((path) => (
                    <Flex
                      key={path}
                      data-testid={`path-item-${path}`}
                      justify="between"
                      align="center"
                      gap="2"
                      className={`${styles.pathItem} ${path === defaultPath ? styles.defaultPathItem : ''}`}
                    >
                      {/* Delete confirmation view */}
                      {pathWithConfirmDelete === path ? (
                        <Flex
                          justify="between"
                          align="center"
                          gap="2"
                          style={{ width: "100%" }}
                        >
                          <Text size="1" color="red">
                            {t("settings.confirmDeletePath")}
                          </Text>
                          <Flex gap="2">
                            <Button
                              size="1"
                              color="red"
                              variant="soft"
                              onClick={() => handleConfirmInlineDelete(path)}
                              data-testid={`confirm-delete-button-${path}`}
                            >
                              {t("remove.confirm")}
                            </Button>
                            <Button
                              size="1"
                              variant="soft"
                              onClick={cancelDelete} // Use cancelDelete from hook
                              data-testid={`cancel-delete-button-${path}`}
                            >
                              {t("remove.cancel")}
                            </Button>
                          </Flex>
                        </Flex>
                      ) : (
                        // Default path view
                        <>
                          <Tooltip content={path}>
                            <Text size="1" className={styles.pathText}>
                              {path}
                              {/* System path indicator removed as defaultPath handles it */}
                            </Text>
                          </Tooltip>
                          <Flex gap="2">
                            {/* Кнопка копирования пути - добавляем её первой в ряду кнопок */}
                            <IconButton
                              size="1"
                              variant="soft"
                              color={copiedPath === path ? (copyStatus === 'success' ? 'green' : 'red') : 'gray'}
                              onClick={() => handleCopyPath(path)}
                              data-testid={`copy-button-${path}`}
                              aria-label={t("settings.copyPath")}
                            >
                              {copiedPath === path ? (
                                copyStatus === 'success' ? (
                                  <ClipboardDocumentCheckIcon width={16} height={16} />
                                ) : (
                                  <ExclamationCircleIcon width={16} height={16} />
                                )
                              ) : (
                                <ClipboardIcon width={16} height={16} />
                              )}
                            </IconButton>

                            {path === defaultPath ? (
                              <Tooltip content={t("settings.isDefaultPath")}>
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="amber"
                                  // onClick={handleClearDefaultPath} // Removed, default cannot be cleared directly
                                  style={{ cursor: "default" }} // Indicate non-clickable
                                  data-testid={`is-default-indicator-${path}`}
                                >
                                  <StarIcon width={16} height={16} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              // Non-default path actions
                              <>
                                <Tooltip content={t("settings.setDefault")}>
                                  <IconButton
                                    size="1"
                                    variant="soft"
                                    onClick={() => handleSetDefaultPath(path)}
                                    data-testid={`set-default-button-${path}`}
                                  >
                                    <StarIcon width={16} height={16} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip content={t("settings.removePath")}>
                                  <IconButton
                                    size="1"
                                    variant="soft"
                                    color="red"
                                    onClick={() => handleDeletePathRequest(path)}
                                    data-testid={`delete-button-${path}`}
                                  >
                                    <TrashIcon width={16} height={16} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Flex>
                        </>
                      )}
                    </Flex>
                  ))}
              </Flex>
            </Box>
          </Box>
        )}

        {/* Add new path section */}
        <Box>
          <Text as="div" size="1" mb="2" weight="bold">
            {t("settings.addNewPath")}
          </Text>
          <Flex direction="column" gap="2">
            <TextField.Root
              size="1"
              value={newPath}
              onChange={(e) => setNewPathValue(e.target.value)} // Use setter from hook
              color={pathError || isDuplicatePath ? "red" : undefined} // Indicate error or duplicate
              placeholder={t("settings.pathPlaceholder")}
              data-testid="new-path-input"
            />

            {pathError && (
              <Text size="1" color="red" data-testid="new-path-error">
                {pathError}
              </Text>
            )}

            <Tooltip
              content={t("settings.pathAlreadyExists")}
              open={showDuplicateTooltip}
              data-testid="duplicate-path-tooltip"
            >
              <Button
                size="1"
                variant="soft"
                onClick={handleAddPath} // Use handler from hook
                disabled={!newPath.trim() || isLoading} // Disable if empty or loading
                data-testid="add-path-button"
              >
                {t("settings.addPath")}
              </Button>
            </Tooltip>
          </Flex>
        </Box>
      </Grid>
    );
  }
);
