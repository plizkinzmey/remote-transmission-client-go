import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
// Импорт хука ПОСЛЕ моков
// import { useTorrentFiles } from "../useTorrentFiles"; // Перемещено ниже
import {
    setupCommonMocks,
    mockGetTorrentFiles,
    mockBuildFileTree,
    mockRawFiles,
    mockFileTreeInitial,
    torrentId,
} from "./useTorrentFiles.setup"; // Fix: Update import path

// Импортируем хук ПОСЛЕ setupCommonMocks
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Initialization and Loading", () => {
    setupCommonMocks(); // Применяет beforeEach с vi.resetAllMocks() и моками по умолчанию

    it("should initialize, load files, and set initial state", async () => {
        // Настройка мока для этого теста
        mockGetTorrentFiles.mockResolvedValue([...mockRawFiles]);
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Не проверяем loading: true здесь, так как моки могут быть слишком быстрыми
        expect(result.current.fileTree).toEqual([]); // Проверяем начальное пустое дерево
        expect(result.current.error).toBeNull(); // Проверяем начальное отсутствие ошибки

        // Ждем завершения загрузки
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Проверяем состояние ПОСЛЕ загрузки
        expect(mockGetTorrentFiles).toHaveBeenCalledWith(torrentId);
        expect(mockBuildFileTree).toHaveBeenCalledWith(mockRawFiles);
        expect(result.current.fileTree).toEqual(mockFileTreeInitial);
        expect(result.current.error).toBeNull();
        expect(result.current.allChecked).toBe(false); // На основе mockFileTreeInitial
        expect(result.current.indeterminate).toBe(true); // На основе mockFileTreeInitial
    });

    it("should handle error during file loading", async () => {
        const loadError = new Error("Failed to load");
        mockGetTorrentFiles.mockRejectedValue(loadError);
        // Настройка мока buildFileTree (хотя он не должен вызваться)
        mockBuildFileTree.mockImplementationOnce(() => []);

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.loading).toBe(false);
        expect(result.current.fileTree).toEqual([]);
        // Проверяем, что ошибка теперь включает детали из String(err) благодаря исправленному моку t
        expect(result.current.error).toBe("errors.failedToLoadFiles:Error: Failed to load");
        // Состояния allChecked/indeterminate должны остаться начальными (true/false) при ошибке загрузки
        expect(result.current.allChecked).toBe(true);
        expect(result.current.indeterminate).toBe(false);
    });
});