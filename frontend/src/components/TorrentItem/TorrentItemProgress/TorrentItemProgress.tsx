import React from "react";
import { Progress } from "@radix-ui/themes";
import { getStatusData } from "../../../utils/torrentStatus";
import styles from "./TorrentItemProgress.module.css";

export interface TorrentItemProgressProps {
  progress: number;
  status: string;
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
