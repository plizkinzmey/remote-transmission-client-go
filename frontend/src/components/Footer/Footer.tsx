import React from "react";
import { Flex, Box, Text } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../LoadingSpinner";
import styles from "./Footer.module.css";

/**
 * Форматирует скорость в удобочитаемый вид с единицами измерения
 * @param speed - Скорость в байтах в секунду
 * @returns Отформатированная строка со скоростью (например, "1.24 MB/s")
 */
const formatSpeed = (speed?: number): string => {
  if (speed === undefined) return "-";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let value = speed;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Форматирует размер в удобочитаемый вид с единицами измерения
 * @param size - Размер в байтах
 * @returns Отформатированная строка с размером (например, "1.24 GB")
 */
const formatSize = (size?: number): string => {
  if (size === undefined) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Пропсы компонента Footer
 */
export interface FooterProps {
  /** Общая скорость загрузки в байтах в секунду */
  totalDownloadSpeed?: number;
  /** Общая скорость отдачи в байтах в секунду */
  totalUploadSpeed?: number;
  /** Свободное место на диске в байтах */
  freeSpace?: number;
  /** Версия Transmission */
  transmissionVersion?: string;
}

/**
 * Компонент Footer отображает информацию о текущей скорости загрузки/отдачи,
 * свободном месте на диске и версии Transmission
 */
export const Footer: React.FC<FooterProps> = ({
  totalDownloadSpeed,
  totalUploadSpeed,
  freeSpace,
  transmissionVersion,
}) => {
  const { t } = useLocalization();

  return (
    <Box className={styles.footer} data-testid="footer">
      <Flex
        justify="between"
        align="center"
        px="4"
        py="1"
        className={styles.container}
      >
        <Flex gap="4" align="center" className={styles.statsBlock}>
          <Flex align="center" gap="1" data-testid="download-speed-block">
            {totalDownloadSpeed === undefined ? (
              <LoadingSpinner size="small" />
            ) : (
              <Flex align="center" gap="1" className={styles.speedWrapper}>
                <ArrowDownIcon className={styles.speedIcon} />
                <Text size="1" color="gray">
                  {formatSpeed(totalDownloadSpeed)}
                </Text>
              </Flex>
            )}
          </Flex>

          <Flex align="center" gap="1" data-testid="upload-speed-block">
            {totalUploadSpeed === undefined ? (
              <LoadingSpinner size="small" />
            ) : (
              <Flex align="center" gap="1" className={styles.speedWrapper}>
                <ArrowUpIcon className={styles.speedIcon} />
                <Text size="1" color="gray">
                  {formatSpeed(totalUploadSpeed)}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>

        <Flex align="center" className={styles.infoBlock} data-testid="free-space-block">
          {freeSpace === undefined ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text size="1" color="gray">
              {t("footer.freeSpace")} {formatSize(freeSpace)}
            </Text>
          )}
        </Flex>

        <Flex align="center" className={styles.infoBlock} data-testid="version-block">
          {transmissionVersion === undefined ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text size="1" color="gray">
              {t("footer.version")} {transmissionVersion}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};