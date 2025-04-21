import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react"; // Добавлен waitFor
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import { StartTorrents } from "@wailsjs/go/main/App";

// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");

// Импортируем хук ПОСЛЕ моков
import { useBulkOperations } from "../useBulkOperations";

// Типизируем мокированные функции с использованием Mock
const mockUseLocalization = useLocalization as Mock;
const mockStartTorrents = StartTorrents as Mock;

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
  {
    ID: 5,
    Name: "Torrent 5",
    Status: "completed",
    Progress: 100,
    Size: 1024,
    SizeFormatted: "1 KiB",
    UploadRatio: 0,
    SeedsConnected: 0,
    SeedsTotal: 0,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 1024,
    UploadedFormatted: "1 KiB",
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

describe("useBulkOperations - handleStartSelected", () => {
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

  it("starts selected stopped and completed torrents", async () => {
    const selected = new Set([1, 4, 5]); // Выбраны остановленные и завершенный
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });

    expect(mockStartTorrents).toHaveBeenCalledWith([1, 4, 5]);
    expect(mockRefreshTorrents).toHaveBeenCalled();
    expect(result.current.bulkOperations.start).toBe(true); // Флаг устанавливается
    expect(result.current.error).toBeNull();
  });

  it("does not start if already starting or no torrents selected", async () => {
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
      await resultNoSelection.current.handleStartSelected();
    });
    // Убедимся, что API не вызывался при пустом выборе
    expect(mockStartTorrents).not.toHaveBeenCalled();

    // --- Test case: Already starting ---
    vi.resetAllMocks(); // Сбрасываем моки перед второй частью теста
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined); // Пересоздаем мок refresh
    mockUseLocalization.mockReturnValue({
      // Восстанавливаем мок локализации
      t: (key: string, ...args: any[]) =>
        `${key}${args.length > 0 ? `:${args.join(",")}` : ""}`,
    });

    const selected = new Set([1]); // Выбран остановленный торрент
    let resolveApiCall: () => void;
    const apiCallPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });

    // Мокируем API так, чтобы он не завершался сразу
    mockStartTorrents.mockReturnValueOnce(apiCallPromise);

    // Используем initialProps для возможности rerender с новыми данными
    const { result: resultStarting, rerender } = renderHook(
      ({ torrentsData, currentSelected }) =>
        useBulkOperations(
          torrentsData,
          currentSelected,
          mockRefreshTorrents,
          mockConfig
        ),
      {
        initialProps: { torrentsData: mockTorrents, currentSelected: selected },
      }
    );

    // 1. Вызываем первый раз, API "зависнет"
    act(() => {
      resultStarting.current.handleStartSelected();
    });

    // Ждем, пока флаг start установится в true
    await waitFor(() => {
      expect(resultStarting.current.bulkOperations.start).toBe(true);
    });

    // Проверяем, что первый вызов API был сделан
    expect(mockStartTorrents).toHaveBeenCalledTimes(1);
    expect(mockStartTorrents).toHaveBeenCalledWith([1]);

    // 2. Вызываем второй раз, пока флаг еще true
    await act(async () => {
      await resultStarting.current.handleStartSelected();
    });

    // Проверяем, что mockStartTorrents НЕ был вызван снова
    expect(mockStartTorrents).toHaveBeenCalledTimes(1);
    // Убедимся, что refreshTorrents также не вызывался (т.к. второй вызов был проигнорирован)
    expect(mockRefreshTorrents).not.toHaveBeenCalled();

    // Завершаем первый вызов API и ждем завершения всех последующих операций
    await act(async () => {
      resolveApiCall!(); // Разрешаем промис API
      // Дожидаемся выполнения refreshTorrents
      await mockRefreshTorrents.mock.results[0]?.value;
    });

    // Проверяем, что refresh был вызван после завершения первого (и единственного) успешного вызова
    expect(mockRefreshTorrents).toHaveBeenCalledTimes(1);

    // Имитируем обновление данных торрентов после refresh, где статус изменился
    const updatedTorrents = mockTorrents.map((t) =>
      t.ID === 1 ? { ...t, Status: "downloading" } : t
    );
    rerender({ torrentsData: updatedTorrents, currentSelected: selected });

    // Теперь состояние должно обновиться на false (из-за useEffect)
    // Проверяем это, дождавшись обновления
    await waitFor(() => {
      expect(resultStarting.current.bulkOperations.start).toBe(false);
    });
  });

  it("does not start if no torrents need starting", async () => {
    const selected = new Set([2, 3]); // Выбраны уже запущенные
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });

    expect(mockStartTorrents).not.toHaveBeenCalled();
    expect(result.current.bulkOperations.start).toBe(false);
  });

  it("handles errors during start", async () => {
    const selected = new Set([1]);
    const error = new Error("Start failed");
    mockStartTorrents.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useBulkOperations(mockTorrents, selected, mockRefreshTorrents, mockConfig)
    );

    await act(async () => {
      await result.current.handleStartSelected();
    });

    expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    expect(mockRefreshTorrents).not.toHaveBeenCalled(); // Не вызывается при ошибке API
    expect(result.current.bulkOperations.start).toBe(false); // Сбрасывается при ошибке
    expect(result.current.error).toBe(`errors.failedToStartTorrents:${error}`);
  });
});
