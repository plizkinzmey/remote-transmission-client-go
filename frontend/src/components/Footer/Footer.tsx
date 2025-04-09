import React from "react";
import { Flex, Box, Text } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../LoadingSpinner";
import { formatTransferSpeed, formatStorageSize } from "../../utils/formatters";
import styles from "./Footer.module.css";

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
                  {formatTransferSpeed(totalDownloadSpeed)}
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
                  {formatTransferSpeed(totalUploadSpeed)}
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
              {t("footer.freeSpace")} {formatStorageSize(freeSpace)}
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