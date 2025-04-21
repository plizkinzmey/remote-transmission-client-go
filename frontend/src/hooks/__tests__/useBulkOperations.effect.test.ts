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
    // Убедимся, что API был вызван для нужных торрентов
    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);
    // Флаг должен установиться
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

    // 3. Wait for flag reset (это должно покрыть строки 154-160)
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

    // 1. Start the operation (только T1 должен быть отправлен в API)
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]); // Только T1
    expect(result.current.bulkOperations.start).toBe(true);

    // 2. Simulate T1 updating its status
    const updatedTorrents: TorrentData[] = initialTorrents.map(
      (t) =>
        t.ID === 1
          ? {
              ...t,
              Status: "downloading", // T1 перешел в downloading
              DownloadSpeedFormatted: "10 B/s",
              SeedsConnected: 1,
              PeersConnected: 1,
            }
          : t // T2 остается downloading
    );
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for useEffect to run and reset the flag (T2 уже был в целевом состоянии)
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

    // 1. Start the stop operation (только T2 должен быть отправлен в API)
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2]); // Только T2
    expect(result.current.bulkOperations.stop).toBe(true);

    // 2. Simulate T2 updating status
    const updatedTorrents: TorrentData[] = initialTorrents.map(
      (t) =>
        t.ID === 2
          ? {
              ...t,
              Status: "stopped", // T2 перешел в stopped
              DownloadSpeedFormatted: "0 B/s",
              UploadSpeedFormatted: "0 B/s",
              SeedsConnected: 0,
              PeersConnected: 0,
            }
          : t // T1 остается stopped
    );
    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for flag reset (T1 уже был в целевом состоянии)
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  it("completes start operation if a selected torrent disappears", async () => {
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

    // 1. Start the operation
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1, 4]);
    expect(result.current.bulkOperations.start).toBe(true);

    // 2. Simulate T1 updating status and T4 disappearing
    const updatedTorrents: TorrentData[] = initialTorrents
      .map((t) =>
        t.ID === 1
          ? {
              ...t,
              Status: "downloading", // T1 перешел в downloading
            }
          : t
      )
      .filter((t) => t.ID !== 4); // T4 исчез

    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for useEffect to reset the flag (T4 считается измененным т.к. !torrent, T1 изменился)
    // Это должно покрыть строку 147 (!torrent)
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  it("completes stop operation if a selected torrent disappears", async () => {
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

    // 2. Simulate T2 updating status and T3 disappearing
    const updatedTorrents: TorrentData[] = initialTorrents
      .map((t) =>
        t.ID === 2
          ? {
              ...t,
              Status: "stopped", // T2 перешел в stopped
            }
          : t
      )
      .filter((t) => t.ID !== 3); // T3 исчез

    rerender({ torrentsData: updatedTorrents });

    // 3. Wait for flag reset (T3 считается измененным т.к. !torrent, T2 изменился)
    // Это должно покрыть строку 147 (!torrent)
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });

  // --- Тесты для покрытия недостающих веток ---

  // Тест для строк 154-160
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

  // Тест для строки 147 (!previousState) - Start
  it("completes start operation correctly if selection changes mid-operation", async () => {
    const initialSelected = new Set([1]); // T1 stopped
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      initialSelected.has(t.ID)
    );

    const { result, rerender } = renderHook(
      ({ torrentsData, currentSelected }) =>
        useBulkOperations(
          torrentsData,
          currentSelected, // Используем currentSelected из пропсов
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

    // 1. Start the operation с T1
    await act(async () => {
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(result.current.bulkOperations.start).toBe(true);
    // lastTorrentStates теперь содержит { 1: 'stopped' }

    // 2. Имитируем обновление данных И изменение выбора: T1 запустился, добавился T4 (stopped)
    const updatedTorrents: TorrentData[] = mockTorrentsBase
      .filter((t) => t.ID === 1 || t.ID === 4)
      .map(
        (t) => (t.ID === 1 ? { ...t, Status: "downloading" } : t) // T1 запустился
      );
    const newSelected = new Set([1, 4]); // Теперь выбраны T1 и T4

    // Передаем новые торренты и новый выбор
    rerender({ torrentsData: updatedTorrents, currentSelected: newSelected });

    // 3. useEffect должен сработать. T1 изменился (downloading). T4 есть в newSelected, но не было в lastTorrentStates -> !previousState -> true.
    // Так как allTorrentsChanged будет true, флаг должен сброситься.
    await waitFor(() => {
      expect(result.current.bulkOperations.start).toBe(false);
    });
  });

  // Тест для строки 147 (!previousState) - Stop
  it("completes stop operation correctly if selection changes mid-operation", async () => {
    const initialSelected = new Set([2]); // T2 downloading
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

    // 1. Start the operation с T2
    await act(async () => {
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(result.current.bulkOperations.stop).toBe(true);
    // lastTorrentStates теперь содержит { 2: 'downloading' }

    // 2. Имитируем обновление данных И изменение выбора: T2 остановился, добавился T1 (stopped)
    const updatedTorrents: TorrentData[] = mockTorrentsBase
      .filter((t) => t.ID === 1 || t.ID === 2)
      .map(
        (t) => (t.ID === 2 ? { ...t, Status: "stopped" } : t) // T2 остановился
      );
    const newSelected = new Set([1, 2]); // Теперь выбраны T1 и T2

    // Передаем новые торренты и новый выбор
    rerender({ torrentsData: updatedTorrents, currentSelected: newSelected });

    // 3. useEffect должен сработать. T2 изменился (stopped). T1 есть в newSelected, но не было в lastTorrentStates -> !previousState -> true.
    // Так как allTorrentsChanged будет true, флаг должен сброситься.
    await waitFor(() => {
      expect(result.current.bulkOperations.stop).toBe(false);
    });
  });
});
