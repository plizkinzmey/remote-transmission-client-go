import { TorrentItem } from "./TorrentItem";
import { useLocalization } from "../contexts/LocalizationContext";
import styles from "../styles/App.module.css";

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
}

interface TorrentListProps {
  torrents: TorrentData[];
  searchTerm: string;
  selectedTorrents: Set<number>;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
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
}) => {
  const { t } = useLocalization();

  // Фильтрация торрентов по поисковому запросу
  const filteredTorrents = torrents.filter((torrent) =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.torrentListContainer}>
      <div className={styles.torrentList}>
        {filteredTorrents.length > 0 ? (
          // Отображаем список торрентов
          filteredTorrents.map((torrent) => (
            <TorrentItem
              key={torrent.ID}
              id={torrent.ID}
              name={torrent.Name}
              status={torrent.Status}
              progress={torrent.Progress}
              size={torrent.Size}
              sizeFormatted={torrent.SizeFormatted}
              uploadRatio={torrent.UploadRatio}
              seedsConnected={torrent.SeedsConnected}
              seedsTotal={torrent.SeedsTotal}
              peersConnected={torrent.PeersConnected}
              peersTotal={torrent.PeersTotal}
              uploadedBytes={torrent.UploadedBytes}
              uploadedFormatted={torrent.UploadedFormatted}
              selected={selectedTorrents.has(torrent.ID)}
              onSelect={onSelect}
              onRemove={onRemove}
              onStart={onStart}
              onStop={onStop}
            />
          ))
        ) : (
          // Сообщение об отсутствии торрентов
          <div className={styles.noTorrents}>
            {searchTerm
              ? t("torrents.noTorrentsFound")
              : t("torrents.noTorrents")}
          </div>
        )}
      </div>
    </div>
  );
};
