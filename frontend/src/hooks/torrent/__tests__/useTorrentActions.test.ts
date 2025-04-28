import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTorrentActions } from "../useTorrentActions";
import * as AppAPI from "@wailsjs/go/main/App"; // Импортируем все API функции
import { MockLocalizationProvider } from "@/test/mocks/localization-context-mock"; // Импорт мока провайдера

// Мокируем API функции
vi.mock("@wailsjs/go/main/App", () => ({
  AddTorrent: vi.fn(),
  AddTorrentFile: vi.fn(),
  RemoveTorrent: vi.fn(),
  StartTorrents: vi.fn(),
  StopTorrents: vi.fn(),
  SetTorrentSpeedLimit: vi.fn(),
  VerifyTorrent: vi.fn(),
}));

// Обертка для использования мока локализации
const renderHookWithProviders = (hook: () => any) => {
  return renderHook(hook, {
    wrapper: MockLocalizationProvider,
  });
};

describe("useTorrentActions", () => {
  const mockOnActionStart = vi.fn();
  const mockOnActionSuccess = vi.fn();
  const mockTorrents = [{
    ID: 1,
    Name: "Test Torrent",
    Status: "stopped",
    Progress: 0,
    Size: 0,
    SizeFormatted: "0 B",
    UploadRatio: 0,
    SeedsConnected: 0,
    SeedsTotal: 0,
    PeersConnected: 0,
    PeersTotal: 0,
    UploadedBytes: 0,
    UploadedFormatted: "0 B",
    DownloadSpeed: 0,
    UploadSpeed: 0,
    DownloadSpeedFormatted: "0 B/s",
    UploadSpeedFormatted: "0 B/s",
    IsSlowMode: false
  }];

  beforeEach(() => {
    vi.clearAllMocks(); // Очищаем моки перед каждым тестом
  });

  const setupHook = () =>
    renderHookWithProviders(() =>
      useTorrentActions({
        onActionStart: mockOnActionStart,
        onActionSuccess: mockOnActionSuccess,
        torrents: mockTorrents,
      })
    );

  // Тесты для addTorrent
  it("addTorrent should call AddTorrentAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.AddTorrent).mockResolvedValue(undefined);
    const { result } = setupHook();

    let success = false;
    await act(async () => {
      success = await result.current.addTorrent(
        "magnet:?xt=urn:btih:hash",
        "/downloads"
      );
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.AddTorrent).toHaveBeenCalledWith(
      "magnet:?xt=urn:btih:hash",
      "/downloads"
    );
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("addTorrent should call AddTorrentAPI and error callbacks on failure", async () => {
    const error = new Error("Failed to add");
    vi.mocked(AppAPI.AddTorrent).mockRejectedValue(error);
    const { result } = setupHook();

    let success = true;
    await act(async () => {
      success = await result.current.addTorrent("magnet:?xt=urn:btih:hash", "");
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.AddTorrent).toHaveBeenCalledWith(
      "magnet:?xt=urn:btih:hash",
      ""
    );
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для addTorrentFile
  it("addTorrentFile should call AddTorrentFileAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.AddTorrentFile).mockResolvedValue(undefined);
    const { result } = setupHook();

    let success = false;
    await act(async () => {
      success = await result.current.addTorrentFile(
        "base64content",
        "/downloads"
      );
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.AddTorrentFile).toHaveBeenCalledWith(
      "base64content",
      "/downloads"
    );
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("addTorrentFile should call AddTorrentFileAPI and error callbacks on failure", async () => {
    const error = new Error("File add failed");
    vi.mocked(AppAPI.AddTorrentFile).mockRejectedValue(error);
    const { result } = setupHook();

    let success = true;
    await act(async () => {
      success = await result.current.addTorrentFile("base64content", "");
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.AddTorrentFile).toHaveBeenCalledWith("base64content", "");
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для removeTorrent
  it("removeTorrent should call RemoveTorrentAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.RemoveTorrent).mockResolvedValue(undefined);
    const { result } = setupHook();

    let success = false;
    await act(async () => {
      success = await result.current.removeTorrent(1, true);
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.RemoveTorrent).toHaveBeenCalledWith(1, true);
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("removeTorrent should call RemoveTorrentAPI and error callbacks on failure", async () => {
    const error = new Error("Remove failed");
    vi.mocked(AppAPI.RemoveTorrent).mockRejectedValue(error);
    const { result } = setupHook();

    let success = true;
    await act(async () => {
      success = await result.current.removeTorrent(1, false);
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.RemoveTorrent).toHaveBeenCalledWith(1, false);
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для startTorrents
  it("startTorrents should call StartTorrentsAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.StartTorrents).mockResolvedValue(undefined);
    const { result } = setupHook();
    const ids = [1, 2];

    let success = false;
    await act(async () => {
      success = await result.current.startTorrents(ids);
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.StartTorrents).toHaveBeenCalledWith(ids);
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("startTorrents should call StartTorrentsAPI and error callbacks on failure", async () => {
    const error = new Error("Start failed");
    vi.mocked(AppAPI.StartTorrents).mockRejectedValue(error);
    const { result } = setupHook();
    const ids = [1];

    let success = true;
    await act(async () => {
      success = await result.current.startTorrents(ids);
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.StartTorrents).toHaveBeenCalledWith(ids);
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для stopTorrents
  it("stopTorrents should call StopTorrentsAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.StopTorrents).mockResolvedValue(undefined);
    const { result } = setupHook();
    const ids = [3, 4];

    let success = false;
    await act(async () => {
      success = await result.current.stopTorrents(ids);
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.StopTorrents).toHaveBeenCalledWith(ids);
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("stopTorrents should call StopTorrentsAPI and error callbacks on failure", async () => {
    const error = new Error("Stop failed");
    vi.mocked(AppAPI.StopTorrents).mockRejectedValue(error);
    const { result } = setupHook();
    const ids = [2];

    let success = true;
    await act(async () => {
      success = await result.current.stopTorrents(ids);
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.StopTorrents).toHaveBeenCalledWith(ids);
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для setSpeedLimit
  it("setSpeedLimit should call SetTorrentSpeedLimitAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.SetTorrentSpeedLimit).mockResolvedValue(undefined);
    const { result } = setupHook();
    const ids = [1];
    const isSlowMode = true;

    let success = false;
    await act(async () => {
      success = await result.current.setSpeedLimit(ids, isSlowMode);
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.SetTorrentSpeedLimit).toHaveBeenCalledWith(ids, isSlowMode);
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("setSpeedLimit should call SetTorrentSpeedLimitAPI and error callbacks on failure", async () => {
    const error = new Error("Speed limit failed");
    vi.mocked(AppAPI.SetTorrentSpeedLimit).mockRejectedValue(error);
    const { result } = setupHook();
    const ids = [1, 5];
    const isSlowMode = false;

    let success = true;
    await act(async () => {
      success = await result.current.setSpeedLimit(ids, isSlowMode);
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.SetTorrentSpeedLimit).toHaveBeenCalledWith(ids, isSlowMode);
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });

  // Тесты для verifyTorrent
  it("verifyTorrent should call VerifyTorrentAPI and success callbacks on success", async () => {
    vi.mocked(AppAPI.VerifyTorrent).mockResolvedValue(undefined);
    const { result } = setupHook();
    const id = 5;

    let success = false;
    await act(async () => {
      success = await result.current.verifyTorrent(id);
    });

    expect(success).toBe(true);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.VerifyTorrent).toHaveBeenCalledWith(id);
    expect(mockOnActionSuccess).toHaveBeenCalledOnce();
  });

  it("verifyTorrent should call VerifyTorrentAPI and error callbacks on failure", async () => {
    const error = new Error("Verify failed");
    vi.mocked(AppAPI.VerifyTorrent).mockRejectedValue(error);
    const { result } = setupHook();
    const id = 6;

    let success = true;
    await act(async () => {
      success = await result.current.verifyTorrent(id);
    });

    expect(success).toBe(false);
    expect(mockOnActionStart).toHaveBeenCalledOnce();
    expect(AppAPI.VerifyTorrent).toHaveBeenCalledWith(id);
    expect(mockOnActionSuccess).not.toHaveBeenCalled();
  });
});
