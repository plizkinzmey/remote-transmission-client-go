import { useEffect, useState } from "react";
import {
  Card,
  Flex,
  Box,
  Text,
  Progress,
  Checkbox,
  IconButton,
  Badge,
} from "@radix-ui/themes";
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
        <IconButton disabled>
          <LoadingSpinner size="small" />
        </IconButton>
      );
    }

    if (isRunning) {
      return (
        <IconButton
          size="2"
          variant="soft"
          onClick={() => handleAction("stop")}
          title={t("torrent.stop")}
        >
          <PauseIcon width={16} height={16} />
        </IconButton>
      );
    }

    return (
      <IconButton
        size="2"
        variant="soft"
        onClick={() => handleAction("start")}
        title={t("torrent.start")}
      >
        <PlayIcon width={16} height={16} />
      </IconButton>
    );
  };

  const getStatusText = (status: string): string => {
    return t(`torrent.status.${status}`);
  };

  // Используем только нормализацию отрицательных значений
  const normalizeValue = (value: number): number => {
    return value < 0 ? 0 : value;
  };

  // Функция для определения цвета всех элементов
  const getProgressColor = (
    status: string
  ): "blue" | "green" | "gray" | "amber" | "purple" | "red" => {
    switch (status) {
      case "downloading":
        return "blue";
      case "completed":
        return "green";
      case "seeding":
        return "blue";
      case "checking":
        return "amber";
      case "queued":
        return "purple";
      default:
        return "gray";
    }
  };

  // Функция для получения класса в зависимости от статуса
  const getCardClassName = (): string => {
    return `${styles.card} ${
      styles[`card${status.charAt(0).toUpperCase()}${status.slice(1)}`]
    }`;
  };

  return (
    <>
      <Card variant="surface" className={getCardClassName()}>
        <Flex gap="3" align="start">
          <Box pt="1">
            <Checkbox
              size="1"
              checked={selected}
              onCheckedChange={() => onSelect(id)}
              aria-label={t("torrents.selectTorrent", name)}
            />
          </Box>

          <Box className={styles.contentBox}>
            <Flex justify="between" align="start" mb="2">
              <Text
                as="span"
                size="2"
                weight="medium"
                className={styles.textEllipsis}
                title={name}
              >
                {name}
              </Text>

              <Badge
                variant="surface"
                size="1"
                title={t("torrent.uploadRatio")}
              >
                {t("torrent.ratio")}: {normalizeValue(uploadRatio).toFixed(2)}
              </Badge>
            </Flex>

            <Flex gap="2" align="center" mb="2">
              <Badge variant="soft" size="1" color={getProgressColor(status)}>
                {getStatusText(status)}
              </Badge>
              <Text size="1">{progress.toFixed(1)}%</Text>
            </Flex>

            <Progress
              size="1"
              variant="surface"
              value={progress}
              className={styles.progressWrapper}
              color={getProgressColor(status)}
            />

            <Flex wrap="wrap" gap="3" justify="between">
              <Flex wrap="wrap" gap="3">
                <Flex gap="1" align="center">
                  <Text size="1" weight="medium">
                    {t("torrent.size")}:
                  </Text>
                  <Text size="1">{sizeFormatted}</Text>
                </Flex>

                <Flex gap="1" align="center">
                  <Text size="1" weight="medium">
                    {t("torrent.seeds")}:
                  </Text>
                  <Text size="1">
                    {normalizeValue(seedsConnected)}/
                    {normalizeValue(seedsTotal)}
                  </Text>
                </Flex>

                <Flex gap="1" align="center">
                  <Text size="1" weight="medium">
                    {t("torrent.peers")}:
                  </Text>
                  <Text size="1">
                    {normalizeValue(peersConnected)}/
                    {normalizeValue(peersTotal)}
                  </Text>
                </Flex>

                <Flex gap="1" align="center">
                  <Text size="1" weight="medium">
                    {t("torrent.uploaded")}:
                  </Text>
                  <Text size="1">{uploadedFormatted}</Text>
                </Flex>
              </Flex>

              <Flex justify="between" gap="3" align="center">
                <Flex gap="1" align="center">
                  <ArrowDownIcon
                    width={16}
                    height={16}
                    className={styles.downloadIcon}
                  />
                  <Text size="1">{downloadSpeedFormatted}</Text>
                  <ArrowUpIcon
                    width={16}
                    height={16}
                    className={styles.uploadIcon}
                  />
                  <Text size="1">{uploadSpeedFormatted}</Text>
                </Flex>

                <Flex className={styles.actions}>
                  <IconButton
                    size="2"
                    variant="soft"
                    onClick={() => setShowContent(true)}
                    title={t("torrent.viewContent")}
                  >
                    <FolderIcon width={16} height={16} />
                  </IconButton>

                  {renderActionButton()}

                  {onSetSpeedLimit && (
                    <IconButton
                      size="2"
                      variant="soft"
                      onClick={() => onSetSpeedLimit(id, !isSlowMode)}
                      title={t(
                        isSlowMode ? "torrent.normalSpeed" : "torrent.slowSpeed"
                      )}
                      color={isSlowMode ? "amber" : undefined}
                    >
                      <SnailIcon style={{ width: 16, height: 16 }} />
                    </IconButton>
                  )}

                  <IconButton
                    size="2"
                    variant="soft"
                    color="red"
                    onClick={() => setShowDeleteConfirmation(true)}
                    title={t("torrent.remove")}
                  >
                    <TrashIcon width={16} height={16} />
                  </IconButton>
                </Flex>
              </Flex>
            </Flex>
          </Box>
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
