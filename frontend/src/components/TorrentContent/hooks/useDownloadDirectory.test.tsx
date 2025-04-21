import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDownloadDirectory } from "./useDownloadDirectory";
import * as App from "@wailsjs/go/main/App";

// Мокаем Wails Go функции
vi.mock("@wailsjs/go/main/App", () => ({
    GetTorrentDownloadDirectory: vi.fn(),
}));

const mockGetTorrentDownloadDirectory = vi.mocked(
    App.GetTorrentDownloadDirectory
);

describe("useDownloadDirectory Hook", () => {
    const torrentId = 123;

    beforeEach(() => {
        // Сбрасываем моки перед каждым тестом
        vi.resetAllMocks();
    });

    it("should initialize with loading state", () => {
        mockGetTorrentDownloadDirectory.mockResolvedValueOnce("/downloads/initial"); // Мок для предотвращения ошибки в useEffect
        const { result } = renderHook(() => useDownloadDirectory(torrentId));

        expect(result.current.loading).toBe(true);
        expect(result.current.downloadDir).toBe("");
        expect(result.current.error).toBeNull();
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledTimes(1); // Вызывается в useEffect
    });

    it("should load download directory successfully", async () => {
        const expectedDir = "/downloads/movies";
        mockGetTorrentDownloadDirectory.mockResolvedValue(expectedDir);

        const { result } = renderHook(() => useDownloadDirectory(torrentId));

        // Ждем завершения асинхронной операции
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.loading).toBe(false);
        expect(result.current.downloadDir).toBe(expectedDir);
        expect(result.current.error).toBeNull(); // Убеждаемся, что setError(null) был вызван
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledWith(torrentId);
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledTimes(1);
    });

    it("should handle error when loading download directory", async () => {
        const errorMessage = "Failed to fetch directory";
        mockGetTorrentDownloadDirectory.mockRejectedValue(errorMessage);

        const { result } = renderHook(() => useDownloadDirectory(torrentId));

        // Ждем завершения асинхронной операции
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.loading).toBe(false);
        expect(result.current.downloadDir).toBe("");
        expect(result.current.error).toBe(errorMessage);
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledWith(torrentId);
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledTimes(1);
    });

    it("should reload directory when loadDownloadDirectory is called manually", async () => {
        const initialDir = "/downloads/initial";
        const updatedDir = "/downloads/updated";

        // Первый вызов (в useEffect)
        mockGetTorrentDownloadDirectory.mockResolvedValueOnce(initialDir);
        const { result } = renderHook(() => useDownloadDirectory(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.downloadDir).toBe(initialDir);
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledTimes(1);

        // Второй вызов (ручной)
        mockGetTorrentDownloadDirectory.mockResolvedValueOnce(updatedDir);
        await act(async () => {
            await result.current.loadDownloadDirectory();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.downloadDir).toBe(updatedDir);
        expect(result.current.error).toBeNull();
        expect(mockGetTorrentDownloadDirectory).toHaveBeenCalledTimes(2);
        expect(mockGetTorrentDownloadDirectory).toHaveBeenNthCalledWith(2, torrentId);
    });
});
