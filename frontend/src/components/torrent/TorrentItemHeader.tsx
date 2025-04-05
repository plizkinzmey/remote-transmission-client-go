import React from "react";
import { Flex, Text, Badge } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { formatRatio } from "../../utils/formatters";
import styles from "../../styles/TorrentItem.module.css";
import { getStatusData } from "../../utils/torrentStatus";

interface TorrentItemHeaderProps {
  name: string;
  status: string;
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
        >
          {name}
        </Text>
        <Badge variant="surface" size="1" title={t("torrent.uploadRatio")}>
          {t("torrent.ratio")}: {formatRatio(uploadRatio)}
        </Badge>
      </Flex>

      <Flex gap="2" align="center" mb="2">
        <Badge variant="soft" size="1" color={color}>
          {t(`torrent.status.${status}`)}
        </Badge>
        <Text size="1">{progress.toFixed(1)}%</Text>
      </Flex>
    </>
  );
};
