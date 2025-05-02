import React, { useState, useCallback } from 'react';
import { useLocalization } from "@contexts/LocalizationContext";
import { StatusFilter } from "../StatusFilter";
import { StatusType } from "../../utils/torrentStatus";
import { LoadingSpinner } from "../LoadingSpinner";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { SnailIcon } from "../icons/SnailIcon";
import styles from "./Header.module.css";
import { ThemeToggle } from "../ThemeToggle";
import { LanguageSelector } from "../LanguageSelector";
import { DeleteDialog } from "../DeleteDialog";
import {
  IconButton,
  TextField,
  Box,
  Flex,
  Text,
  Checkbox,
} from "@radix-ui/themes";

/**
 * Props interface for the Header component
 */
export interface HeaderProps {
  /** Current search term for filtering torrents */
  searchTerm: string;
  /** Callback to update search term */
  setSearchTerm: (term: string) => void;
  /** Callback for adding new torrent */
  onAddTorrent: () => void;
  /** Callback for opening settings */
  onSettings: () => void;
  /** Callback for starting selected torrents */
  onStartSelected: () => void;
  /** Callback for stopping selected torrents */
  onStopSelected: () => void;
  /** Callback for removing selected torrents */
  onRemoveSelected: (deleteData: boolean) => void;
  /** Whether any torrents are currently selected */
  hasSelectedTorrents: boolean;
  /** Whether any selected torrents are currently running (downloading or seeding) */
  hasRunningSelectedTorrents?: boolean;
  /** Loading state for start operation */
  startLoading: boolean;
  /** Loading state for stop operation */
  stopLoading: boolean;
  /** Loading state for remove operation */
  removeLoading: boolean;
  /** List of filtered torrents */
  filteredTorrents: Array<any>;
  /** Set of selected torrent IDs */
  selectedTorrents: Set<number>;
  /** Callback for selecting/deselecting all torrents */
  onSelectAll: () => void;
  /** Optional error message to display */
  error?: string;
  /** Current status filter */
  statusFilter: StatusType | "slow" | null;
  /** Callback for changing status filter */
  onStatusFilterChange: (status: StatusType | "slow" | null) => void;
  /** List of all torrents */
  torrents: Array<any>;
  /** Callback for setting speed limit */
  onSetSpeedLimit: (isSlowMode: boolean) => void;
  /** Whether slow mode is enabled */
  isSlowModeEnabled?: boolean;
  /** Whether client is reconnecting */
  isReconnecting: boolean;
  /** Whether this is first application start */
  isFirstStart?: boolean;
}

/**
 * Header component for the torrent client application
 * Contains controls for managing torrents and application settings
 */
export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  onAddTorrent,
  onSettings,
  onStartSelected,
  onStopSelected,
  onRemoveSelected,
  hasSelectedTorrents,
  hasRunningSelectedTorrents = false,
  startLoading,
  stopLoading,
  removeLoading,
  filteredTorrents,
  selectedTorrents,
  onSelectAll,
  error,
  statusFilter,
  onStatusFilterChange,
  torrents,
  onSetSpeedLimit,
  isSlowModeEnabled = false,
  isReconnecting,
  isFirstStart = false,
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleRemoveClick = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    [setSearchTerm]
  );

  // Вспомогательная функция для определения заголовка кнопки ограничения скорости
  const getSpeedLimitButtonTitle = useCallback(() => {
    if (isReconnecting) {
      return t("errors.needConnection");
    }

    if (!hasRunningSelectedTorrents && hasSelectedTorrents) {
      return t("torrents.noRunningSelectedForSpeedLimit");
    }

    return t(isSlowModeEnabled ? "header.normalSpeed" : "header.slowSpeed");
  }, [t, isReconnecting, hasRunningSelectedTorrents, hasSelectedTorrents, isSlowModeEnabled]);

  return (
    <Box className={styles.container} data-testid="header-main">
      <Flex className={styles.controlsContainer} justify="between" align="center" data-testid="header-control-panel">
        <Flex gap="3" align="center">
          <TextField.Root
            size="1"
            style={{ width: "200px" }}
            placeholder={t("torrents.search")}
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={isReconnecting}
            title={isReconnecting ? t("errors.needConnection") : undefined}
            data-testid="header-search-input"
          >
            <TextField.Slot>
              <MagnifyingGlassIcon width={18} height={18} />
            </TextField.Slot>
          </TextField.Root>

          <IconButton
            size="2"
            variant="soft"
            color="blue"
            onClick={onAddTorrent}
            aria-label={t("add.title")}
            disabled={isReconnecting}
            title={isReconnecting ? t("errors.needConnection") : t("add.title")}
          >
            <PlusCircleIcon width={18} height={18} />
          </IconButton>

          <IconButton
            size="2"
            variant="soft"
            color="grass"
            onClick={onStartSelected}
            disabled={!hasSelectedTorrents || startLoading || isReconnecting}
            aria-label={t("torrents.startSelected")}
            title={isReconnecting ? t("errors.needConnection") : t("torrents.startSelected")}
          >
            {startLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <PlayIcon width={18} height={18} />
            )}
          </IconButton>

          <IconButton
            size="2"
            variant="solid"
            color="amber"
            onClick={onStopSelected}
            disabled={!hasSelectedTorrents || stopLoading || isReconnecting}
            aria-label={t("torrents.stopSelected")}
            title={isReconnecting ? t("errors.needConnection") : t("torrents.stopSelected")}
          >
            {stopLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <PauseIcon width={18} height={18} />
            )}
          </IconButton>

          <IconButton
            size="2"
            variant={isSlowModeEnabled ? "solid" : "soft"}
            color={isSlowModeEnabled ? "orange" : "blue"}
            onClick={() => onSetSpeedLimit(!isSlowModeEnabled)}
            disabled={!hasSelectedTorrents || isReconnecting || !hasRunningSelectedTorrents}
            aria-label={t(isSlowModeEnabled ? "header.normalSpeed" : "header.slowSpeed")}
            title={getSpeedLimitButtonTitle()}
          >
            <SnailIcon style={{ width: 18, height: 18 }} />
          </IconButton>

          <IconButton
            size="2"
            variant="soft"
            color="red"
            onClick={handleRemoveClick}
            aria-label={t("remove.title")}
            disabled={!hasSelectedTorrents || removeLoading || isReconnecting}
            title={isReconnecting ? t("errors.needConnection") : t("remove.title")}
          >
            {removeLoading ? (
              <LoadingSpinner size="small" />
            ) : (
              <TrashIcon width={18} height={18} />
            )}
          </IconButton>
        </Flex>

        <Flex gap="2" align="center">
          <Flex gap="4" align="center">
            {!isFirstStart && <LanguageSelector />}
            <ThemeToggle />
            <IconButton
              size="2"
              variant="soft"
              color="indigo"
              onClick={onSettings}
              aria-label={t("settings.title")}
            >
              <Cog6ToothIcon width={20} height={20} />
            </IconButton>
          </Flex>
        </Flex>
      </Flex>

      <Box className={styles.filterBar}>
        <Flex className={styles.selectAllContainer} data-testid="header-select-all-container">
          <Checkbox
            id="select-all-checkbox"
            className={styles.selectAllCheckbox}
            checked={
              selectedTorrents.size > 0 &&
              selectedTorrents.size === filteredTorrents.length
            }
            onCheckedChange={onSelectAll}
            aria-label={t("header.selectAllTorrents")}
            data-testid="header-select-all-checkbox"
          />
          <Text size="1">
            {selectedTorrents.size > 0
              ? t("torrents.selected", [
                String(selectedTorrents.size),
                String(filteredTorrents.length)
              ])
              : t("torrents.selectAll")}
          </Text>
        </Flex>
        <StatusFilter
          selectedStatus={statusFilter}
          onStatusChange={onStatusFilterChange}
          hasNoTorrents={torrents.length === 0}
          isReconnecting={isReconnecting}
        />
      </Box>

      {error && (
        <Box className={styles.errorContainer} data-testid="header-error-message">
          <Text color="red" size="1">
            {error}
          </Text>
        </Box>
      )}

      <DeleteDialog
        open={showDeleteConfirmation}
        mode={selectedTorrents.size > 1 ? "bulk" : "single"}
        count={selectedTorrents.size}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={(deleteData) => {
          onRemoveSelected(deleteData);
          setShowDeleteConfirmation(false);
        }}
      />
    </Box>
  );
};