import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";

interface FooterProps {
  totalDownloadSpeed: number;
  totalUploadSpeed: number;
  freeSpace: number;
  transmissionVersion: string;
}

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  color: #ffffff;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  border-top: 1px solid #2c3e50;
  z-index: 100;
  height: 36px;
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

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DiskSpace = styled.div`
  color: #95a5a6;
  display: flex;
  align-items: center;
`;

const Version = styled.div`
  color: #95a5a6;
`;

export const Footer: React.FC<FooterProps> = ({
  totalDownloadSpeed,
  totalUploadSpeed,
  freeSpace,
  transmissionVersion,
}) => {
  const { t } = useLocalization();

  const formatSpeed = (bytes: number): string => {
    if (bytes <= 0) return "0 B/s";
    const units = ["B/s", "KiB/s", "MiB/s", "GiB/s"];
    const exp = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    return `${(bytes / Math.pow(1024, exp)).toFixed(1)} ${units[exp]}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    const exp = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    return `${(bytes / Math.pow(1024, exp)).toFixed(1)} ${units[exp]}`;
  };

  return (
    <FooterContainer>
      <SpeedInfo>
        <SpeedItem>
          <ArrowDownIcon />
          {formatSpeed(totalDownloadSpeed || 0)}
        </SpeedItem>
        <SpeedItem>
          <ArrowUpIcon />
          {formatSpeed(totalUploadSpeed || 0)}
        </SpeedItem>
      </SpeedInfo>
      <DiskSpace>
        {t("footer.freeSpace", formatBytes(freeSpace || 0))}
      </DiskSpace>
      <Version>{t("footer.version", transmissionVersion || "?")}</Version>
    </FooterContainer>
  );
};
