import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { BulkDeleteConfirmation } from "./BulkDeleteConfirmation";
import { StatusFilter } from "./StatusFilter";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "../styles/Header.module.css";
import { useState } from "react";

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
  torrents: Array<any>; // Добавляем проп для всех торрентов
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
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleRemoveClick = () => {
    setShowDeleteConfirmation(true);
  };

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
              onChange={(e) => setSearchTerm(e.target.value)}
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
            {startLoading ? (
              <ArrowPathIcon className="loading-spinner" />
            ) : (
              <PlayIcon />
            )}
          </Button>
          {/* Кнопка остановки выбранных торрентов */}
          <Button
            variant="icon"
            onClick={onStopSelected}
            disabled={!hasSelectedTorrents || stopLoading}
            loading={stopLoading}
            aria-label={t("torrents.stopSelected")}
          >
            {stopLoading ? (
              <ArrowPathIcon className="loading-spinner" />
            ) : (
              <PauseIcon />
            )}
          </Button>
          {/* Кнопка удаления выбранных торрентов */}
          <Button
            variant="icon"
            onClick={handleRemoveClick}
            disabled={!hasSelectedTorrents || removeLoading}
            loading={removeLoading}
            aria-label={t("remove.title")}
          >
            {removeLoading ? (
              <ArrowPathIcon className="loading-spinner" />
            ) : (
              <TrashIcon />
            )}
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
          hasNoTorrents={torrents.length === 0} // Теперь используем общее количество торрентов
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
