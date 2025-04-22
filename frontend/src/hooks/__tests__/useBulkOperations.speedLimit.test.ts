import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
// Мокируем зависимости ДО импорта хука
vi.mock("@contexts/LocalizationContext");
vi.mock("@wailsjs/go/main/App");
import { useBulkOperations } from "../useBulkOperations"; // Импортируем хук ПОСЛЕ моков
import {
  mockTorrentsBase,
  mockConfig,
  setupMocks,
  mockSetTorrentSpeedLimit, // Импортируем нужный мок
  mockUseLocalization, // Импортируем для проверки t()
} from "./mocks/useBulkOperations.mocks"; // Импорт общих моков

describe("useBulkOperations - handleSetSpeedLimit", () => {
  let mockRefreshTorrents: Mock;

  beforeEach(() => {
    setupMocks(); // Используем общую функцию настройки
    mockRefreshTorrents = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not set speed limit if already setting", async () => {
    const selected = new Set([1]);
    let resolveApiCall: () => void;
    const apiCallPromise = new Promise<void>((resolve) => {
      resolveApiCall = resolve;
    });

    mockSetTorrentSpeedLimit.mockReturnValueOnce(apiCallPromise);

    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    act(() => {
      result.current.handleSetSpeedLimit(true);
    });

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveApiCall();
      await apiCallPromise;
    });
  });

  it("should not set speed limit if no torrents selected", async () => {
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        new Set(),
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
  });

  it("should not set speed limit if config is undefined", async () => {
    const selected = new Set([1]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        undefined
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
  });

  it("should call SetTorrentSpeedLimit with correct IDs and slow mode true", async () => {
    const selected = new Set([1, 2]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([1, 2], true);
    expect(mockRefreshTorrents).toHaveBeenCalled();
  });

  it("should call SetTorrentSpeedLimit with correct IDs and slow mode false", async () => {
    const selected = new Set([3]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(false);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([3], false);
    expect(mockRefreshTorrents).toHaveBeenCalled();
  });

  it("should set error and reset state on SetTorrentSpeedLimit failure", async () => {
    const selected = new Set([1]);
    const error = new Error("Limit failed");
    mockSetTorrentSpeedLimit.mockRejectedValue(error);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });

    expect(mockSetTorrentSpeedLimit).toHaveBeenCalledWith([1], true);
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
    expect(result.current.error).toBe(`errors.failedToSetSpeedLimit:${error}`);
  });

  it("should set error and reset state on SetTorrentSpeedLimit failure", async () => {
    const selected = new Set([1, 2]);
    const errorMessage = "API Error Speed Limit";
    mockSetTorrentSpeedLimit.mockRejectedValue(new Error(errorMessage)); // Мокируем ошибку
    const mockT = vi.fn((key) => key); // Мокируем функцию t
    mockUseLocalization.mockReturnValue({ t: mockT });

    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );

    await act(async () => {
      await result.current.handleSetSpeedLimit(true); // isSlowMode = true
    });

    // Проверяем установку ошибки
    expect(result.current.error).toContain("errors.failedToSetSpeedLimit");
    expect(mockT).toHaveBeenCalledWith(
      "errors.failedToSetSpeedLimit",
      expect.stringContaining(errorMessage)
    );

    // Проверяем сброс состояния в finally
    expect(result.current.bulkOperations.speedLimit).toBe(false);
    // Дополнительно можно проверить lastBulkAction

    // Убедимся, что refresh не вызывался после ошибки
    expect(mockRefreshTorrents).not.toHaveBeenCalled();
  });

  it("should early return if already setting speed limit (branch coverage)", async () => {
    const selected = new Set([1]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      result.current.bulkOperations.speedLimit = true;
      await result.current.handleSetSpeedLimit(true);
    });
    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
  });

  it("should early return if no torrents selected (branch coverage)", async () => {
    const selected = new Set<number>();
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        mockConfig
      )
    );
    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });
    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
  });

  it("should early return if config is undefined (branch coverage)", async () => {
    const selected = new Set([1]);
    const { result } = renderHook(() =>
      useBulkOperations(
        mockTorrentsBase,
        selected,
        mockRefreshTorrents,
        undefined
      )
    );
    await act(async () => {
      await result.current.handleSetSpeedLimit(true);
    });
    expect(mockSetTorrentSpeedLimit).not.toHaveBeenCalled();
  });
});
