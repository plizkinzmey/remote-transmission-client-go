import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { BulkDeleteConfirmation } from "./BulkDeleteConfirmation";
import { StatusFilter } from "./StatusFilter";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SnailIcon } from "./icons/SnailIcon";
import styles from "../styles/Header.module.css";
import { useState, useCallback } from "react";

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
  isReconnecting: boolean;
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
  isReconnecting,
  statusFilter,
  onStatusFilterChange,
  torrents,
  onSetSpeedLimit,
  isSlowModeEnabled = false,
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleRemoveClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newTerm = event.target.value;
      setSearchTerm(newTerm);
    },
    [setSearchTerm]
  );

  return (
    <div className={styles.fixedHeader}>
      {/* Панель управления с кнопками и поиском */}
      <div className={styles.controlPanel}>
        <div className={styles.leftSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t("torrents.search")}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          {/* Кнопка добавления торрента */}
          <Button
            variant="icon"
            onClick={onAddTorrent}
            aria-label={t("add.title")}
          >
            <PlusCircleIcon />
          </Button>
          {/* Кнопка запуска выбранных торрентов */}
          <Button
            variant="icon"
            onClick={onStartSelected}
            disabled={!hasSelectedTorrents || startLoading}
            loading={startLoading}
            aria-label={t("torrents.startSelected")}
          >
            {startLoading ? <LoadingSpinner size="small" /> : <PlayIcon />}
          </Button>
          {/* Кнопка остановки выбранных торрентов */}
          <Button
            variant="icon"
            onClick={onStopSelected}
            disabled={!hasSelectedTorrents || stopLoading}
            loading={stopLoading}
            aria-label={t("torrents.stopSelected")}
          >
            {stopLoading ? <LoadingSpinner size="small" /> : <PauseIcon />}
          </Button>
          {/* Кнопка замедления выбранных торрентов */}
          <Button
            variant="icon"
            onClick={() => onSetSpeedLimit(!isSlowModeEnabled)}
            disabled={!hasSelectedTorrents}
            title={t(
              isSlowModeEnabled ? "header.normalSpeed" : "header.slowSpeed"
            )}
            data-active={isSlowModeEnabled}
          >
            <SnailIcon className={styles.icon} />
          </Button>
          {/* Кнопка удаления выбранных торрентов */}
          <Button
            variant="icon"
            onClick={handleRemoveClick}
            disabled={!hasSelectedTorrents || removeLoading}
            loading={removeLoading}
            aria-label={t("remove.title")}
          >
            {removeLoading ? <LoadingSpinner size="small" /> : <TrashIcon />}
          </Button>
        </div>
        <div className={styles.rightSection}>
          {/* Кнопка настроек */}
          <Button
            variant="icon"
            onClick={onSettings}
            aria-label={t("settings.title")}
          >
            <Cog6ToothIcon />
          </Button>
        </div>
      </div>

      {/* Блок выбора всех торрентов и фильтров */}
      <div className={styles.selectAllContainer}>
        <div className={styles.selectAllWrapper}>
          <input
            type="checkbox"
            className={styles.selectAllCheckbox}
            checked={
              selectedTorrents.size > 0 &&
              selectedTorrents.size === filteredTorrents.length
            }
            onChange={onSelectAll}
            id="selectAll"
            disabled={filteredTorrents.length === 0}
          />
          <label htmlFor="selectAll" className={styles.selectAllLabel}>
            {selectedTorrents.size > 0
              ? t(
                  "torrents.selected",
                  String(selectedTorrents.size),
                  String(filteredTorrents.length)
                )
              : t("torrents.selectAll")}
          </label>
        </div>

        {/* Фильтры статусов */}
        <StatusFilter
          selectedStatus={statusFilter}
          onStatusChange={onStatusFilterChange}
          hasNoTorrents={torrents.length === 0}
        />
      </div>

      {/* Отображение сообщений об ошибках */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Индикатор переподключения */}
      {isReconnecting && (
        <div className={styles.reconnectingStatus}>{t("app.reconnecting")}</div>
      )}

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirmation && (
        <BulkDeleteConfirmation
          count={selectedTorrents.size}
          onConfirm={(deleteData) => {
            onRemoveSelected(deleteData);
            setShowDeleteConfirmation(false);
          }}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </div>
  );
};
