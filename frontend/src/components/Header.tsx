import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import styles from "../styles/Header.module.css";

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddTorrent: () => void;
  onSettings: () => void;
  onStartSelected: () => void;
  onStopSelected: () => void;
  onRemoveSelected: () => void; // Добавляем функцию удаления выбранных торрентов
  hasSelectedTorrents: boolean;
  startLoading: boolean;
  stopLoading: boolean;
  removeLoading: boolean; // Добавляем состояние загрузки для удаления
  filteredTorrents: Array<any>;
  selectedTorrents: Set<number>;
  onSelectAll: () => void;
  error: string | null;
  isReconnecting: boolean;
}

/**
 * Компонент шапки приложения
 * Включает поиск, кнопки управления и сообщения об ошибках
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
  startLoading,
  stopLoading,
  removeLoading,
  filteredTorrents,
  selectedTorrents,
  onSelectAll,
  error,
  isReconnecting,
}) => {
  const { t } = useLocalization();

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
            onClick={onRemoveSelected}
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

      {/* Блок выбора всех торрентов */}
      {filteredTorrents.length > 0 && (
        <div className={styles.selectAllContainer}>
          <input
            type="checkbox"
            className={styles.selectAllCheckbox}
            checked={
              selectedTorrents.size > 0 &&
              selectedTorrents.size === filteredTorrents.length
            }
            onChange={onSelectAll}
            id="selectAll"
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
      )}

      {/* Отображение сообщений об ошибках */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Индикатор переподключения */}
      {isReconnecting && (
        <div className={styles.reconnectingStatus}>{t("app.reconnecting")}</div>
      )}
    </div>
  );
};
