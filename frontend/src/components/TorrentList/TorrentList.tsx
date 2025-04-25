import { useMemo } from 'react';
import { TorrentItem } from "../TorrentItem";
import { useLocalization } from "@contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { TorrentListProps } from "./types";
import styles from "./TorrentList.module.css";

/**
 * Компонент для отображения списка торрентов
 * Отображает список торрентов с возможностью фильтрации, или сообщение о их отсутствии
 * При загрузке отображает индикатор загрузки
 */
export const TorrentList: React.FC<TorrentListProps> = ({
    torrents,
    searchTerm,
    selectedTorrents,
    onSelect,
    onRemove,
    onStart,
    onStop,
    onVerify,
    isLoading = false,
    isReconnecting = false,
    onSetSpeedLimit,
}) => {
    const { t } = useLocalization();

    // Предполагаем, что родительский компонент теперь фильтрует торренты и передает отфильтрованный список
    const filteredTorrents = torrents;

    // Функция для рендеринга содержимого списка
    const renderContent = () => {
        // Не показываем спиннер загрузки при отсутствии соединения
        if (isLoading && !isReconnecting) {
            return (
                <div className={styles.loadingContainer} data-testid="torrent-list-loading">
                    <LoadingSpinner size="large" />
                    <div className={styles.loadingText}>{t("torrents.loading")}</div>
                </div>
            );
        }

        // Не показываем сообщение "Торренты не добавлены" при ошибке соединения
        if (isReconnecting) {
            return null;
        }

        if (filteredTorrents.length > 0) {
            return filteredTorrents.map((torrent) => (
                <TorrentItem
                    key={torrent.ID}
                    data-testid={`torrent-list-item-${torrent.ID}`}
                    id={torrent.ID}
                    name={torrent.Name}
                    status={torrent.Status}
                    progress={torrent.Progress}
                    sizeFormatted={torrent.SizeFormatted}
                    uploadRatio={torrent.UploadRatio}
                    seedsConnected={torrent.SeedsConnected}
                    seedsTotal={torrent.SeedsTotal}
                    peersConnected={torrent.PeersConnected}
                    peersTotal={torrent.PeersTotal}
                    uploadedFormatted={torrent.UploadedFormatted}
                    downloadSpeedFormatted={torrent.DownloadSpeedFormatted}
                    uploadSpeedFormatted={torrent.UploadSpeedFormatted}
                    selected={selectedTorrents.has(torrent.ID)}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    onStart={onStart}
                    onStop={onStop}
                    onVerify={onVerify}
                    onSetSpeedLimit={onSetSpeedLimit}
                    isSlowMode={torrent.IsSlowMode}
                />
            ));
        }

        return (
            <div className={styles.emptyState} data-testid="torrent-list-empty">
                {searchTerm ? t("torrents.noTorrentsFound") : t("torrents.noTorrents")}
            </div>
        );
    };

    return (
        <div className={styles.torrentListContainer} data-testid="torrent-list-container">
            <div className={styles.torrentList}>{renderContent()}</div>
        </div>
    );
};