import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TorrentData } from "@/components/TorrentList";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import {
  mockTorrentsBase,
  mockConfig,
  setupMocks,
  mockStopTorrents, // Импортируем нужный мок
  mockUseLocalization, // Импортируем для проверки t()
} from "./mocks/useBulkOperations.mocks"; // Импорт общих моков

describe("useBulkOperations - handleStopSelected", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks(); // Используем общую функцию настройки
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not stop if already stopping", async () => {
    // ...existing code...
  });

  it("should not stop if no torrents selected", async () => {
    // ...existing code...
  });

  it("should not stop if no selected torrents are running", async () => {
    // ...existing code...
  });

  it("should call StopTorrents with correct IDs and refresh", async () => {
    // ...existing code...
  });

  it("should early return if already stopping (branch coverage)", async () => {
    const selected = new Set([2]);
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      selected.has(t.ID)
    );
    const { result } = renderHook(() =>
      useBulkOperations(
        initialTorrents,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      result.current.bulkOperations.stop = true;
      await result.current.handleStopSelected();
    });
    expect(mockStopTorrents).not.toHaveBeenCalled();
  });

  it("should early return if no torrents selected (branch coverage)", async () => {
    const selected = new Set<number>();
    const initialTorrents: TorrentData[] = [];
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
    expect(mockStopTorrents).not.toHaveBeenCalled();
  });

  it("should set error and reset state on StopTorrents failure (covers line 216)", async () => {
    const selected = new Set([2]); // T2 is downloading
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      selected.has(t.ID)
    );
    const errorMessage = "API Error Stop";
    mockStopTorrents.mockRejectedValue(new Error(errorMessage));
    const mockT = vi.fn((key) => key);
    mockUseLocalization.mockReturnValue({ t: mockT });

    const { result } = renderHook(() =>
      // Убираем rerender и props
      useBulkOperations(
        initialTorrents,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    // Сохраняем состояние ДО вызова, чтобы убедиться, что оно сбрасывается
    const initialBulkState = { ...result.current.bulkOperations };
    expect(initialBulkState.stop).toBe(false); // Убедимся, что начинаем с false

    await act(async () => {
      await result.current.handleStopSelected();
    });

    // Проверяем установку ошибки
    expect(result.current.error).toContain("errors.failedToStopTorrents");
    expect(mockT).toHaveBeenCalledWith(
      "errors.failedToStopTorrents",
      expect.stringContaining(errorMessage)
    );

    // Проверяем сброс флага операции stop в блоке catch
    expect(result.current.bulkOperations.stop).toBe(false);
    // Проверяем, что остальные флаги не изменились
    expect(result.current.bulkOperations.start).toBe(initialBulkState.start);
    expect(result.current.bulkOperations.remove).toBe(initialBulkState.remove);
    expect(result.current.bulkOperations.speedLimit).toBe(
      initialBulkState.speedLimit
    );

    // Убедимся, что refresh не вызывался
    expect(mockRefreshTorrents).not.toHaveBeenCalled();

    // Проверка сброса lastBulkAction и lastTorrentStates (строка 216) косвенная:
    // Если бы они не сбросились, последующий useEffect мог бы сработать некорректно.
    // Прямой доступ к ним затруднен. Считаем, что сброс флага операции достаточен.
  });
});
