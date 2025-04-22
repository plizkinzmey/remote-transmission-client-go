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
  mockStopTorrents,
  mockStartTorrents,
} from "./mocks/useBulkOperations.mocks"; // Импорт общих моков

describe("useBulkOperations - useEffect Completion Tracking", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks(); // Используем общую функцию настройки
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
    const selected = new Set([2, 3]); // downloading, seeding
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

    // 1. Start the stop operation
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);
    expect(result.current.bulkOperations.stop).toBe(true);

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

  it("resets stop flag when a single running torrent stops", async () => {
    const selected = new Set([2]); // Только downloading
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

    // 1. Start the stop operation
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);

    // 2. Simulate T2 updating status
    const updatedTorrents: TorrentData[] = initialTorrents.map((t) =>
      t.ID === 2
        ? {
            ...t,
            Status: "stopped", // T2 перешел в stopped
          }
        : t
    );
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for flag reset
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });
});
