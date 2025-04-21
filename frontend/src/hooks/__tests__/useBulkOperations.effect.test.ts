import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import { StartTorrents, StopTorrents } from "@wailsjs/go/main/App"; // Импортируем нужные для этого файла

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
const mockStartTorrents = StartTorrents as Mock;
const mockStopTorrents = StopTorrents as Mock;

// --- Mock Data ---
const mockTorrentsBase: TorrentData[] = [
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

const mockConfig = {
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s" as const,
};

describe("useBulkOperations - useEffect completion tracking", () => {
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

  it("resets start flag when all started torrents change status", async () => {
    const selected = new Set([1, 4]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter(
      (t) => t.Status === "stopped"
    );

    const { result, rerender } = renderHook(
      ({ torrentsData }) =>
        useBulkOperations(
          torrentsData,
          selected,
          mockRefreshTorrents,
          mockConfig
        ),
      { initialProps: { torrentsData: initialTorrents } }
    );

    // 1. Start the operation
    await act(async () => {
      await result.current.handleStartSelected();
    });
    // Проверяем, что флаг установился (если были торренты для запуска)
    if (initialTorrents.length > 0) {
      expect(result.current.bulkOperations.start).toBe(true);
    }

    // 2. Simulate torrents updating their status after refresh
    const updatedTorrents: TorrentData[] = initialTorrents.map((t) => ({
      ...t,
      Status: "downloading", // Все перешли в downloading
      DownloadSpeedFormatted: "10 B/s",
      SeedsConnected: 1,
      PeersConnected: 1,
    }));
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for useEffect to run and reset the flag
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("resets stop flag when all stopped torrents change status", async () => {
    const selected = new Set([2, 3]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter(
      (t) => t.Status === "downloading" || t.Status === "seeding"
    );

    const { result, rerender } = renderHook(
      ({ torrentsData }) =>
        useBulkOperations(
          torrentsData,
          selected,
          mockRefreshTorrents,
          mockConfig
        ),
      { initialProps: { torrentsData: initialTorrents } }
    );

    // 1. Start the stop operation
    await act(async () => {
      await result.current.handleStopSelected();
    });
    if (initialTorrents.length > 0) {
      expect(result.current.bulkOperations.stop).toBe(true);
    }

    // 2. Simulate torrents updating status
    const updatedTorrents: TorrentData[] = initialTorrents.map((t) => ({
      ...t,
      Status: "stopped", // Все перешли в stopped
      DownloadSpeedFormatted: "0 B/s",
      UploadSpeedFormatted: "0 B/s",
      SeedsConnected: 0,
      PeersConnected: 0,
    }));
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for flag reset
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("does not reset flag if only some torrents change status", async () => {
    const selected = new Set([1, 4]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter(
      (t) => t.Status === "stopped"
    );

    const { result, rerender } = renderHook(
      ({ torrentsData }) =>
        useBulkOperations(
          torrentsData,
          selected,
          mockRefreshTorrents,
          mockConfig
        ),
      { initialProps: { torrentsData: initialTorrents } }
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });
    if (initialTorrents.length > 0) {
      expect(result.current.bulkOperations.start).toBe(true);
    }

    // Только один торрент изменил статус
    const updatedTorrents: TorrentData[] = initialTorrents.map((t, index) =>
      index === 0
        ? {
            ...t,
            Status: "downloading", // Первый изменился
            DownloadSpeedFormatted: "10 B/s",
            SeedsConnected: 1,
            PeersConnected: 1,
          }
        : t
    ); // Остальные остались stopped
    rerender({ torrentsData: updatedTorrents });

    // Флаг не должен сбрасываться сразу
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    if (initialTorrents.length > 0) {
      expect(result.current.bulkOperations.start).toBe(true);
    }
  });

  it("resets flag immediately if no torrents needed processing initially (start)", async () => {
    const selected = new Set([2, 3]); // Already running
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase, // Используем полные mockTorrents
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    // Пытаемся запустить уже запущенные
    await act(async () => {
      await result.current.handleStartSelected();
    });

    // Проверяем, что флаг не установился и API не вызывался
    expect(result.current.bulkOperations.start).toBe(false);
    expect(mockStartTorrents).not.toHaveBeenCalled();
  });

  it("resets flag immediately if no torrents needed processing initially (stop)", async () => {
    const selectedStopped = new Set([1, 4]); // Already stopped
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selectedStopped,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(result.current.bulkOperations.stop).toBe(false);
    expect(mockStopTorrents).not.toHaveBeenCalled();
  });

  it("resets flag if selected torrents become empty", async () => {
    const initialSelected = new Set([1]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter(
      (t) => t.ID === 1
    );

    const { result, rerender } = renderHook(
      ({ currentSelected, torrentsData }) =>
        useBulkOperations(
          torrentsData,
          currentSelected,
          mockRefreshTorrents,
          mockConfig
        ),
      {
        initialProps: {
          currentSelected: initialSelected,
          torrentsData: initialTorrents,
        },
      }
    );

    // Начать операцию
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(result.current.bulkOperations.start).toBe(true);

    // Имитировать обновление, где выбранные торренты исчезли (например, были удалены)
    rerender({
      currentSelected: new Set<number>(),
      torrentsData: initialTorrents,
    });

    // Флаг должен сброситься
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });
});
