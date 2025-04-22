import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import {
  mockTorrentsBase,
  mockConfig,
  setupMocks,
  mockStartTorrents,
  mockStopTorrents,
} from "./mocks/useBulkOperations.mocks";

describe("useBulkOperations - useEffect Flag Reset Scenarios", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks();
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resets flag immediately if no torrents needed processing initially (start)", async () => {
    const selected = new Set([2, 3]); // Already running
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });

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

    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(result.current.bulkOperations.start).toBe(true);

    rerender({
      currentSelected: new Set<number>(),
      torrentsData: initialTorrents,
    });

    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("resets stop flag via useEffect if no torrents need processing anymore", async () => {
    const selected = new Set([2, 3]); // T2 downloading, T3 seeding
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      selected.has(t.ID)
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
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);

    const updatedTorrents: TorrentData[] = initialTorrents.map((t) => ({
      ...t,
      Status: "stopped",
      DownloadSpeedFormatted: "0 B/s",
      UploadSpeedFormatted: "0 B/s",
      SeedsConnected: 0,
      PeersConnected: 0,
    }));
    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });
});
