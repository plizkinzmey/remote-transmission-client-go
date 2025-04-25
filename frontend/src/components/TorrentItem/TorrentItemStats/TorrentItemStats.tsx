import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { useLocalization } from "@contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { normalizeValue } from "../../../utils/formatters";
import styles from "./TorrentItemStats.module.css";

export interface TorrentItemStatsProps {
  sizeFormatted: string;
  seedsConnected: number;
  seedsTotal: number;
  peersConnected: number;
  peersTotal: number;
  uploadedFormatted: string;
  downloadSpeedFormatted: string;
  uploadSpeedFormatted: string;
}

/**
 * Компонент для отображения статистики торрента
 */
export const TorrentItemStats: React.FC<TorrentItemStatsProps> = ({
  sizeFormatted,
  seedsConnected,
  seedsTotal,
  peersConnected,
  peersTotal,
  uploadedFormatted,
  downloadSpeedFormatted,
  uploadSpeedFormatted,
}) => {
  const { t } = useLocalization();

  const renderStatItem = (label: string, value: string) => (
    <Flex gap="1" align="center" data-testid={`torrent-stat-${label}`}>
      <Text size="1" weight="medium">
        {t(`torrent.${label}`)}:
      </Text>
      <Text size="1">{value}</Text>
    </Flex>
  );

  const renderSpeedInfo = () => (
    <Flex gap="1" align="center" data-testid="torrent-stat-speed">
      <ArrowDownIcon width={16} height={16} className={styles.downloadIcon} data-testid="download-icon" />
      <Text size="1" data-testid="download-speed">{downloadSpeedFormatted}</Text>
      <ArrowUpIcon width={16} height={16} className={styles.uploadIcon} data-testid="upload-icon" />
      <Text size="1" data-testid="upload-speed">{uploadSpeedFormatted}</Text>
    </Flex>
  );

  return (
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
      {renderSpeedInfo()}
    </Flex>
  );
};
