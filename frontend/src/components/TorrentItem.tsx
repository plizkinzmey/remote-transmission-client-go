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
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { SnailIcon } from "./icons/SnailIcon";
import styles from "../styles/TorrentItem.module.css";

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  sizeFormatted: string;
  uploadRatio: number;
  seedsConnected: number;
  seedsTotal: number;
  peersConnected: number;
  peersTotal: number;
  uploadedFormatted: string;
  selected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onVerify?: (id: number) => void;
  downloadSpeedFormatted: string;
  uploadSpeedFormatted: string;
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
  isSlowMode?: boolean;
}

type StatusType =
  | "downloading"
  | "seeding"
  | "stopped"
  | "completed"
  | "checking"
  | "queued";
type ColorType =
  | "blue"
  | "grass"
  | "gray"
  | "amber"
  | "purple"
  | "mint"
  | "tomato";

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  sizeFormatted,
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
  onVerify,
  downloadSpeedFormatted,
  uploadSpeedFormatted,
  onSetSpeedLimit,
  isSlowMode = false,
}) => {
  const { t } = useLocalization();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<
    "start" | "stop" | "verify" | null
  >(null);

  const isRunning = ["downloading", "seeding"].includes(status);
  const isChecking = status === "checking";
  const isQueued = status === "queuedCheck" || status === "queuedDownload";

  // Состояние, при котором карточка должна быть заблокирована
  const isBlocked = isChecking || isQueued;

  useEffect(() => {
    if (!isLoading || !lastAction) return;

    if (lastAction === "verify" && isChecking) {
      setIsLoading(false);
      setLastAction(null);
      return;
    }

    const canPerformAction =
      (lastAction === "start" && status === "stopped") ||
      (lastAction === "stop" && ["downloading", "seeding"].includes(status));

    if (!canPerformAction) {
      setIsLoading(false);
      setLastAction(null);
    }
  }, [status, lastAction, isLoading, isChecking]);

  const handleAction = (action: "start" | "stop" | "verify") => {
    if (isChecking) return;

    setIsLoading(true);
    setLastAction(action);

    if (action === "start") {
      onStart(id);
    } else if (action === "stop") {
      onStop(id);
    } else if (action === "verify" && onVerify) {
      onVerify(id);
    }
  };

  const normalizeValue = (value: number): number => (value < 0 ? 0 : value);

  const getStatusData = (
    status: string
  ): { text: string; color: ColorType } => {
    const statusMap: Record<string, { color: ColorType }> = {
      downloading: { color: "blue" },
      seeding: { color: "grass" },
      completed: { color: "mint" },
      checking: { color: "amber" },
      queued: { color: "purple" },
      queuedCheck: { color: "purple" },
      queuedDownload: { color: "purple" },
      stopped: { color: "gray" },
    };

    return {
      text: t(`torrent.status.${status}`),
      color: statusMap[status]?.color || "gray",
    };
  };

  const getCardClassName = (): string => {
    const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
    const statusClassName = "card" + statusCapitalized;
    return `${styles.card} ${styles[statusClassName]}`;
  };

  const renderActionButton = () => {
    if (isLoading && lastAction !== "verify") {
      return (
        <IconButton disabled variant="soft" color="gray">
          <LoadingSpinner size="small" />
        </IconButton>
      );
    }

    if (isRunning) {
      return (
        <IconButton
          size="2"
          variant="solid"
          color="amber"
          onClick={() => handleAction("stop")}
          title={t("torrent.stop")}
          disabled={isBlocked}
        >
          <PauseIcon width={16} height={16} />
        </IconButton>
      );
    }

    return (
      <IconButton
        size="2"
        variant="soft"
        color="grass"
        onClick={() => handleAction("start")}
        title={t("torrent.start")}
        disabled={isBlocked}
      >
        <PlayIcon width={16} height={16} />
      </IconButton>
    );
  };

  const renderVerifyButton = () => {
    if (!onVerify) return null;

    if (isChecking || isQueued) {
      return (
        <IconButton
          size="2"
          variant="solid"
          color="amber"
          disabled
          title={t(
            isChecking ? "torrent.verifying" : `torrent.status.${status}`
          )}
        >
          <LoadingSpinner size="small" />
        </IconButton>
      );
    }

    return (
      <IconButton
        size="2"
        variant="soft"
        color="orange"
        onClick={() => handleAction("verify")}
        title={t("torrent.verify")}
        disabled={isLoading || isBlocked}
      >
        <CheckCircleIcon width={16} height={16} />
      </IconButton>
    );
  };

  const renderSpeedLimitButton = () => {
    if (!onSetSpeedLimit) return null;

    return (
      <IconButton
        size="2"
        variant={isSlowMode ? "solid" : "soft"}
        color={isSlowMode ? "orange" : "blue"}
        onClick={() => onSetSpeedLimit(id, !isSlowMode)}
        title={t(isSlowMode ? "torrent.normalSpeed" : "torrent.slowSpeed")}
        disabled={isChecking}
      >
        <SnailIcon style={{ width: 16, height: 16 }} />
      </IconButton>
    );
  };

  const renderTorrentInfo = () => {
    const { color } = getStatusData(status);

    return (
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
          <Badge variant="surface" size="1" title={t("torrent.uploadRatio")}>
            {t("torrent.ratio")}: {normalizeValue(uploadRatio).toFixed(2)}
          </Badge>
        </Flex>

        <Flex gap="2" align="center" mb="2">
          <Badge variant="soft" size="1" color={color}>
            {t(`torrent.status.${status}`)}
          </Badge>
          <Text size="1">{progress.toFixed(1)}%</Text>
        </Flex>

        <Progress
          size="1"
          variant="surface"
          value={progress}
          className={styles.progressWrapper}
          color={color}
        />

        {renderStats()}
      </Box>
    );
  };

  const renderStats = () => (
    <Flex wrap="wrap" gap="3" justify="between">
      <Flex wrap="wrap" gap="3">
        {renderStatItem("size", sizeFormatted)}
        {renderStatItem(
          "seeds",
          `${normalizeValue(seedsConnected)}/${normalizeValue(seedsTotal)}`
        )}
        {renderStatItem(
          "peers",
          `${normalizeValue(peersConnected)}/${normalizeValue(peersTotal)}`
        )}
        {renderStatItem("uploaded", uploadedFormatted)}
      </Flex>

      <Flex justify="between" gap="3" align="center">
        {renderSpeedInfo()}
        {renderActions()}
      </Flex>
    </Flex>
  );

  const renderStatItem = (label: string, value: string) => (
    <Flex gap="1" align="center">
      <Text size="1" weight="medium">
        {t(`torrent.${label}`)}:
      </Text>
      <Text size="1">{value}</Text>
    </Flex>
  );

  const renderSpeedInfo = () => (
    <Flex gap="1" align="center">
      <ArrowDownIcon width={16} height={16} className={styles.downloadIcon} />
      <Text size="1">{downloadSpeedFormatted}</Text>
      <ArrowUpIcon width={16} height={16} className={styles.uploadIcon} />
      <Text size="1">{uploadSpeedFormatted}</Text>
    </Flex>
  );

  const renderActions = () => (
    <Flex className={styles.actions}>
      <IconButton
        size="2"
        variant="soft"
        color="indigo"
        onClick={() => setShowContent(true)}
        title={t("torrent.viewContent")}
        disabled={isBlocked}
      >
        <FolderIcon width={16} height={16} />
      </IconButton>

      {renderActionButton()}
      {renderSpeedLimitButton()}
      {renderVerifyButton()}

      <IconButton
        size="2"
        variant="soft"
        color="red"
        onClick={() => setShowDeleteConfirmation(true)}
        title={t("torrent.remove")}
        disabled={isBlocked}
      >
        <TrashIcon width={16} height={16} />
      </IconButton>
    </Flex>
  );

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
              disabled={isBlocked}
            />
          </Box>
          {renderTorrentInfo()}
        </Flex>
      </Card>

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
