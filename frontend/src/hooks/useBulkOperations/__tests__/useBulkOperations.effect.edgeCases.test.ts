import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
import { StatusType } from "@utils/torrentStatus"; // Импортируем StatusType
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
            Status: "downloading" as StatusType,
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
            Status: "stopped" as StatusType,
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

  it("completes start operation even if some torrents were already running (covers line 131)", async () => {
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

    // 1. Start the operation (только T1 должен быть отправлен в API)
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(result.current.bulkOperations.start).toBe(true);
    // Ожидаемое внутреннее состояние lastTorrentStates: { 1: 'stopped', 2: 'downloading' }

    // 2. Simulate T1 updating its status
    const updatedTorrents: TorrentData[] = initialTorrents.map(
      (t) =>
        t.ID === 1
          ? {
              ...t,
              Status: "downloading" as StatusType, // T1 перешел в downloading
              DownloadSpeedFormatted: "10 B/s",
              SeedsConnected: 1,
              PeersConnected: 1,
            }
          : t // T2 остается downloading
    );
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for useEffect to run and reset the flag.
    // Для T1: previousState ('stopped') !== Status ('downloading') -> true
    // Для T2: previousState ('downloading') === 'downloading' -> isIrrelevantOrAlreadyDone -> true (Ветка строки 131)
    // every() -> true
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation even if some torrents were already stopped (covers line 173)", async () => {
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

    // 1. Start the stop operation (только T2 должен быть отправлен в API)
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);
    // Ожидаемое внутреннее состояние lastTorrentStates: { 1: 'stopped', 2: 'downloading' }

    // 2. Simulate T2 updating status
    const updatedTorrents: TorrentData[] = initialTorrents.map(
      (t) =>
        t.ID === 2
          ? {
              ...t,
              Status: "stopped" as StatusType, // T2 перешел в stopped
              DownloadSpeedFormatted: "0 B/s",
              UploadSpeedFormatted: "0 B/s",
              SeedsConnected: 0,
              PeersConnected: 0,
            }
          : t // T1 остается stopped
    );
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for flag reset.
    // Для T1: previousState ('stopped') === 'stopped' -> isIrrelevantOrAlreadyDone -> true (Ветка строки 173)
    // Для T2: previousState ('downloading') !== Status ('stopped') && Status === 'stopped' -> true
    // every() -> true
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
              Status: "downloading" as StatusType,
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
              Status: "stopped" as StatusType,
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
      .map((t) =>
        t.ID === 1 ? { ...t, Status: "downloading" as StatusType } : t
      );
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
      .map((t) => (t.ID === 2 ? { ...t, Status: "stopped" as StatusType } : t));
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

  it("correctly identifies torrents needing processing during stop operation (line 97 - isRunningTorrent)", async () => {
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
    // hasTorrentsToProcess должен использовать isRunningTorrent и вернуть true
    rerender({ torrentsData: initialTorrents });

    // 3. Проверяем, что флаг stop все еще true
    expect(result.current.bulkOperations.stop).toBe(true);
  });

  it("correctly identifies torrents needing processing during start operation (line 97 - status stopped)", async () => {
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
    // hasTorrentsToProcess должен использовать status === 'stopped' и вернуть true
    rerender({ torrentsData: initialTorrents });

    // 3. Проверяем, что флаг start все еще true
    expect(result.current.bulkOperations.start).toBe(true);
  });

  it("completes start operation immediately if all selected were already running (covers line 131)", async () => {
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

    // 1. Пытаемся запустить уже запущенные. API не должен вызываться, но флаг может кратковременно установиться,
    //    если фильтр torrentsToStart пропустит что-то (например, 'completed').
    //    Важно, что lastTorrentStates будет содержать { 2: 'downloading', 3: 'seeding' }
    await act(async () => {
      await result.current.handleStartSelected();
    });
    // API не должен вызываться, т.к. нет stopped/completed
    expect(mockStartTorrents).not.toHaveBeenCalled();
    // Флаг может быть false, если handleStartSelected вышел сразу, или true, если успел установиться.
    // Нам важно состояние *после* rerender.

    // 2. Вызываем rerender с теми же данными, чтобы запустить useEffect
    rerender({ torrentsData: initialTorrents });

    // 3. useEffect должен запуститься (если флаг start был true).
    // lastBulkAction === 'start'.
    // Проверка allStarted:
    // - Для T2: previousState ('downloading') -> isIrrelevantOrAlreadyDone -> true (строка 131)
    // - Для T3: previousState ('seeding') -> isIrrelevantOrAlreadyDone -> true (строка 131)
    // every() -> true. Флаг должен сброситься.
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
    // Убедимся, что API так и не вызывался
    expect(mockStartTorrents).not.toHaveBeenCalled();
  });

  it("completes stop operation immediately if all selected were already stopped (covers line 173)", async () => {
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

    // 1. Пытаемся остановить уже остановленные. API не должен вызываться.
    //    lastTorrentStates будет содержать { 1: 'stopped', 4: 'stopped' }
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).not.toHaveBeenCalled();

    // 2. Вызываем rerender с теми же данными, чтобы запустить useEffect
    rerender({ torrentsData: initialTorrents });

    // 3. useEffect должен запуститься (если флаг stop был true).
    // lastBulkAction === 'stop'.
    // Проверка allStopped:
    // - Для T1: previousState ('stopped') -> isIrrelevantOrAlreadyDone -> true (строка 173)
    // - Для T4: previousState ('stopped') -> isIrrelevantOrAlreadyDone -> true (строка 173)
    // every() -> true. Флаг должен сброситься.
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
    // Убедимся, что API так и не вызывался
    expect(mockStopTorrents).not.toHaveBeenCalled();
  });

  it("covers line 131: all selected torrents already running (isIrrelevantOrAlreadyDone=true for all, start)", async () => {
    const selected = new Set([2, 3]); // оба уже running
    const initialTorrents = [
      { ...mockTorrentsBase[1] }, // downloading
      { ...mockTorrentsBase[2] }, // seeding
    ];
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
    // API не должен вызываться
    expect(mockStartTorrents).not.toHaveBeenCalled();
    // Симулируем обновление, чтобы useEffect прошёл по every с isIrrelevantOrAlreadyDone=true для всех
    rerender({ torrentsData: initialTorrents });
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("covers line 173: all selected torrents already stopped (isIrrelevantOrAlreadyDone=true for all, stop)", async () => {
    const selected = new Set([1, 4]); // оба уже stopped
    const initialTorrents = [
      { ...mockTorrentsBase[0] }, // stopped
      { ...mockTorrentsBase[3] }, // stopped
    ];
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
    expect(mockStopTorrents).not.toHaveBeenCalled();
    rerender({ torrentsData: initialTorrents });
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("covers line 97: hasTorrentsToProcess for start (torrent.Status === 'stopped')", async () => {
    const selected = new Set([1]);
    const initialTorrents = [{ ...mockTorrentsBase[0] }]; // stopped
    const { result } = renderHook(() =>
      useBulkOperations(
        initialTorrents,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      await result.current.handleStartSelected();
    });
    // Проверяем, что start был вызван
    expect(result.current.bulkOperations.start).toBe(true);
  });

  it("covers line 97: hasTorrentsToProcess for stop (isRunningTorrent)", async () => {
    const selected = new Set([2]);
    const initialTorrents = [{ ...mockTorrentsBase[1] }]; // downloading
    const { result } = renderHook(() =>
      useBulkOperations(
        initialTorrents,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      await result.current.handleStopSelected();
    });
    // Проверяем, что stop был вызван
    expect(result.current.bulkOperations.stop).toBe(true);
  });
});
