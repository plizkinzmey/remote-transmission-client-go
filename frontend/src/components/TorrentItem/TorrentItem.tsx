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

/**
 * @description Пропсы для компонента TorrentItem.
 */
export interface TorrentItemProps {
  /** @description Уникальный идентификатор торрента. */
  id: number;
  /** @description Имя торрента. */
  name: string;
  /** @description Текущий статус торрента (например, 'stopped', 'downloading'). */
  status: string;
  /** @description Прогресс загрузки торрента в процентах (0-100). */
  progress: number;
  /** @description Отформатированный размер торрента (например, '100 MB'). */
  sizeFormatted: string;
  /** @description Коэффициент раздачи. */
  uploadRatio: number;
  /** @description Количество подключенных сидов. */
  seedsConnected: number;
  /** @description Общее количество сидов. */
  seedsTotal: number;
  /** @description Количество подключенных пиров. */
  peersConnected: number;
  /** @description Общее количество пиров. */
  peersTotal: number;
  /** @description Отформатированный объем отданного (например, '50 MB'). */
  uploadedFormatted: string;
  /** @description Выбран ли торрент. */
  selected: boolean;
  /** @description Обработчик выбора/снятия выбора торрента. */
  onSelect: (id: number) => void;
  /** @description Обработчик удаления торрента. */
  onRemove: (id: number, deleteData: boolean) => void;
  /** @description Обработчик запуска торрента. */
  onStart: (id: number) => void;
  /** @description Обработчик остановки торрента. */
  onStop: (id: number) => void;
  /** @description Обработчик проверки торрента (опционально). */
  onVerify?: (id: number) => void;
  /** @description Отформатированная скорость загрузки (например, '1 MB/s'). */
  downloadSpeedFormatted: string;
  /** @description Отформатированная скорость отдачи (например, '500 KB/s'). */
  uploadSpeedFormatted: string;
  /** @description Обработчик установки ограничения скорости (опционально). */
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
  /** @description Включен ли режим ограничения скорости (опционально). */
  isSlowMode?: boolean;
  /** @description Атрибут data-testid для корневого элемента компонента (опционально). */
  "data-testid"?: string;
}

/**
 * @description Компонент для отображения элемента списка торрентов.
 * Показывает основную информацию о торренте и предоставляет действия для управления им.
 */
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
  "data-testid": dataTestId,
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

    // Обработка сброса для 'verify' только при статусе 'checking'
    if (lastAction === "verify") {
      if (isChecking(status)) {
        setIsLoading(false);
        setLastAction(null);
      }
      // Не сбрасываем состояние немедленно для 'verify'
      return;
    }

    // Определяем, нужно ли сбрасывать состояние загрузки для 'start' или 'stop'
    // Сброс происходит, когда статус изменился после соответствующего действия
    const shouldResetLoading =
      (lastAction === "start" && status !== "stopped") || // Если стартовали, а статус уже не stopped
      (lastAction === "stop" && !["downloading", "seeding"].includes(status)); // Если остановили, а статус уже не downloading/seeding

    // Сбрасываем isLoading, если статус изменился после действия
    if (shouldResetLoading) {
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
        data-testid={dataTestId}
      >
        <Flex gap="3" align="start">
          <Box pt="1">
            <Checkbox
              size="1"
              checked={selected}
              onCheckedChange={() => onSelect(id)}
              aria-label={t("torrents.selectTorrent", name)}
              disabled={isCurrentlyBlocked || isChecking(status)}
              data-testid={`torrent-item-checkbox-${id}`}
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

      <TorrentContent
        id={id}
        name={name}
        open={showContent}
        onClose={() => setShowContent(false)}
      />
    </>
  );
};
