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
  mockStartTorrents,
  mockUseLocalization, // Импортируем для проверки t()
} from "./mocks/useBulkOperations.mocks";

describe("useBulkOperations - handleStartSelected", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks();
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not start if already starting", async () => {
    // ...existing code...
  });

  it("should not start if no torrents selected", async () => {
    // ...existing code...
  });

  it("should not start if no selected torrents are stopped or completed", async () => {
    // ...existing code...
  });

  it("should call StartTorrents with correct IDs and refresh", async () => {
    // ...existing code...
  });

  it("should set error and reset state on StartTorrents failure", async () => {
    const selected = new Set([1]); // T1 is stopped
    const initialTorrents: TorrentData[] = mockTorrentsBase.filter((t) =>
      selected.has(t.ID)
    );
    const errorMessage = "API Error Start";
    mockStartTorrents.mockRejectedValue(new Error(errorMessage)); // Мокируем ошибку
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
      await result.current.handleStartSelected();
    });

    // Проверяем установку ошибки
    expect(result.current.error).toContain("errors.failedToStartTorrents");
    expect(mockT).toHaveBeenCalledWith(
      "errors.failedToStartTorrents",
      expect.stringContaining(errorMessage)
    );

    // Проверяем сброс состояния
    expect(result.current.bulkOperations.start).toBe(false);
    // Дополнительно можно проверить, что lastBulkAction и lastTorrentStates сброшены,
    // но это внутреннее состояние, и сброс флага start косвенно это подтверждает.

    // Убедимся, что refresh не вызывался
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
  });

  it("should early return if already starting (branch coverage)", async () => {
    const selected = new Set([1]);
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
    // Симулируем уже идущую операцию
    await act(async () => {
      result.current.bulkOperations.start = true;
      await result.current.handleStartSelected();
    });
    // Если ветка покрыта, то StartTorrents не вызовется
    expect(mockStartTorrents).not.toHaveBeenCalled();
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
      await result.current.handleStartSelected();
    });
    expect(mockStartTorrents).not.toHaveBeenCalled();
  });
});
