import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react"; // Добавлен waitFor
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import { StopTorrents } from "@wailsjs/go/main/App";

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
const mockStopTorrents = StopTorrents as Mock;

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
  {
    ID: 4,
    Name: "Torrent 4",
    Status: "stopped",
    Progress: 0,
    Size: 8192,
    SizeFormatted: "8 KiB",
    UploadRatio: 0,
    SeedsConnected: 0,
    SeedsTotal: 5,
    PeersConnected: 0,
    PeersTotal: 10,
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

describe("useBulkOperations - handleStopSelected", () => {
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

  it("stops selected running torrents", async () => {
    const selected = new Set([2, 3]); // Выбраны запущенные
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStopSelected();
    });

    expect(mockStopTorrents).toHaveBeenCalledWith([2, 3]);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.stop).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("does not stop if no torrents need stopping", async () => {
    const selected = new Set([1, 4]); // Выбраны остановленные
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStopSelected();
    });

    expect(mockStopTorrents).not.toHaveBeenCalled();
    expect(result.current.bulkOperations.stop).toBe(false);
  });

  it("handles errors during stop", async () => {
    const selected = new Set([2]);
    const error = new Error("Stop failed");
    mockStopTorrents.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStopSelected();
    });

    expect(mockStopTorrents).toHaveBeenCalledWith([2]);
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
    expect(result.current.bulkOperations.stop).toBe(false);
    expect(result.current.error).toBe(`errors.failedToStopTorrents:${error}`);
  });

  it("does not stop if already stopping or no torrents selected", async () => {
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
      await resultNoSelection.current.handleStopSelected();
    });
    // Убедимся, что API не вызывался при пустом выборе
    expect(mockStopTorrents).not.toHaveBeenCalled();

    // --- Test case: Already stopping ---
    vi.resetAllMocks(); // Сбрасываем моки перед второй частью теста
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined); // Пересоздаем мок refresh
    mockUseLocalization.mockReturnValue({
      // Восстанавливаем мок локализации
      t: (key: string, ...args: any[]) =>
        `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
    });

    const selected = new Set([2]); // Выбран запущенный торрент
    let resolveApiCall: () => void;
    const apiCallPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });

    // Мокируем API так, чтобы он не завершался сразу
    mockStopTorrents.mockReturnValueOnce(apiCallPromise);

    const { result: resultStopping } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    // 1. Вызываем первый раз, API "зависнет"
    // Не используем await здесь, так как промис не разрешится
    act(() => {
      resultStopping.current.handleStopSelected();
    });

    // Ждем, пока флаг stop установится в true
    await waitFor(() => {
      expect(resultStopping.current.bulkOperations.stop).toBe(true);
    });

    // Проверяем, что первый вызов API был сделан
    expect(mockStopTorrents).toHaveBeenCalledTimes(1);
    expect(mockStopTorrents).toHaveBeenCalledWith([2]);

    // 2. Вызываем второй раз, пока флаг еще true
    await act(async () => {
      await resultStopping.current.handleStopSelected();
    });

    // Проверяем, что mockStopTorrents НЕ был вызван снова
    expect(mockStopTorrents).toHaveBeenCalledTimes(1);
    // Убедимся, что refreshTorrents также не вызывался (т.к. второй вызов был проигнорирован)
    expect(mockRefreshTorrents).not.toHaveBeenCalled();

    // Завершаем первый вызов API, чтобы тест корректно завершился
    await act(async () => {
      resolveApiCall(); // Разрешаем промис
      await apiCallPromise; // Дожидаемся завершения
    });
  });
});
