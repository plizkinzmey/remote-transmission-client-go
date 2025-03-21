import { useEffect, useState } from "react";
import { Card, Flex, Box, Text, Progress, Checkbox } from "@radix-ui/themes";
import { Button } from "./Button";
import { DeleteDialog } from "./DeleteDialog";
import { TorrentContent } from "./TorrentContent";
import { LoadingSpinner } from "./LoadingSpinner";
import { useLocalization } from "../contexts/LocalizationContext";
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { SnailIcon } from "./icons/SnailIcon";
import styles from "../styles/TorrentItem.module.css";

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  size: number;
  sizeFormatted: string;
  uploadRatio: number;
  seedsConnected: number;
  seedsTotal: number;
  peersConnected: number;
  peersTotal: number;
  uploadedBytes: number;
  uploadedFormatted: string;
  selected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  downloadSpeedFormatted: string;
  uploadSpeedFormatted: string;
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
  isSlowMode?: boolean;
}

const getStatusClassName = (status: string) => {
  switch (status) {
    case "downloading":
      return styles.statusDownloading;
    case "seeding":
      return styles.statusSeeding;
    case "completed":
      return styles.statusCompleted;
    case "checking":
      return styles.statusChecking;
    case "queued":
      return styles.statusQueued;
    default:
      return styles.statusStopped;
  }
};

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  sizeFormatted, // используем уже отформатированное значение с бэкенда
  uploadRatio,
  seedsConnected,
  seedsTotal,
  peersConnected,
  peersTotal,
  uploadedFormatted,
  selected,
  onSelect,
  onRemove,
  onStart,
  onStop,
  downloadSpeedFormatted,
  uploadSpeedFormatted,
  onSetSpeedLimit,
  isSlowMode = false,
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showContent, setShowContent] = useState(false);
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
          <LoadingSpinner size="small" />
        </Button>
      );
    }

    if (isRunning) {
      return (
        <Button
          variant="icon"
          onClick={() => handleAction("stop")}
          title={t("torrent.stop")}
        >
          <PauseIcon className={styles.icon} />
        </Button>
      );
    }

    return (
      <Button
        variant="icon"
        onClick={() => handleAction("start")}
        title={t("torrent.start")}
      >
        <PlayIcon className={styles.icon} />
      </Button>
    );
  };

  const getStatusText = (status: string): string => {
    return t(`torrent.status.${status}`);
  };

  // Используем только нормализацию отрицательных значений
  const normalizeValue = (value: number): number => {
    return value < 0 ? 0 : value;
  };

  // Функция для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case "downloading":
        return "var(--status-downloading)";
      case "seeding":
        return "var(--status-seeding)";
      case "completed":
        return "var(--status-completed)";
      case "checking":
        return "var(--status-checking)";
      case "queued":
        return "var(--status-queued)";
      default:
        return "var(--status-stopped)";
    }
  };

  return (
    <>
      <Card
        variant="surface"
        style={{
          marginBottom: "8px",
          borderLeft: `4px solid ${getStatusColor(status)}`,
          padding: "12px",
        }}
      >
        <Flex gap="3" align="start">
          <Box pt="1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect(id)}
              aria-label={t("torrents.selectTorrent", name)}
            />
          </Box>

          <Box style={{ flex: 1, minWidth: 0 }}>
            <Flex justify="between" align="start" mb="2">
              <Text
                as="span"
                size="2"
                weight="medium"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
                title={name}
              >
                {name}
              </Text>

              <Box
                style={{
                  background: "var(--card-ratio-bg)",
                  borderRadius: "12px",
                  padding: "2px 8px",
                }}
              >
                <Text size="1" title={t("torrent.uploadRatio")}>
                  {t("torrent.ratio")}: {normalizeValue(uploadRatio).toFixed(2)}
                </Text>
              </Box>
            </Flex>

            <Flex gap="2" align="center" mb="2">
              <Text size="1" style={{ color: getStatusColor(status) }}>
                {getStatusText(status)}
              </Text>
              <Text size="1">{progress.toFixed(1)}%</Text>
            </Flex>

            <Progress value={progress} style={{ marginBottom: "12px" }} />

            <Flex wrap="wrap" gap="3">
              <Flex gap="1" align="center">
                <Text size="1" weight="medium">
                  {t("torrent.size")}:
                </Text>
                <Text size="1">{sizeFormatted}</Text>
              </Flex>

              <Flex gap="1" align="center">
                <Text size="1" weight="medium">
                  {t("torrent.speed")}:
                </Text>
                <Flex gap="1" align="center">
                  <ArrowDownIcon
                    width={14}
                    height={14}
                    style={{ color: "var(--download-color)" }}
                  />
                  <Text size="1">{downloadSpeedFormatted}</Text>
                  <ArrowUpIcon
                    width={14}
                    height={14}
                    style={{ color: "var(--seed-color)" }}
                  />
                  <Text size="1">{uploadSpeedFormatted}</Text>
                </Flex>
              </Flex>

              <Flex gap="1" align="center">
                <Text size="1" weight="medium">
                  {t("torrent.seeds")}:
                </Text>
                <Text size="1">
                  {normalizeValue(seedsConnected)}/{normalizeValue(seedsTotal)}
                </Text>
              </Flex>

              <Flex gap="1" align="center">
                <Text size="1" weight="medium">
                  {t("torrent.peers")}:
                </Text>
                <Text size="1">
                  {normalizeValue(peersConnected)}/{normalizeValue(peersTotal)}
                </Text>
              </Flex>

              <Flex gap="1" align="center">
                <Text size="1" weight="medium">
                  {t("torrent.uploaded")}:
                </Text>
                <Text size="1">{uploadedFormatted}</Text>
              </Flex>
            </Flex>
          </Box>

          <Flex direction="column" gap="2">
            <Button
              variant="icon"
              onClick={() => setShowContent(true)}
              title={t("torrent.viewContent")}
            >
              <FolderIcon className={styles.icon} />
            </Button>

            {renderActionButton()}

            {onSetSpeedLimit && (
              <Button
                variant="icon"
                onClick={() => onSetSpeedLimit(id, !isSlowMode)}
                title={t(
                  isSlowMode ? "torrent.normalSpeed" : "torrent.slowSpeed"
                )}
                active={isSlowMode}
              >
                <SnailIcon />
              </Button>
            )}

            <Button
              variant="icon"
              onClick={() => setShowDeleteConfirmation(true)}
              title={t("torrent.remove")}
            >
              <TrashIcon className={styles.icon} />
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Диалог подтверждения удаления */}
      <DeleteDialog
        mode="single"
        torrentName={name}
        onConfirm={(deleteData) => {
          onRemove(id, deleteData);
          setShowDeleteConfirmation(false);
        }}
        onCancel={() => setShowDeleteConfirmation(false)}
        open={showDeleteConfirmation}
      />

      {showContent && (
        <TorrentContent
          id={id}
          name={name}
          onClose={() => setShowContent(false)}
        />
      )}
    </>
  );
};
