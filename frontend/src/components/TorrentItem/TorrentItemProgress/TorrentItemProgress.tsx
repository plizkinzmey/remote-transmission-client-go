import React from "react";
import { Progress } from "@radix-ui/themes";
import { getStatusData, StatusType } from "../../../utils/torrentStatus"; // Импортируем StatusType
import styles from "./TorrentItemProgress.module.css";

export interface TorrentItemProgressProps {
  progress: number;
  status: StatusType; // <-- Изменяем тип на StatusType
}

/**
 * Компонент для отображения прогресса загрузки торрента
 */
export const TorrentItemProgress: React.FC<TorrentItemProgressProps> = ({
  progress,
  status,
}) => {
  const { color } = getStatusData(status);

  return (
    <Progress
      size="1"
      variant="surface"
      value={progress}
      className={styles.progressWrapper}
      color={color}
      data-testid="torrent-progress" // Add data-testid
    />
  );
};
