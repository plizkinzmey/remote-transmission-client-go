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

describe("useBulkOperations - useEffect Edge Cases", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks();
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not reset start flag if only some torrents change status", async () => {
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

    const updatedTorrents: TorrentData[] = initialTorrents.map((t, index) =>
      index === 0
        ? {
            ...t,
            Status: "downloading",
            DownloadSpeedFormatted: "10 B/s",
            SeedsConnected: 1,
            PeersConnected: 1,
          }
        : t
    );
    rerender({ torrentsData: updatedTorrents });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    if (initialTorrents.length > 0) {
      expect(result.current.bulkOperations.start).toBe(true);
    }
  });

  it("does not reset stop flag if only some torrents stop", async () => {
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

    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);
    expect(result.current.bulkOperations.stop).toBe(true);

    const updatedTorrents: TorrentData[] = initialTorrents.map((t) =>
      t.ID === 2
        ? {
            ...t,
            Status: "stopped",
            DownloadSpeedFormatted: "0 B/s",
            UploadSpeedFormatted: "0 B/s",
            SeedsConnected: 0,
            PeersConnected: 0,
          }
        : t
    );
    rerender({ torrentsData: updatedTorrents });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(result.current.bulkOperations.stop).toBe(true);
  });

  it("completes start operation even if some torrents were already running", async () => {
    const selected = new Set([1, 2]); // 1 - stopped, 2 - downloading
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
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(result.current.bulkOperations.start).toBe(true);

    const updatedTorrents: TorrentData[] = initialTorrents.map((t) =>
      t.ID === 1
        ? {
            ...t,
            Status: "downloading",
            DownloadSpeedFormatted: "10 B/s",
            SeedsConnected: 1,
            PeersConnected: 1,
          }
        : t
    );
    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation even if some torrents were already stopped", async () => {
    const selected = new Set([1, 2]); // 1 - stopped, 2 - downloading
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
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);

    const updatedTorrents: TorrentData[] = initialTorrents.map((t) =>
      t.ID === 2
        ? {
            ...t,
            Status: "stopped",
            DownloadSpeedFormatted: "0 B/s",
            UploadSpeedFormatted: "0 B/s",
            SeedsConnected: 0,
            PeersConnected: 0,
          }
        : t
    );
    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("completes start operation if a selected torrent disappears", async () => {
    const selected = new Set([1, 4]);
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
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1, 4]);
    expect(result.current.bulkOperations.start).toBe(true);

    const updatedTorrents: TorrentData[] = initialTorrents
      .map((t) =>
        t.ID === 1
          ? {
              ...t,
              Status: "downloading",
              DownloadSpeedFormatted: "10 B/s",
              SeedsConnected: 1,
              PeersConnected: 1,
            }
          : t
      )
      .filter((t) => t.ID !== 4);

    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation if a selected torrent disappears", async () => {
    const selected = new Set([2, 3]);
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
    expect(result.current.bulkOperations.stop).toBe(true);

    const updatedTorrents: TorrentData[] = initialTorrents
      .map((t) =>
        t.ID === 2
          ? {
              ...t,
              Status: "stopped",
              DownloadSpeedFormatted: "0 B/s",
              UploadSpeedFormatted: "0 B/s",
              SeedsConnected: 0,
              PeersConnected: 0,
            }
          : t
      )
      .filter((t) => t.ID !== 3);

    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("completes start operation correctly if selection changes mid-operation", async () => {
    const initialSelected = new Set([1]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      initialSelected.has(t.ID)
    );

    const { result, rerender } = renderHook(
      ({ torrentsData, currentSelected }) =>
        useBulkOperations(
          torrentsData,
          currentSelected,
          mockRefreshTorrents,
          mockConfig
        ),
      {
        initialProps: {
          torrentsData: initialTorrents,
          currentSelected: initialSelected,
        },
      }
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(result.current.bulkOperations.start).toBe(true);

    const updatedTorrents: TorrentData[] = mockTorrentsBase
      .filter((t) => t.ID === 1 || t.ID === 4)
      .map((t) => (t.ID === 1 ? { ...t, Status: "downloading" } : t));
    const newSelected = new Set([1, 4]);

    rerender({ torrentsData: updatedTorrents, currentSelected: newSelected });

    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation correctly if selection changes mid-operation", async () => {
    const initialSelected = new Set([2]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      initialSelected.has(t.ID)
    );

    const { result, rerender } = renderHook(
      ({ torrentsData, currentSelected }) =>
        useBulkOperations(
          torrentsData,
          currentSelected,
          mockRefreshTorrents,
          mockConfig
        ),
      {
        initialProps: {
          torrentsData: initialTorrents,
          currentSelected: initialSelected,
        },
      }
    );

    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);

    const updatedTorrents: TorrentData[] = mockTorrentsBase
      .filter((t) => t.ID === 1 || t.ID === 2)
      .map((t) => (t.ID === 2 ? { ...t, Status: "stopped" } : t));
    const newSelected = new Set([1, 2]);

    rerender({ torrentsData: updatedTorrents, currentSelected: newSelected });

    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("completes start operation if the only selected torrent disappears", async () => {
    const selected = new Set([1]);
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
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(result.current.bulkOperations.start).toBe(true);

    const updatedTorrents: TorrentData[] = [];
    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation if the only selected torrent disappears", async () => {
    const selected = new Set([2]);
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
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);

    const updatedTorrents: TorrentData[] = [];
    rerender({ torrentsData: updatedTorrents });

    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  // Тест для строки 97 - проверка условия isRunningTorrent(torrent.Status) в hasTorrentsToProcess для stop
  it("correctly identifies if a torrent needs processing during stop operation (covers line 97 branch)", async () => {
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

    // 1. Запускаем операцию stop
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(result.current.bulkOperations.stop).toBe(true);
    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);

    // 2. Вызываем rerender с теми же данными, чтобы запустить useEffect
    // Это заставит hasTorrentsToProcess вычислиться снова
    rerender({ torrentsData: initialTorrents });

    // 3. Проверяем, что флаг stop все еще true, так как торренты не изменили статус
    // Важно: Этот тест проверяет, что hasTorrentsToProcess правильно использует isRunningTorrent (строка 97)
    // когда lastBulkAction === 'stop'. Он не проверяет сброс флага.
    expect(result.current.bulkOperations.stop).toBe(true);
  });

  // Тест для ветки torrent.Status === 'seeding' на строке 128 (из старого файла)
  it("checks hasTorrentsToProcess correctly for seeding torrent during stop", async () => {
    const selected = new Set([3]); // T3 в состоянии seeding
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
    expect(result.current.bulkOperations.stop).toBe(true); // Операция началась

    // Вызываем rerender, чтобы useEffect проверил hasTorrentsToProcess
    rerender({ torrentsData: initialTorrents });

    // Флаг не должен сбрасываться, т.к. торрент все еще seeding и требует обработки
    expect(result.current.bulkOperations.stop).toBe(true);
  });

  // Тест для строки 97 - проверка условия torrent.Status === "stopped" в hasTorrentsToProcess для start (из старого файла)
  it("correctly identifies if a torrent needs processing during start operation", async () => {
    const selected = new Set([1, 4]); // Оба stopped
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

    // 1. Запускаем операцию start
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(result.current.bulkOperations.start).toBe(true);
    expect(mockStartTorrents).toHaveBeenCalledWith([1, 4]);

    // 2. Вызываем rerender с теми же данными, чтобы запустить useEffect
    rerender({ torrentsData: initialTorrents });

    // 3. Проверяем, что флаг start все еще true, так как торренты не изменили статус
    // Это подтверждает, что hasTorrentsToProcess правильно определил, что торренты
    // (в статусе 'stopped') требуют обработки для операции 'start'.
    expect(result.current.bulkOperations.start).toBe(true);
  });
});
