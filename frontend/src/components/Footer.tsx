import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

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
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-top: 1px solid var(--border-color);
  z-index: 100;
  height: 36px;
  backdrop-filter: blur(10px);
`;

const SpeedInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SpeedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: ${(props: { loading?: boolean }) => (props.loading ? "0.5" : "1")};
  transition: opacity 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Footer: React.FC<FooterProps> = ({
  totalDownloadSpeed,
  totalUploadSpeed,
  freeSpace,
  transmissionVersion,
}) => {
  const { t } = useLocalization();

  const formatSpeed = (bytesPerSecond?: number): string => {
    if (bytesPerSecond === undefined) return "- KB/s";
    const units = ["B/s", "KB/s", "MB/s", "GB/s"];
    let value = bytesPerSecond;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatBytes = (bytes?: number): string => {
    if (bytes === undefined) return "- GB";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <FooterContainer>
      <SpeedInfo>
        <SpeedItem loading={totalDownloadSpeed === undefined}>
          <ArrowDownIcon />
          {formatSpeed(totalDownloadSpeed)}
        </SpeedItem>
        <SpeedItem loading={totalUploadSpeed === undefined}>
          <ArrowUpIcon />
          {formatSpeed(totalUploadSpeed)}
        </SpeedItem>
      </SpeedInfo>
      <div>
        {t("footer.freeSpace", formatBytes(freeSpace))}
      </div>
      <div>
        {t("footer.version", transmissionVersion ?? "?")}
      </div>
    </FooterContainer>
  );
};
