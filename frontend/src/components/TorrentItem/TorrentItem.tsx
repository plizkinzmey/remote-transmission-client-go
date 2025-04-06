import { useState, useEffect } from "react";
import { Card, Flex, Box, Checkbox } from "@radix-ui/themes";
import { DeleteDialog } from "../DeleteDialog";
import { TorrentContent } from "../TorrentContent";
import { useLocalization } from "../../contexts/LocalizationContext";
import { TorrentItemHeader } from "./TorrentItemHeader";
import { TorrentItemProgress } from "./TorrentItemProgress";
import { TorrentItemStats } from "./TorrentItemStats";
import { TorrentItemActions } from "./TorrentItemActions";
import {
  getCardClassName,
  isBlocked,
  isChecking,
} from "../../utils/torrentStatus";
import styles from "./TorrentItem.module.css";

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

  // Состояние, при котором карточка должна быть заблокирована
  const isCurrentlyBlocked = isBlocked(status);

  useEffect(() => {
    if (!isLoading || !lastAction) return;

    if (lastAction === "verify" && isChecking(status)) {
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
  }, [status, lastAction, isLoading]);

  const handleAction = (action: "start" | "stop" | "verify") => {
    if (isChecking(status)) return;

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

  const handleViewContent = () => setShowContent(true);
  const handleDeleteClick = () => setShowDeleteConfirmation(true);

  return (
    <>
      <Card
        variant="surface"
        className={getCardClassName(status, "card", styles)}
      >
        <Flex gap="3" align="start">
          <Box pt="1">
            <Checkbox
              size="1"
              checked={selected}
              onCheckedChange={() => onSelect(id)}
              aria-label={t("torrents.selectTorrent", name)}
              disabled={isCurrentlyBlocked}
            />
          </Box>
          <Box className={styles.contentBox}>
            <TorrentItemHeader
              name={name}
              status={status}
              progress={progress}
              uploadRatio={uploadRatio}
            />

            <TorrentItemProgress progress={progress} status={status} />

            <Flex wrap="wrap" gap="3" justify="between">
              <TorrentItemStats
                sizeFormatted={sizeFormatted}
                seedsConnected={seedsConnected}
                seedsTotal={seedsTotal}
                peersConnected={peersConnected}
                peersTotal={peersTotal}
                uploadedFormatted={uploadedFormatted}
                downloadSpeedFormatted={downloadSpeedFormatted}
                uploadSpeedFormatted={uploadSpeedFormatted}
              />
              <TorrentItemActions
                id={id}
                status={status}
                isLoading={isLoading}
                lastAction={lastAction}
                isSlowMode={isSlowMode}
                onViewContent={handleViewContent}
                onStart={() => handleAction("start")}
                onStop={() => handleAction("stop")}
                onRemove={handleDeleteClick}
                onVerify={onVerify ? () => handleAction("verify") : undefined}
                onSetSpeedLimit={onSetSpeedLimit}
              />
            </Flex>
          </Box>
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
