import React from "react";
import { Flex, Text, Badge } from "@radix-ui/themes";
import { useLocalization } from "@contexts/LocalizationContext";
import { formatRatio } from "../../../utils/formatters";
import styles from "./TorrentItemHeader.module.css";
import { getStatusData, StatusType } from "../../../utils/torrentStatus";

export interface TorrentItemHeaderProps {
  name: string;
  status: StatusType;
  progress: number;
  uploadRatio: number;
}

/**
 * Компонент для отображения заголовка элемента торрента
 */
export const TorrentItemHeader: React.FC<TorrentItemHeaderProps> = ({
  name,
  status,
  progress,
  uploadRatio,
}) => {
  const { t } = useLocalization();
  const { color } = getStatusData(status);

  return (
    <>
      <Flex justify="between" align="start" mb="2">
        <Text
          as="span"
          size="2"
          weight="medium"
          className={styles.textEllipsis}
          title={name}
          data-testid="torrent-header-name"
        >
          {name}
        </Text>
        <Badge variant="surface" size="1" title={t("torrent.uploadRatio")} data-testid="torrent-header-ratio">
          {t("torrent.ratio")}: {formatRatio(uploadRatio)}
        </Badge>
      </Flex>

      <Flex gap="2" align="center" mb="2">
        <Badge variant="soft" size="1" color={color} data-testid="torrent-header-status">
          {t(`torrent.status.${status}`)}
        </Badge>
        <Text size="1" data-testid="torrent-header-progress">{progress.toFixed(1)}%</Text>
      </Flex>
    </>
  );
};
