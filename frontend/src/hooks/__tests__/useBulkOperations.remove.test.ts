import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react"; // Добавлен waitFor
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import { RemoveTorrent } from "@wailsjs/go/main/App";

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
const mockRemoveTorrent = RemoveTorrent as Mock;

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
  {
    ID: 2,
    Name: "Torrent 2",
    Status: "downloading",
    Progress: 100,
    Size: 2048,
    SizeFormatted: "2 KiB",
    UploadRatio: 1.2,
    SeedsConnected: 5,
    SeedsTotal: 15,
    PeersConnected: 10,
    PeersTotal: 25,
    UploadedBytes: 2457,
    UploadedFormatted: "2.4 KiB",
    DownloadSpeed: 102400,
    UploadSpeed: 10240,
    DownloadSpeedFormatted: "100 KiB/s",
    UploadSpeedFormatted: "10 KiB/s",
    IsSlowMode: false,
  },
  {
    ID: 3,
    Name: "Torrent 3",
    Status: "seeding",
    Progress: 100,
    Size: 4096,
    SizeFormatted: "4 KiB",
    UploadRatio: 2.0,
    SeedsConnected: 10,
    SeedsTotal: 20,
    PeersConnected: 15,
    PeersTotal: 30,
    UploadedBytes: 8192,
    UploadedFormatted: "8 KiB",
    DownloadSpeed: 0,
    UploadSpeed: 51200,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "50 KiB/s",
    IsSlowMode: true,
  },
];

const mockConfig = {
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s" as const,
};

describe("useBulkOperations - handleRemoveSelected", () => {
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

  it("removes selected torrents without deleting data", async () => {
    const selected = new Set([1, 2]);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleRemoveSelected(false);
    });

    expect(mockRemoveTorrent).toHaveBeenCalledTimes(2);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(1, false);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(2, false);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.remove).toBe(false); // Сбрасывается после выполнения
    expect(result.current.error).toBeNull();
  });

  it("removes selected torrents with deleting data", async () => {
    const selected = new Set([3]);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleRemoveSelected(true);
    });

    expect(mockRemoveTorrent).toHaveBeenCalledWith(3, true);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.remove).toBe(false);
  });

  it("handles errors during remove (continues removing others)", async () => {
    const selected = new Set([1, 2, 3]);
    const error = new Error("Remove failed for 2");
    mockRemoveTorrent.mockImplementation(async (id: number) => {
      if (id === 2) throw error;
      return undefined;
    });

    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleRemoveSelected(false);
    });

    expect(mockRemoveTorrent).toHaveBeenCalledTimes(3);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(1, false);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(2, false); // Попытка была
    expect(mockRemoveTorrent).toHaveBeenCalledWith(3, false);
    expect(mockRefreshTorrents).toHaveBeenCalled(); // Вызывается в конце
    expect(result.current.bulkOperations.remove).toBe(false);
    expect(result.current.error).toBeNull(); // Ошибка отдельного торрента не ставится в общее состояние ошибки хука
  });

  it("handles general error during bulk remove (e.g., refresh fails)", async () => {
    const selected = new Set([1]);
    const refreshError = new Error("Refresh failed");
    mockRefreshTorrents.mockRejectedValue(refreshError); // Имитируем ошибку при обновлении

    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleRemoveSelected(false);
    });

    expect(mockRemoveTorrent).toHaveBeenCalledWith(1, false);
    expect(mockRefreshTorrents).toHaveBeenCalled(); // Попытка обновления была
    expect(result.current.bulkOperations.remove).toBe(false); // Сбрасывается в finally
    expect(result.current.error).toBe(
      `errors.failedToRemoveTorrents:${refreshError}`
    ); // Ошибка от refreshTorrents
  });

  it("does not remove if already removing or no torrents selected", async () => {
    // --- Test case: No torrents selected ---
    const { result: resultNoSelection } = renderHook(() =>
      useBulkOperations(
        mockTorrents,
        new Set(), // Пустой Set
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      await resultNoSelection.current.handleRemoveSelected();
    });
    // Убедимся, что API не вызывался при пустом выборе
    expect(mockRemoveTorrent).not.toHaveBeenCalled();

    // --- Test case: Already removing ---
    vi.resetAllMocks(); // Сбрасываем моки перед второй частью теста
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined); // Пересоздаем мок refresh
    mockUseLocalization.mockReturnValue({
      // Восстанавливаем мок локализации
      t: (key: string, ...args: any[]) =>
        `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
    });

    const selected = new Set([1]);
    let resolveApiCall: (value?: unknown) => void;
    const apiCallPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });

    // Мокируем API так, чтобы он не завершался сразу (для первого торрента)
    mockRemoveTorrent.mockImplementation(async (id: number) => {
      if (id === 1) {
        await apiCallPromise; // "Зависаем" на первом вызове
      }
      return undefined;
    });

    const { result: resultRemoving } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    // 1. Вызываем первый раз, API "зависнет"
    act(() => {
      resultRemoving.current.handleRemoveSelected(false);
    });

    // Ждем, пока флаг remove установится в true
    await waitFor(() => {
      expect(resultRemoving.current.bulkOperations.remove).toBe(true);
    });

    // Проверяем, что первый вызов API был сделан
    expect(mockRemoveTorrent).toHaveBeenCalledTimes(1);
    expect(mockRemoveTorrent).toHaveBeenCalledWith(1, false);

    // 2. Вызываем второй раз, пока флаг еще true
    await act(async () => {
      await resultRemoving.current.handleRemoveSelected(false);
    });

    // Проверяем, что mockRemoveTorrent НЕ был вызван снова
    expect(mockRemoveTorrent).toHaveBeenCalledTimes(1);
    // Убедимся, что refreshTorrents также не вызывался (т.к. второй вызов был проигнорирован)
    expect(mockRefreshTorrents).not.toHaveBeenCalled();

    // Завершаем первый вызов API и ждем завершения всех последующих операций
    await act(async () => {
      resolveApiCall!(); // Разрешаем промис API
      // Дожидаемся выполнения refreshTorrents, который вызывается после цикла удаления
      // и перед блоком finally, который сбрасывает флаг.
      // Это гарантирует, что все асинхронные операции внутри handleRemoveSelected завершены.
      await mockRefreshTorrents.mock.results[0]?.value; // Дожидаемся разрешения промиса refreshTorrents
    });

    // Теперь состояние должно обновиться на false
    expect(resultRemoving.current.bulkOperations.remove).toBe(false);
    // Проверяем, что refresh был вызван после завершения первого (и единственного) успешного вызова
    expect(mockRefreshTorrents).toHaveBeenCalledTimes(1);
  });
});
