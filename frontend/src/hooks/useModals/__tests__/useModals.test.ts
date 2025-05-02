import React from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useModals, UseModalsReturn, TorrentFileData } from "../useModals";
import { EventsOn } from "@wailsjs/runtime";
import { LoadConfig } from "@wailsjs/go/main/App";
// Импортируем настоящий тип Config
import { domain } from "@wailsjs/go/models";

// --- Mocks ---
vi.mock("@wailsjs/runtime", () => ({
  EventsOn: vi.fn(),
}));

vi.mock("@wailsjs/go/main/App", () => ({
  LoadConfig: vi.fn(),
}));

// --- Tests ---
describe("useModals Hook - базовая функциональность", () => {
  // Helper to store event callback and unsubscribe mock
  let mockUnsubscribeFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
    mockUnsubscribeFn = vi.fn();

    // Default mock implementations for this test suite
    vi.mocked(LoadConfig).mockResolvedValue({
      host: "localhost",
      port: 9091,
      language: "en",
      theme: "light",
    } as domain.Config);

    // Set up the EventsOn mock implementation for this test suite
    vi.mocked(EventsOn).mockImplementation(() => {
      // Return our specific mock unsubscribe function for this test run
      return mockUnsubscribeFn;
    });
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useModals());
    expect(result.current.showSettings).toBe(false);
    expect(result.current.showAddTorrent).toBe(false);
    expect(result.current.torrentFilePath).toBeNull();
    expect(result.current.isFirstStart).toBe(false);
    expect(result.current.torrentFileData).toBeNull();
  });

  // --- checkFirstStart ---
  describe("checkFirstStart", () => {
    it("should not change state if isReconnecting is true", async () => {
      const { result } = renderHook(() => useModals());
      await act(async () => {
        await result.current.checkFirstStart(true);
      });
      expect(LoadConfig).not.toHaveBeenCalled();
      expect(result.current.isFirstStart).toBe(false);
      expect(result.current.showSettings).toBe(false);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig returns null (first start)", async () => {
      vi.mocked(LoadConfig).mockResolvedValue(null as unknown as domain.Config);
      const { result } = renderHook(() => useModals());
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(LoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig returns undefined (first start)", async () => {
      vi.mocked(LoadConfig).mockResolvedValue(
        undefined as unknown as domain.Config
      );
      const { result } = renderHook(() => useModals());
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(LoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig throws an error", async () => {
      const testError = new Error("Config load failed");
      vi.mocked(LoadConfig).mockRejectedValue(testError);
      const { result } = renderHook(() => useModals());
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(LoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading config during first start check:",
        testError
      );
      consoleErrorSpy.mockRestore();
    });

    it("should not change state if LoadConfig returns a config (not first start)", async () => {
      vi.mocked(LoadConfig).mockResolvedValue({
        host: "localhost",
        port: 9091,
        language: "en",
        theme: "light",
      } as domain.Config);
      const { result } = renderHook(() => useModals());
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(LoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(false);
      expect(result.current.showSettings).toBe(false);
    });
  });

  // --- Settings Modal ---
  it("openSettings should set showSettings to true", () => {
    const { result } = renderHook(() => useModals());
    act(() => {
      result.current.openSettings();
    });
    expect(result.current.showSettings).toBe(true);
  });

  it("closeSettings should set showSettings to false if not first start", () => {
    const { result } = renderHook(() => useModals());
    act(() => {
      result.current.openSettings();
    });
    expect(result.current.showSettings).toBe(true);
    act(() => {
      result.current.closeSettings();
    });
    expect(result.current.showSettings).toBe(false);
  });

  it("closeSettings should not change showSettings if isFirstStart is true", async () => {
    vi.mocked(LoadConfig).mockResolvedValue(null as unknown as domain.Config);
    const { result } = renderHook(() => useModals());
    await act(async () => {
      await result.current.checkFirstStart(false);
    });
    expect(result.current.isFirstStart).toBe(true);
    expect(result.current.showSettings).toBe(true);
    act(() => {
      result.current.closeSettings();
    });
    expect(result.current.showSettings).toBe(true);
  });

  it("handleSuccessfulSettingsSave should set isFirstStart and showSettings to false", async () => {
    vi.mocked(LoadConfig).mockResolvedValue(null as unknown as domain.Config);
    const { result } = renderHook(() => useModals());
    await act(async () => {
      await result.current.checkFirstStart(false);
    });
    expect(result.current.isFirstStart).toBe(true);
    expect(result.current.showSettings).toBe(true);
    act(() => {
      result.current.handleSuccessfulSettingsSave();
    });
    expect(result.current.isFirstStart).toBe(false);
    expect(result.current.showSettings).toBe(false);
  });

  // --- Add Torrent Modal ---
  it("openAddTorrent should set showAddTorrent to true", () => {
    const { result } = renderHook(() => useModals());
    act(() => {
      result.current.openAddTorrent();
    });
    expect(result.current.showAddTorrent).toBe(true);
  });

  it("closeAddTorrent should set showAddTorrent to false and clear torrent data", () => {
    const { result } = renderHook(() => useModals());

    // Открываем модаль и добавляем данные торрента
    act(() => {
      result.current.handleTorrentFileDrop("test.torrent", "dGVzdA==");
    });

    expect(result.current.showAddTorrent).toBe(true);
    expect(result.current.torrentFileData).not.toBeNull();

    // Закрываем модаль и проверяем, что данные очистились
    act(() => {
      result.current.closeAddTorrent();
    });

    expect(result.current.showAddTorrent).toBe(false);
    expect(result.current.torrentFilePath).toBe(null);
    expect(result.current.torrentFileData).toBe(null);
  });

  // --- Torrent File Handling ---
  it("handleTorrentFileDrop should set torrentFileData and showAddTorrent", () => {
    const { result } = renderHook(() => useModals());
    const fileName = "dropped.torrent";
    const fileData = "dGVzdGRhdGE=";

    act(() => {
      result.current.handleTorrentFileDrop(fileName, fileData);
    });

    expect(result.current.torrentFileData).toEqual({
      name: fileName,
      data: fileData,
    });
    expect(result.current.showAddTorrent).toBe(true);
  });

  it("should register event handlers and clean up on unmount", () => {
    const { unmount } = renderHook(() => useModals());
    expect(EventsOn).toHaveBeenCalledWith(
      "torrent-opened",
      expect.any(Function)
    );

    unmount();
    expect(mockUnsubscribeFn).toHaveBeenCalledTimes(1);
  });
});
