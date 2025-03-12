import { useEffect, useState } from "react";
import { Button } from "./Button";
import { DeleteConfirmation } from "./DeleteConfirmation";
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "../styles/TorrentItem.module.css";

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  size: number;
  uploadRatio: number;
  seedsConnected: number;
  seedsTotal: number;
  peersConnected: number;
  peersTotal: number;
  uploadedBytes: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
}

const getStatusClassName = (status: string) => {
  switch (status) {
    case "downloading":
      return styles.statusDownloading;
    case "seeding":
      return styles.statusSeeding;
    case "completed":
      return styles.statusCompleted;
    default:
      return styles.statusStopped;
  }
};

// Helper function to format bytes to human-readable format
const formatBytes = (bytes: number): string => {
  // Обработка отрицательных значений или нуля
  if (bytes <= 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Функция для обеспечения неотрицательных значений
const ensureNonNegative = (value: number): number => {
  return value < 0 ? 0 : value;
};

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  size,
  uploadRatio,
  seedsConnected,
  seedsTotal,
  peersConnected,
  peersTotal,
  uploadedBytes,
  selected,
  onSelect,
  onRemove,
  onStart,
  onStop,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<"start" | "stop" | null>(null);
  const [lastStatus, setLastStatus] = useState(status);

  // Отслеживаем изменение статуса торрента
  useEffect(() => {
    if (isLoading && lastAction) {
      // Проверяем, можно ли выполнить действие
      const canPerformAction =
        (lastAction === "start" && status === "stopped") ||
        (lastAction === "stop" &&
          (status === "downloading" || status === "seeding"));

      // Если действие невозможно выполнить (торрент уже в нужном состоянии)
      if (!canPerformAction) {
        setIsLoading(false);
        setLastAction(null);
        return;
      }

      // Если статус изменился после выполнения действия
      if (lastStatus !== status) {
        if (
          (lastAction === "start" &&
            (status === "downloading" || status === "seeding")) ||
          (lastAction === "stop" && status === "stopped")
        ) {
          setIsLoading(false);
          setLastAction(null);
        }
      }
    }
    setLastStatus(status);
  }, [status, lastAction, lastStatus, isLoading]);

  const handleAction = (action: "start" | "stop") => {
    if (isLoading) return;

    // Проверяем, нужно ли выполнять действие
    const isAlreadyInTargetState =
      (action === "start" &&
        (status === "downloading" || status === "seeding")) ||
      (action === "stop" && status === "stopped");

    if (isAlreadyInTargetState) {
      return; // Не выполняем действие, если торрент уже в целевом состоянии
    }

    setIsLoading(true);
    setLastAction(action);

    if (action === "start") {
      onStart(id);
    } else {
      onStop(id);
    }
  };

  const isRunning = status === "downloading" || status === "seeding";

  const renderActionButton = () => {
    if (isLoading) {
      return (
        <Button variant="icon" disabled loading>
          <ArrowPathIcon className="loading-spinner" />
        </Button>
      );
    }

    if (isRunning) {
      return (
        <Button
          variant="icon"
          onClick={() => handleAction("stop")}
          aria-label={`Pause torrent ${name}`}
        >
          <PauseIcon />
        </Button>
      );
    }

    return (
      <Button
        variant="icon"
        onClick={() => handleAction("start")}
        aria-label={`Start torrent ${name}`}
      >
        <PlayIcon />
      </Button>
    );
  };

  const renderProgressInfo = () => {
    // Убедимся, что размер не отрицательный
    const safeSize = ensureNonNegative(size);

    // Расчет скачанного размера на основе прогресса
    const downloadedSize = Math.round(safeSize * (progress / 100));

    if (progress >= 100) {
      // Если загрузка завершена, показываем только общий размер
      return `${formatBytes(safeSize)}`;
    } else {
      // Иначе показываем прогресс скачивания
      return `${formatBytes(downloadedSize)} / ${formatBytes(
        safeSize
      )} (${progress.toFixed(1)}%)`;
    }
  };

  // Обеспечиваем неотрицательные значения для всех счетчиков
  const safeUploadRatio = ensureNonNegative(uploadRatio);
  const safeSeedsConnected = ensureNonNegative(seedsConnected);
  const safeSeedsTotal = ensureNonNegative(seedsTotal);
  const safePeersConnected = ensureNonNegative(peersConnected);
  const safePeersTotal = ensureNonNegative(peersTotal);
  const safeUploadedBytes = ensureNonNegative(uploadedBytes);

  return (
    <>
      <div className={styles.container}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(id)}
            aria-label={`Select torrent ${name}`}
          />
        </label>
        <div className={styles.info}>
          <div className={styles.topRow}>
            <h3 className={styles.name} title={name}>
              {name}
            </h3>
            <div className={styles.ratioContainer} title="Рейтинг раздачи">
              <span className={styles.ratio}>
                Рейтинг: {safeUploadRatio.toFixed(2)}
              </span>
            </div>
          </div>
          <div className={styles.statusContainer}>
            <span className={getStatusClassName(status)}>{status}</span>
            <span className={styles.progressText}>{renderProgressInfo()}</span>
          </div>
          <div className={styles.progressContainer}>
            <progress
              className={styles.progressElement}
              value={progress}
              max={100}
            />
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Additional torrent info - в одну линию */}
          <div className={styles.detailedInfo}>
            <div className={styles.infoRow}>
              <span>
                Seeds: {safeSeedsConnected}/{safeSeedsTotal}
              </span>
              <span>
                Peers: {safePeersConnected}/{safePeersTotal}
              </span>
              <span>Uploaded: {formatBytes(safeUploadedBytes)}</span>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          {renderActionButton()}
          <Button
            variant="icon"
            onClick={() => setShowDeleteConfirmation(true)}
            aria-label={`Remove torrent ${name}`}
          >
            <TrashIcon />
          </Button>
        </div>
      </div>
      {showDeleteConfirmation && (
        <DeleteConfirmation
          torrentName={name}
          onConfirm={(deleteData) => {
            onRemove(id, deleteData);
            setShowDeleteConfirmation(false);
          }}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </>
  );
};
