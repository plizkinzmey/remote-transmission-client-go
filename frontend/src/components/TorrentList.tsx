import { TorrentItem } from "./TorrentItem";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";
import styles from "../styles/TorrentList.module.css";

// Интерфейс для торрента
export interface TorrentData {
  ID: number;
  Name: string;
  Status: string;
  Progress: number;
  Size: number;
  SizeFormatted: string;
  UploadRatio: number;
  SeedsConnected: number;
  SeedsTotal: number;
  PeersConnected: number;
  PeersTotal: number;
  UploadedBytes: number;
  UploadedFormatted: string;
  DownloadSpeed: number;
  UploadSpeed: number;
  DownloadSpeedFormatted: string;
  UploadSpeedFormatted: string;
  IsSlowMode: boolean;
}

interface TorrentListProps {
  torrents: TorrentData[];
  searchTerm: string;
  selectedTorrents: Set<number>;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onVerify?: (id: number) => void;
  isLoading?: boolean;
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
}

/**
 * Компонент для отображения списка торрентов
 * Отображает либо список торрентов, либо сообщение о их отсутствии
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
  onSetSpeedLimit,
}) => {
  const { t } = useLocalization();

  // Фильтрация торрентов по поисковому запросу
  const filteredTorrents = torrents.filter((torrent) =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Функция для рендеринга содержимого списка
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <div className={styles.loadingText}>{t("torrents.loading")}</div>
        </div>
      );
    }

    if (filteredTorrents.length > 0) {
      return filteredTorrents.map((torrent) => (
        <TorrentItem
          key={torrent.ID}
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
      <div className={styles.noTorrents}>
        {searchTerm ? t("torrents.noTorrentsFound") : t("torrents.noTorrents")}
      </div>
    );
  };

  return (
    <div className={styles.torrentListContainer}>
      <div className={styles.torrentList}>{renderContent()}</div>
    </div>
  );
};
