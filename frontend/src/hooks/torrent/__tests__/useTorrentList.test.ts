import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest"; // <--- добавлено
import { renderHook, act } from "@testing-library/react";
import { useTorrentList } from "../useTorrentList";
import * as AppAPI from "@wailsjs/go/main/App";
import * as types from "../types"; // Импортируем весь модуль
import { WailsTorrent } from "../types";
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock";
import * as useNotificationModule from "@/hooks/useNotification";
import * as torrentStatusModule from "@/utils/torrentStatus";
import { StatusType } from "@/utils/torrentStatus"; // Добавляем импорт типа StatusType

// Мокируем API
vi.mock("@wailsjs/go/main/App", () => ({
  GetTorrents: vi.fn(),
}));

// Мокируем хук useNotification
vi.mock("@/hooks/useNotification", () => ({
  useNotification: vi.fn(),
}));

// Мокируем утилиту для конвертации статусов
vi.mock("@/utils/torrentStatus", () => ({
  mapBackendStatusToFrontend: vi.fn((status) => {
    // Простая реализация для тестов
    if (status === "downloading") return "downloading";
    if (status === "seeding") return "seeding";
    if (status === "completed") return "completed";
    if (status === "checking") return "checking";
    return "stopped";
  }),
}));

// Используем WailsTorrent для мок-данных и задаем строковый статус
// Добавляем другие обязательные поля из domain.Torrent
const mockTorrentsData: WailsTorrent[] = [
  {
    ID: 1,
    Name: "Torrent 1",
    Status: "downloading", // Строковый статус
    Progress: 50.5,
    Size: 1024 * 1024 * 100,
    SizeFormatted: "100.0 MB",
    UploadRatio: 1.2,
    SeedsConnected: 10,
    SeedsTotal: 20,
    PeersConnected: 5,
    PeersTotal: 15,
    UploadedBytes: 1024 * 1024 * 120,
    UploadedFormatted: "120.0 MB",
    DownloadSpeed: 1024 * 500,
    UploadSpeed: 1024 * 100,
    DownloadSpeedFormatted: "500.0 KB/s",
    UploadSpeedFormatted: "100.0 KB/s",
    IsSlowMode: false,
  },
  {
    ID: 2,
    Name: "Torrent 2",
    Status: "seeding", // Строковый статус
    Progress: 100,
    Size: 1024 * 1024 * 200,
    SizeFormatted: "200.0 MB",
    UploadRatio: 2.5,
    SeedsConnected: 5,
    SeedsTotal: 10,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 1024 * 1024 * 500,
    UploadedFormatted: "500.0 MB",
    DownloadSpeed: 0,
    UploadSpeed: 1024 * 50,
    DownloadSpeedFormatted: "0.0 KB/s",
    UploadSpeedFormatted: "50.0 KB/s",
    IsSlowMode: true,
  },
];

// Обертка для использования мока локализации
const renderHookWithProviders = (
  hook: (props: { initialized: boolean }) => any,
  initialProps: { initialized: boolean }
) => {
  return renderHook(hook, {
    wrapper: MockLocalizationProvider,
    initialProps: initialProps,
  });
};

describe("useTorrentList", () => {
  // Mock для функции showFormatted из useNotification
  const mockShowFormatted = vi.fn();
  const mockShowSuccess = vi.fn();
  const mockShowError = vi.fn();
  const mockShowInfo = vi.fn();
  const mockShowWarning = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Спай для withTimeout
    vi.spyOn(types, "withTimeout").mockImplementation(
      (promise: Promise<any>) => promise
    );

    // Настройка мока useNotification с правильными методами из интерфейса UseNotificationResult
    vi.mocked(useNotificationModule.useNotification).mockReturnValue({
      showFormatted: mockShowFormatted,
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showInfo: mockShowInfo,
      showWarning: mockShowWarning,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("не должен запрашивать торренты, если соединение не инициализировано", async () => {
    const { result } = renderHook(() => useTorrentList(false));
    expect(AppAPI.GetTorrents).not.toHaveBeenCalled();

    // Вызываем refreshTorrents вручную
    await act(async () => {
      await result.current.refreshTorrents();
    });

    // Убеждаемся, что API все еще не было вызвано
    expect(AppAPI.GetTorrents).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("должен немедленно запросить торренты, установить состояние загрузки и интервал, если соединение инициализировано", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Начальное состояние - загрузка
    expect(result.current.isLoading).toBe(true);
    expect(result.current.torrents).toEqual([]);
    expect(result.current.error).toBeNull();

    // Ждем выполнения первого запроса
    await act(async () => {
      await Promise.resolve();
    });

    // Ожидаем 2 вызова из-за StrictMode
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);
    expect(result.current.torrents).toEqual(mockTorrentsData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Проверяем вызов по интервалу
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    // Третий вызов (2 начальных + 1 интервальный)
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(3);

    // Проверяем, что isLoading не становится true при последующих обновлениях
    expect(result.current.isLoading).toBe(false);
  });

  it("должен обработать ошибку запроса (не связанную с таймаутом)", async () => {
    const error = new Error("API Error");
    vi.mocked(AppAPI.GetTorrents).mockRejectedValue(error);
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
    expect(result.current.torrents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("должен обработать ошибку таймаута запроса", async () => {
    const timeoutError = new Error("errors.timeout");
    // Переопределяем поведение spy
    (types.withTimeout as Mock).mockRejectedValue(timeoutError);

    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(types.withTimeout).toHaveBeenCalledTimes(1);
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(1);
    expect(result.current.torrents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("errors.timeoutExplanation");
  });

  it("должен очистить интервал при размонтировании", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { unmount } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    await act(async () => {
      await Promise.resolve();
    });
    // Ожидаем 2 вызова из-за StrictMode
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    // Вызовы не должны увеличиться после unmount
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);
  });

  it("должен очистить ошибку при успешном запросе после ошибки", async () => {
    const timeoutError = new Error("errors.timeout");
    const wt = types.withTimeout as Mock;
    wt.mockRejectedValueOnce(timeoutError).mockImplementation(
      (p: Promise<any>) => p
    );

    vi.mocked(AppAPI.GetTorrents)
      .mockResolvedValueOnce([])
      .mockResolvedValue(mockTorrentsData);

    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый вызов (ошибка таймаута)
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error).toBe("errors.timeoutExplanation");
    expect(result.current.torrents).toEqual([]);

    // Второй вызов (успех) по интервалу
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.torrents).toEqual(mockTorrentsData);
  });

  it("должен вызвать refreshTorrents вручную", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Ждем первичной загрузки
    await act(async () => {
      await Promise.resolve();
    });
    // Ожидаем 2 вызова из-за StrictMode
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);

    // Вызываем вручную
    await act(async () => {
      await result.current.refreshTorrents();
    });
    // Третий вызов (2 начальных + 1 ручной)
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(3);
    expect(result.current.torrents).toEqual(mockTorrentsData);
  });

  it("не должен запрашивать торренты, если isInitialized становится false", async () => {
    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(mockTorrentsData);
    const { rerender } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый вызов при initialized: true
    await act(async () => {
      await Promise.resolve();
    });
    // Ожидаем 2 вызова из-за StrictMode
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);

    // Меняем initialized на false
    rerender({ initialized: false });

    // Продвигаем таймеры, новых вызовов быть не должно
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });
    // Вызовы не должны увеличиться
    expect(AppAPI.GetTorrents).toHaveBeenCalledTimes(2);
  });

  it("должен показать уведомление при изменении статуса торрента с downloading на completed", async () => {
    // Сбрасываем все моки перед тестом
    vi.clearAllMocks();

    // Используем два разных торрента - первый с downloading, второй с completed
    const initialTorrent = { ...mockTorrentsData[0], Status: "downloading" };
    const updatedTorrent = { ...mockTorrentsData[0], Status: "completed" };

    // Мок mapBackendStatusToFrontend для правильного возврата статусов
    const mockMapStatus = vi.mocked(
      torrentStatusModule.mapBackendStatusToFrontend
    );
    mockMapStatus.mockImplementation((status) => {
      if (status === "downloading") return "downloading";
      if (status === "completed") return "completed";
      return status as StatusType;
    });

    // Первый и второй запрос возвращают разные данные
    const mockGetTorrents = vi.mocked(AppAPI.GetTorrents);
    // Очищаем все предыдущие вызовы мока
    mockGetTorrents.mockReset();
    mockGetTorrents
      .mockResolvedValueOnce([initialTorrent]) // Первый вызов - downloading
      .mockResolvedValueOnce([initialTorrent]) // React StrictMode дублирует первый вызов
      .mockResolvedValueOnce([updatedTorrent]); // Второй вызов (интервал) - completed

    // Рендерим хук
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый запрос и обработка первой загрузки
    await act(async () => {
      await Promise.resolve(); // Ждем промисы
    });

    // В StrictMode GetTorrents вызывается дважды при первой загрузке
    expect(mockGetTorrents).toHaveBeenCalledTimes(2);

    // Очищаем историю вызовов уведомлений перед вторым запросом
    mockShowFormatted.mockClear();

    // Выполняем второй запрос через интервал
    await act(async () => {
      vi.advanceTimersByTime(3000); // Вызываем интервал для refreshTorrents
      await Promise.resolve(); // Ждем выполнения второго запроса
    });

    // После интервала GetTorrents должен быть вызван третий раз
    expect(mockGetTorrents).toHaveBeenCalledTimes(3);

    // Проверяем, что уведомление было показано с правильными параметрами
    expect(mockShowFormatted).toHaveBeenCalledWith(
      expect.any(String),
      "notifications.downloadCompleteMessage",
      { name: "Torrent 1" },
      "success"
    );
  });

  it("должен показать уведомление при изменении статуса торрента с checking на другой статус", async () => {
    // Сбрасываем все моки перед тестом
    vi.clearAllMocks();

    // Используем два разных торрента - первый с checking, второй с seeding
    const initialTorrent = { ...mockTorrentsData[0], Status: "checking" };
    const updatedTorrent = { ...mockTorrentsData[0], Status: "seeding" };

    // Мок mapBackendStatusToFrontend для правильного возврата статусов
    const mockMapStatus = vi.mocked(
      torrentStatusModule.mapBackendStatusToFrontend
    );
    mockMapStatus.mockImplementation((status) => {
      if (status === "checking") return "checking";
      if (status === "seeding") return "seeding";
      return status as StatusType;
    });

    // Первый и второй запрос возвращают разные данные
    const mockGetTorrents = vi.mocked(AppAPI.GetTorrents);
    // Очищаем все предыдущие вызовы мока
    mockGetTorrents.mockReset();
    mockGetTorrents
      .mockResolvedValueOnce([initialTorrent]) // Первый вызов - checking
      .mockResolvedValueOnce([initialTorrent]) // React StrictMode дублирует первый вызов
      .mockResolvedValueOnce([updatedTorrent]); // Второй вызов (интервал) - seeding

    // Рендерим хук
    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Первый запрос и обработка первой загрузки
    await act(async () => {
      await Promise.resolve(); // Ждем промисы
    });

    // В StrictMode GetTorrents вызывается дважды при первой загрузке
    expect(mockGetTorrents).toHaveBeenCalledTimes(2);

    // Очищаем историю вызовов уведомлений перед вторым запросом
    mockShowFormatted.mockClear();

    // Выполняем второй запрос через интервал
    await act(async () => {
      vi.advanceTimersByTime(3000); // Вызываем интервал для refreshTorrents
      await Promise.resolve(); // Ждем выполнения второго запроса
    });

    // После интервала GetTorrents должен быть вызван третий раз
    expect(mockGetTorrents).toHaveBeenCalledTimes(3);

    // Проверяем, что уведомление было показано с правильными параметрами
    expect(mockShowFormatted).toHaveBeenCalledWith(
      expect.any(String),
      "notifications.verifyCompleteMessage",
      { name: "Torrent 1" },
      "success"
    );
  });

  it("не должен показывать уведомления при первой загрузке", async () => {
    // Устанавливаем разные статусы для первого вызова API
    const initialTorrents = [
      {
        ...mockTorrentsData[0],
        Status: "completed", // Торрент завершен
      },
      {
        ...mockTorrentsData[1],
        Status: "seeding", // Торрент сидирует
      },
    ];

    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(initialTorrents);

    const { result } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Ждем первичной загрузки
    await act(async () => {
      await Promise.resolve();
    });

    // При первой загрузке уведомления не должны показываться
    expect(mockShowFormatted).not.toHaveBeenCalled();
  });

  it("должен сбросить состояние при потере соединения", async () => {
    // Устанавливаем торренты в первоначальном состоянии
    const initialTorrents = [
      {
        ...mockTorrentsData[0],
        Status: "downloading",
      },
    ];

    vi.mocked(AppAPI.GetTorrents).mockResolvedValue(initialTorrents);

    const { result, rerender } = renderHookWithProviders(
      ({ initialized }) => useTorrentList(initialized),
      { initialized: true }
    );

    // Ждем первичной загрузки
    await act(async () => {
      await Promise.resolve();
    });

    // Проверяем, что данные загружены
    expect(result.current.isLoading).toBe(false);

    // Меняем initialized на false (соединение потеряно)
    rerender({ initialized: false });

    // Симулируем изменение состояния после переключения на неинициализированное состояние
    await act(async () => {
      await Promise.resolve();
    });

    // Теперь при повторной инициализации флаг isFirstLoad должен быть true,
    // так что при следующей успешной инициализации состояние загрузки будет установлено
    rerender({ initialized: true });

    // Проверяем, что состояние загрузки установлено снова
    expect(result.current.isLoading).toBe(true);
  });
});
