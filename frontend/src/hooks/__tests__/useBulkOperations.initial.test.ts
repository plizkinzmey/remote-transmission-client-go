import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import {
  StartTorrents,
  StopTorrents,
  RemoveTorrent,
  SetTorrentSpeedLimit,
} from "@wailsjs/go/main/App";

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
// Моки API не используются в этом файле, но оставляем для консистентности структуры
const mockStartTorrents = StartTorrents as Mock;
const mockStopTorrents = StopTorrents as Mock;
const mockRemoveTorrent = RemoveTorrent as Mock;
const mockSetTorrentSpeedLimit = SetTorrentSpeedLimit as Mock;

// --- Mock Data ---
const mockTorrents: TorrentData[] = [
  {
    ID: 1,
    Name: "Torrent 1",
    Status: "stopped",
    Progress: 50,
    Size: 1024,
    SizeFormatted: "1 KiB",
    UploadRatio: 0.5,
    SeedsConnected: 1,
    SeedsTotal: 10,
    PeersConnected: 5,
    PeersTotal: 20,
    UploadedBytes: 512,
    UploadedFormatted: "512 B",
    DownloadSpeed: 0,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false,
  },
]; // Достаточно одного для проверки инициализации

const mockConfig = {
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s" as const,
};

describe("useBulkOperations - Initial State", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    mockUseLocalization.mockReturnValue({
      t: (key: string, ...args: any[]) =>
        `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
    });
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrents,
        new Set(),
        mockRefreshTorrents,
        mockConfig
      )
    );

    expect(result.current.bulkOperations).toEqual({
      start: false,
      stop: false,
      remove: false,
      speedLimit: false,
    });
    expect(result.current.error).toBeNull();
  });
});
