import { useLocalization } from "../contexts/LocalizationContext";
import { StatusFilter } from "./StatusFilter";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { SnailIcon } from "./icons/SnailIcon";
import styles from "../styles/Header.module.css";
import { useState, useCallback, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSelector } from "./LanguageSelector";
import { DeleteDialog } from "./DeleteDialog";
import {
  IconButton,
  TextField,
  Box,
  Flex,
  Text,
  Checkbox,
} from "@radix-ui/themes";

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddTorrent: () => void;
  onSettings: () => void;
  onStartSelected: () => void;
  onStopSelected: () => void;
  onRemoveSelected: (deleteData: boolean) => void;
  hasSelectedTorrents: boolean;
  startLoading: boolean;
  stopLoading: boolean;
  removeLoading: boolean;
  filteredTorrents: Array<any>;
  selectedTorrents: Set<number>;
  onSelectAll: () => void;
  error: string | null;
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  torrents: Array<any>;
  onSetSpeedLimit: (isSlowMode: boolean) => void;
  isSlowModeEnabled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  onAddTorrent,
  onSettings,
  onStartSelected,
  onStopSelected,
  onRemoveSelected,
  hasSelectedTorrents,
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
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    setShowDeleteConfirmation(false);
  }, [selectedTorrents]);

  const handleRemoveClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    [setSearchTerm]
  );

  return (
    <Box className={styles.fixedHeader}>
      <Flex className={styles.controlPanel} justify="between" align="center">
        <Flex gap="3" align="center">
          <TextField.Root
            size="1"
            style={{ width: "200px" }}
            placeholder={t("torrents.search")}
            value={searchTerm}
            onChange={handleSearchChange}
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
          >
            <PlusCircleIcon width={18} height={18} />
          </IconButton>

          <IconButton
            size="2"
            variant="soft"
            color="grass"
            onClick={onStartSelected}
            disabled={!hasSelectedTorrents || startLoading}
            aria-label={t("torrents.startSelected")}
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
            disabled={!hasSelectedTorrents || stopLoading}
            aria-label={t("torrents.stopSelected")}
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
            disabled={!hasSelectedTorrents}
            aria-label={t(
              isSlowModeEnabled ? "header.normalSpeed" : "header.slowSpeed"
            )}
          >
            <SnailIcon style={{ width: 18, height: 18 }} />
          </IconButton>

          <IconButton
            size="2"
            variant="soft"
            color="red"
            onClick={handleRemoveClick}
            disabled={!hasSelectedTorrents || removeLoading}
            aria-label={t("remove.title")}
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
            <LanguageSelector />
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

      <Box className={styles.selectAllContainer}>
        <Flex className={styles.selectAllWrapper}>
          <Checkbox
            size="1"
            checked={
              selectedTorrents.size > 0 &&
              selectedTorrents.size === filteredTorrents.length
            }
            onCheckedChange={onSelectAll}
            disabled={filteredTorrents.length === 0}
          />
          <Text size="1">
            {selectedTorrents.size > 0
              ? t(
                  "torrents.selected",
                  String(selectedTorrents.size),
                  String(filteredTorrents.length)
                )
              : t("torrents.selectAll")}
          </Text>
        </Flex>
        <StatusFilter
          selectedStatus={statusFilter}
          onStatusChange={onStatusFilterChange}
          hasNoTorrents={torrents.length === 0}
        />
      </Box>

      {error && (
        <Box className={styles.errorMessage}>
          <Text color="red" size="1">
            {error}
          </Text>
        </Box>
      )}

      <DeleteDialog
        mode="bulk"
        count={selectedTorrents.size}
        onConfirm={(deleteData) => {
          onRemoveSelected(deleteData);
          setShowDeleteConfirmation(false);
        }}
        onCancel={() => setShowDeleteConfirmation(false)}
        open={showDeleteConfirmation}
      />
    </Box>
  );
};
