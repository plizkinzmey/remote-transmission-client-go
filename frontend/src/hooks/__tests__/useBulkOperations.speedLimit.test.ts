import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react"; // Добавлен waitFor
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import { SetTorrentSpeedLimit } from "@wailsjs/go/main/App";

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
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

describe("useBulkOperations - handleSetSpeedLimit", () => {
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

  it("sets speed limit for selected torrents (slow mode on)", async () => {
    const selected = new Set([1, 2]);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([1, 2], true);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.speedLimit).toBe(false); // Сбрасывается
    expect(result.current.error).toBeNull();
  });

  it("sets speed limit for selected torrents (slow mode off)", async () => {
    const selected = new Set([3]);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(false);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([3], false);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.speedLimit).toBe(false);
  });

  it("does not set speed limit if config is missing", async () => {
    const selected = new Set([1]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrents,
        selected,
        mockRefreshTorrents,
        undefined // Нет config
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
    expect(result.current.bulkOperations.speedLimit).toBe(false);
  });

  it("handles errors during set speed limit", async () => {
    const selected = new Set([1]);
    const error = new Error("Limit failed");
    mockSetTorrentSpeedLimit.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([1], true);
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
    expect(result.current.bulkOperations.speedLimit).toBe(false);
    expect(result.current.error).toBe(`errors.failedToSetSpeedLimit:${error}`);
  });

  it("does not set speed limit if already setting or no torrents selected", async () => {
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
      await resultNoSelection.current.handleSetSpeedLimit(true);
    });
    // Убедимся, что API не вызывался при пустом выборе
    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();

    // --- Test case: Already setting ---
    vi.resetAllMocks(); // Сбрасываем моки перед второй частью теста
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined); // Пересоздаем мок refresh
    mockUseLocalization.mockReturnValue({
      // Восстанавливаем мок локализации
      t: (key: string, ...args: any[]) =>
        `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
    });

    const selected = new Set([1]);
    let resolveApiCall: () => void;
    const apiCallPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });

    // Мокируем API так, чтобы он не завершался сразу
    mockSetTorrentSpeedLimit.mockReturnValueOnce(apiCallPromise);

    const { result: resultSetting } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    // 1. Вызываем первый раз, API "зависнет"
    // Не используем await здесь, так как промис не разрешится
    act(() => {
      resultSetting.current.handleSetSpeedLimit(true);
    });

    // Ждем, пока флаг speedLimit установится в true
    await waitFor(() => {
      expect(resultSetting.current.bulkOperations.speedLimit).toBe(true);
    });

    // Проверяем, что первый вызов API был сделан
    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledTimes(1);
    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([1], true);

    // 2. Вызываем второй раз, пока флаг еще true
    await act(async () => {
      await resultSetting.current.handleSetSpeedLimit(true);
    });

    // Проверяем, что mockSetTorrentSpeedLimit НЕ был вызван снова
    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledTimes(1);
    // Убедимся, что refreshTorrents также не вызывался (т.к. второй вызов был проигнорирован)
    expect(mockRefreshTorrents).not.toHaveBeenCalled();

    // Завершаем первый вызов API, чтобы тест корректно завершился
    await act(async () => {
      resolveApiCall(); // Разрешаем промис
      await apiCallPromise; // Дожидаемся завершения
    });
  });
});
