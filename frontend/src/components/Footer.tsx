import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { LoadingSpinner } from "./LoadingSpinner";

interface FooterProps {
  totalDownloadSpeed?: number;
  totalUploadSpeed?: number;
  freeSpace?: number;
  transmissionVersion?: string;
}

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card-background);
  color: var(--text-primary);
  padding: 8px 16px;
  display: grid;
  grid-template-columns: minmax(200px, auto) minmax(150px, auto) minmax(
      150px,
      auto
    );
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-top: 1px solid var(--border-color);
  z-index: 100;
  height: 36px;
  backdrop-filter: blur(10px);
  user-select: none;
  -webkit-user-select: none;
`;

const SpeedInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  overflow: hidden;
  white-space: nowrap;
`;

const SpeedItem = styled.div<{ loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 90px;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const StatItem = styled.div<{ loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  min-width: 150px;
`;

const StatsText = styled.span`
  font-size: 13px;
  margin: 0 16px;
  color: var(--text-secondary);
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
`;

const SpeedText = styled.span`
  font-size: 13px;
  color: var(--text-secondary);
  margin-right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
`;

const IconText = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
`;

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
    <FooterContainer>
      <SpeedInfo>
        <SpeedItem loading={totalDownloadSpeed === undefined}>
          {totalDownloadSpeed === undefined ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <ArrowDownIcon />
              {formatSpeed(totalDownloadSpeed)}
            </>
          )}
        </SpeedItem>
        <SpeedItem loading={totalUploadSpeed === undefined}>
          {totalUploadSpeed === undefined ? (
            <LoadingSpinner size="small" />
          ) : (
            <>
              <ArrowUpIcon />
              {formatSpeed(totalUploadSpeed)}
            </>
          )}
        </SpeedItem>
      </SpeedInfo>
      <StatItem loading={freeSpace === undefined}>
        {freeSpace === undefined ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            {t("footer.freeSpace")} {formatSize(freeSpace)}
          </>
        )}
      </StatItem>
      <StatItem loading={transmissionVersion === undefined}>
        {transmissionVersion === undefined ? (
          <LoadingSpinner size="small" />
        ) : (
          <>
            {t("footer.version")} {transmissionVersion}
          </>
        )}
      </StatItem>
    </FooterContainer>
  );
};
