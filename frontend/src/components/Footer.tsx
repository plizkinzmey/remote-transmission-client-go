import React from "react";
import { Flex, Box, Text } from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner } from "./LoadingSpinner";

interface FooterProps {
  totalDownloadSpeed?: number;
  totalUploadSpeed?: number;
  freeSpace?: number;
  transmissionVersion?: string;
}

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

export const Footer: React.FC<FooterProps> = ({
  totalDownloadSpeed,
  totalUploadSpeed,
  freeSpace,
  transmissionVersion,
}) => {
  const { t } = useLocalization();

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      style={{
        background: "var(--card-background)",
        borderTop: "1px solid var(--border-color)",
        zIndex: 100,
        height: "36px",
        backdropFilter: "blur(10px)",
      }}
    >
      <Flex
        justify="between"
        align="center"
        px="4"
        py="1"
        style={{ height: "100%" }}
      >
        <Flex gap="4" align="center" style={{ minWidth: "200px" }}>
          <Flex align="center" gap="1">
            {totalDownloadSpeed === undefined ? (
              <LoadingSpinner size="small" />
            ) : (
              <Flex align="center" gap="1">
                <ArrowDownIcon width={18} height={18} />
                <Text size="1" color="gray">
                  {formatSpeed(totalDownloadSpeed)}
                </Text>
              </Flex>
            )}
          </Flex>

          <Flex align="center" gap="1">
            {totalUploadSpeed === undefined ? (
              <LoadingSpinner size="small" />
            ) : (
              <Flex align="center" gap="1">
                <ArrowUpIcon width={18} height={18} />
                <Text size="1" color="gray">
                  {formatSpeed(totalUploadSpeed)}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>

        <Flex align="center" style={{ minWidth: "150px" }}>
          {freeSpace === undefined ? (
            <LoadingSpinner size="small" />
          ) : (
            <Text size="1" color="gray">
              {t("footer.freeSpace")} {formatSize(freeSpace)}
            </Text>
          )}
        </Flex>

        <Flex align="center" style={{ minWidth: "150px" }}>
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
