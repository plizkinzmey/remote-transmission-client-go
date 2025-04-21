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

  it("should set error and reset state on StopTorrents failure", async () => {
    const selected = new Set([2]); // T2 is downloading
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      selected.has(t.ID)
    );
    const errorMessage = "API Error Stop";
    mockStopTorrents.mockRejectedValue(new Error(errorMessage)); // Мокируем ошибку
    const mockT = vi.fn((key) => key); // Мокируем функцию t
    mockUseLocalization.mockReturnValue({ t: mockT });

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

    // Проверяем установку ошибки
    expect(result.current.error).toContain("errors.failedToStopTorrents");
    expect(mockT).toHaveBeenCalledWith(
      "errors.failedToStopTorrents",
      expect.stringContaining(errorMessage)
    );

    // Проверяем сброс состояния
    expect(result.current.bulkOperations.stop).toBe(false);
    // Дополнительно можно проверить lastBulkAction и lastTorrentStates

    // Убедимся, что refresh не вызывался
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
  });
});
