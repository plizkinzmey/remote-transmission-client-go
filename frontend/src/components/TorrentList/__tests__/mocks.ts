import { vi } from "vitest";
import { TorrentData } from "../types";

export const mockTorrents: TorrentData[] = [
  {
    ID: 1,
    Name: "Ubuntu 22.04",
    Status: "downloading",
    Progress: 45.5,
    Size: 3865470464,
    SizeFormatted: "3.6 GB",
    UploadRatio: 0,
    SeedsConnected: 10,
    SeedsTotal: 100,
    PeersConnected: 5,
    PeersTotal: 50,
    UploadedBytes: 0,
    UploadedFormatted: "0 B",
    DownloadSpeed: 1048576,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "1.0 MB/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false,
  },
  {
    ID: 2,
    Name: "Debian 12",
    Status: "seeding",
    Progress: 100,
    Size: 4294967296,
    SizeFormatted: "4.0 GB",
    UploadRatio: 1.5,
    SeedsConnected: 0,
    SeedsTotal: 0,
    PeersConnected: 3,
    PeersTotal: 10,
    UploadedBytes: 6442450944,
    UploadedFormatted: "6.0 GB",
    DownloadSpeed: 0,
    UploadSpeed: 524288,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "512 KB/s",
    IsSlowMode: true,
  },
];

export const mockCallbacks = {
  onSelect: vi.fn(),
  onRemove: vi.fn(),
  onStart: vi.fn(),
  onStop: vi.fn(),
  onVerify: vi.fn(),
  onSetSpeedLimit: vi.fn(),
};
