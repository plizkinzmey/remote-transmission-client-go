import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { useModals, UseModalsReturn, TorrentFileData } from "../useModals"; // Import from the hook file directly for testing
// Corrected import paths to match tsconfig.json alias
import { EventsOn as actualEventsOn } from "@wailsjs/runtime";
import { LoadConfig as actualLoadConfig } from "@wailsjs/go/main/App";

// --- Mocks ---
const mockEventsOn = actualEventsOn as Mock;
const mockLoadConfig = actualLoadConfig as Mock;

let eventCallback: ((path: string) => void) | null = null; // To store and trigger the event callback
let mockUnsubscribeFn = vi.fn(); // To store the mock unsubscribe function

// --- Tests ---
describe("useModals Hook", () => {
  // Helper to render the hook
  const renderUseModals = () => renderHook(() => useModals());

  beforeEach(() => {
    // Reset mocks and state before each test
    vi.clearAllMocks();
    eventCallback = null;
    mockUnsubscribeFn = vi.fn(); // Create a new mock unsubscribe function for each test

    // Default mock implementations for this test suite
    mockLoadConfig.mockResolvedValue({ some: "config" }); // Default: config exists (not first start)

    // Set up the EventsOn mock implementation for this test suite
    mockEventsOn.mockImplementation((eventName, callback) => {
      if (eventName === "torrent-opened") {
        eventCallback = callback; // Store the callback
      }
      // Return our specific mock unsubscribe function for this test run
      return mockUnsubscribeFn;
    });
  });

  it("should initialize with default states", () => {
    const { result } = renderUseModals();
    expect(result.current.showSettings).toBe(false);
    expect(result.current.showAddTorrent).toBe(false);
    expect(result.current.torrentFilePath).toBeNull();
    expect(result.current.isFirstStart).toBe(false);
    expect(result.current.torrentFileData).toBeNull();
  });

  // --- checkFirstStart ---
  describe("checkFirstStart", () => {
    it("should not change state if isReconnecting is true", async () => {
      const { result } = renderUseModals();
      await act(async () => {
        await result.current.checkFirstStart(true);
      });
      expect(mockLoadConfig).not.toHaveBeenCalled();
      expect(result.current.isFirstStart).toBe(false);
      expect(result.current.showSettings).toBe(false);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig returns null (first start)", async () => {
      mockLoadConfig.mockResolvedValue(null);
      const { result } = renderUseModals();
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig returns undefined (first start)", async () => {
      mockLoadConfig.mockResolvedValue(undefined);
      const { result } = renderUseModals();
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
    });

    it("should set isFirstStart and showSettings to true if LoadConfig throws an error", async () => {
      const testError = new Error("Config load failed");
      mockLoadConfig.mockRejectedValue(testError);
      const { result } = renderUseModals();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(true);
      expect(result.current.showSettings).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading config during first start check:",
        testError
      );
      consoleErrorSpy.mockRestore();
    });

    it("should not change state if LoadConfig returns a config (not first start)", async () => {
      mockLoadConfig.mockResolvedValue({ some: "config" });
      const { result } = renderUseModals();
      await act(async () => {
        await result.current.checkFirstStart(false);
      });
      expect(mockLoadConfig).toHaveBeenCalledTimes(1);
      expect(result.current.isFirstStart).toBe(false);
      expect(result.current.showSettings).toBe(false);
    });
  });

  // --- Settings Modal ---
  it("openSettings should set showSettings to true", () => {
    const { result } = renderUseModals();
    act(() => {
      result.current.openSettings();
    });
    expect(result.current.showSettings).toBe(true);
  });

  it("closeSettings should set showSettings to false if not first start", () => {
    const { result } = renderUseModals();
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
    mockLoadConfig.mockResolvedValue(null);
    const { result } = renderUseModals();
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
    mockLoadConfig.mockResolvedValue(null);
    const { result } = renderUseModals();
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
    const { result } = renderUseModals();
    act(() => {
      result.current.openAddTorrent();
    });
    expect(result.current.showAddTorrent).toBe(true);
  });

  it("closeAddTorrent should set showAddTorrent to false and clear torrent data", () => {
    const { result } = renderUseModals();
    const testPath = "/path/to/event.torrent";
    act(() => {
      result.current.handleTorrentFileDrop("test.torrent", "dGVzdA==");
    });
    expect(eventCallback).toBeDefined();
    act(() => {
      if (eventCallback) {
        eventCallback(testPath);
      }
    });
    expect(result.current.showAddTorrent).toBe(true);
    expect(result.current.torrentFileData).toEqual({
      name: "test.torrent",
      data: "dGVzdA==",
    });
    expect(result.current.torrentFilePath).toBe(testPath);
    act(() => {
      result.current.closeAddTorrent();
    });
    expect(result.current.showAddTorrent).toBe(false);
    expect(result.current.torrentFilePath).toBeNull();
    expect(result.current.torrentFileData).toBeNull();
  });

  // --- Torrent File Handling ---
  it("handleTorrentFileDrop should set torrentFileData and showAddTorrent", () => {
    const { result } = renderUseModals();
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

  // --- EventsOn Handling ---
  it('should subscribe to "torrent-opened" event on mount', () => {
    renderUseModals();
    expect(mockEventsOn).toHaveBeenCalledWith(
      "torrent-opened",
      expect.any(Function)
    );
  });

  it('should set torrentFilePath and showAddTorrent when "torrent-opened" event is received', () => {
    const { result } = renderUseModals();
    const testPath = "/some/path/file.torrent";
    expect(eventCallback).toBeDefined();
    act(() => {
      if (eventCallback) {
        eventCallback(testPath);
      }
    });
    expect(result.current.torrentFilePath).toBe(testPath);
    expect(result.current.showAddTorrent).toBe(true);
  });

  it('should handle invalid data from "torrent-opened" event gracefully', () => {
    const { result } = renderUseModals();
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    expect(eventCallback).toBeDefined();
    act(() => {
      if (eventCallback) {
        // Use type assertion 'as any' to bypass type checking for the test
        eventCallback(null as any);
      }
    });
    expect(result.current.torrentFilePath).toBeNull();
    expect(result.current.showAddTorrent).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Received invalid torrent path via event:",
      null
    );
    consoleWarnSpy.mockRestore();
  });

  it("should call the unsubscribe function when the hook unmounts", () => {
    const { unmount } = renderUseModals();
    expect(mockUnsubscribeFn).not.toHaveBeenCalled();
    unmount();
    expect(mockUnsubscribeFn).toHaveBeenCalledTimes(1);
  });
});
