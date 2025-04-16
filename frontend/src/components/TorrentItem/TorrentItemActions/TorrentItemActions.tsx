import React from "react";
import { Flex, IconButton } from "@radix-ui/themes";
import { useLocalization } from "../../../contexts/LocalizationContext";
import { LoadingSpinner } from "../../LoadingSpinner";
import {
  isBlocked,
  isRunning,
  isChecking,
  isQueued,
} from "../../../utils/torrentStatus";
import { SnailIcon } from "../../icons/SnailIcon";
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  FolderIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import styles from "./TorrentItemActions.module.css";

export interface TorrentItemActionsProps {
  id: number;
  status: string;
  isLoading: boolean;
  lastAction: "start" | "stop" | "verify" | null;
  isSlowMode: boolean;
  onViewContent: () => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onRemove: (id: number) => void;
  onVerify?: (id: number) => void;
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
}

/**
 * Компонент для отображения кнопок действий с торрентом
 */
export const TorrentItemActions: React.FC<TorrentItemActionsProps> = ({
  id,
  status,
  isLoading,
  lastAction,
  isSlowMode,
  onViewContent,
  onStart,
  onStop,
  onRemove,
  onVerify,
  onSetSpeedLimit,
}) => {
  const { t } = useLocalization();
  const isCheckingOrQueued = isChecking(status) || isQueued(status);
  const isCurrentlyBlocked = isBlocked(status);

  // Кнопка запуска/остановки торрента
  const renderActionButton = () => {
    if (isLoading && lastAction !== "verify") {
      return (
        <IconButton disabled variant="soft" color="gray" data-testid="torrent-actions-action-loading">
          <LoadingSpinner size="small" />
        </IconButton>
      );
    }

    if (isRunning(status)) {
      return (
        <IconButton
          size="2"
          variant="solid"
          color="amber"
          onClick={() => onStop(id)}
          title={t("torrent.stop")}
          disabled={isCurrentlyBlocked}
          data-testid="torrent-actions-action-pause"
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
        onClick={() => onStart(id)}
        title={t("torrent.start")}
        disabled={isCurrentlyBlocked}
        data-testid="torrent-actions-action-start"
      >
        <PlayIcon width={16} height={16} />
      </IconButton>
    );
  };

  // Кнопка проверки торрента
  const renderVerifyButton = () => {
    if (!onVerify) return null;

    if (isCheckingOrQueued) {
      return (
        <IconButton
          size="2"
          variant="solid"
          color="amber"
          disabled
          title={t(
            isChecking(status)
              ? "torrent.verifying"
              : `torrent.status.${status}`
          )}
          data-testid="torrent-actions-verify-loading"
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
        onClick={() => onVerify(id)}
        title={t("torrent.verify")}
        disabled={isLoading || isCurrentlyBlocked}
        data-testid="torrent-actions-verify"
      >
        <CheckCircleIcon width={16} height={16} />
      </IconButton>
    );
  };

  // Кнопка ограничения скорости
  const renderSpeedLimitButton = () => {
    if (!onSetSpeedLimit) return null;

    return (
      <IconButton
        size="2"
        variant={isSlowMode ? "solid" : "soft"}
        color={isSlowMode ? "orange" : "blue"}
        onClick={() => onSetSpeedLimit(id, !isSlowMode)}
        title={t(isSlowMode ? "torrent.normalSpeed" : "torrent.slowSpeed")}
        disabled={isChecking(status) || status === "queuedCheck"}
        data-testid="torrent-actions-speed-limit"
      >
        <SnailIcon style={{ width: 16, height: 16 }} />
      </IconButton>
    );
  };

  return (
    <Flex className={styles.actions}>
      <IconButton
        size="2"
        variant="soft"
        color="indigo"
        onClick={onViewContent}
        title={t("torrent.viewContent")}
        disabled={isCurrentlyBlocked}
        data-testid="torrent-actions-view-content"
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
        onClick={() => onRemove(id)}
        title={t("torrent.remove")}
        disabled={isCurrentlyBlocked}
        data-testid="torrent-actions-remove"
      >
        <TrashIcon width={16} height={16} />
      </IconButton>
    </Flex>
  );
};
