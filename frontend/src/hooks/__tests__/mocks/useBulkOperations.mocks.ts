import { vi, Mock } from "vitest";
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import {
  StartTorrents,
  StopTorrents,
  RemoveTorrent,
  SetTorrentSpeedLimit,
} from "@wailsjs/go/main/App";

// Экспортируем типизированные моки
export const mockUseLocalization = useLocalization as Mock;
export const mockStartTorrents = StartTorrents as Mock;
export const mockStopTorrents = StopTorrents as Mock;
export const mockRemoveTorrent = RemoveTorrent as Mock;
export const mockSetTorrentSpeedLimit = SetTorrentSpeedLimit as Mock;

// --- Mock Data ---
export const mockTorrentsBase: TorrentData[] = [
  {
    ID: 1,
    Name: "T1",
    Status: "stopped",
    Progress: 0,
    Size: 100,
    SizeFormatted: "100 B",
    UploadRatio: 0,
    SeedsConnected: 0,
    SeedsTotal: 0,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 0,
    UploadedFormatted: "0 B",
    DownloadSpeed: 0,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false,
  },
  {
    ID: 2,
    Name: "T2",
    Status: "downloading",
    Progress: 50,
    Size: 100,
    SizeFormatted: "100 B",
    UploadRatio: 0,
    SeedsConnected: 1,
    SeedsTotal: 1,
    PeersConnected: 1,
    PeersTotal: 1,
    UploadedBytes: 0,
    UploadedFormatted: "0 B",
    DownloadSpeed: 10240,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "10 B/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false,
  },
  {
    ID: 3,
    Name: "T3",
    Status: "seeding",
    Progress: 100,
    Size: 200,
    SizeFormatted: "200 B",
    UploadRatio: 1,
    SeedsConnected: 1,
    SeedsTotal: 1,
    PeersConnected: 1,
    PeersTotal: 1,
    UploadedBytes: 200,
    UploadedFormatted: "200 B",
    DownloadSpeed: 0,
    UploadSpeed: 5120,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "5 B/s",
    IsSlowMode: false,
  },
  {
    ID: 4,
    Name: "T4",
    Status: "stopped",
    Progress: 0,
    Size: 200,
    SizeFormatted: "200 B",
    UploadRatio: 0,
    SeedsConnected: 0,
    SeedsTotal: 0,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 0,
    UploadedFormatted: "0 B",
    DownloadSpeed: 0,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false,
  },
];

export const mockConfig = {
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s" as const,
};

// --- Setup Function ---
export const setupMocks = () => {
  vi.resetAllMocks();
  mockUseLocalization.mockReturnValue({
    t: (key: string, ...args: any[]) =>
      `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
  });
  // Убедимся, что все моки Wails возвращают Promise
  mockStartTorrents.mockResolvedValue(undefined);
  mockStopTorrents.mockResolvedValue(undefined);
  mockRemoveTorrent.mockResolvedValue(undefined);
  mockSetTorrentSpeedLimit.mockResolvedValue(undefined);
};
