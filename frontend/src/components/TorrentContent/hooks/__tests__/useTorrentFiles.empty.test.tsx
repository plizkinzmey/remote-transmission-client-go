import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
    setupCommonMocks,
    mockGetTorrentFiles,
    mockBuildFileTree,
    mockSetFilesWanted,
    torrentId,
} from "./useTorrentFiles.setup";

// Импортируем хук ПОСЛЕ setupCommonMocks
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Empty States", () => {
    setupCommonMocks();

    it("should handle empty file list from API correctly", async () => {
        // Настройка: API возвращает пустой массив, buildFileTree тоже
        mockGetTorrentFiles.mockResolvedValue([]);
        mockBuildFileTree.mockImplementationOnce(() => []);

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Ждем завершения загрузки
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Проверяем состояние после загрузки пустого списка
        expect(result.current.fileTree).toEqual([]);
        expect(result.current.error).toBeNull();
        // Проверяем покрытие строк 60-66: !hasFiles должно привести к allChecked=true
        expect(result.current.allChecked).toBe(true);
        expect(result.current.indeterminate).toBe(false);
    });

    it("should handle toggleAll when fileTree is empty", async () => {
        // Настройка: инициализируем с пустым деревом
        mockGetTorrentFiles.mockResolvedValue([]);
        mockBuildFileTree.mockImplementationOnce(() => []);

        // Шпионим за console.warn
        const consoleWarnSpy = vi.spyOn(console, "warn");

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Ждем завершения загрузки
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Убедимся, что дерево пустое
        expect(result.current.fileTree).toEqual([]);

        // Вызываем toggleAll
        await act(async () => {
            await result.current.toggleAll();
        });

        // Проверяем покрытие строк 166-168:
        // 1. SetFilesWanted не должен был вызваться
        expect(mockSetFilesWanted).not.toHaveBeenCalled();
        // 2. Должно было вызваться console.warn
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "toggleAll called with no files to toggle."
        );
        // 3. Состояние allChecked/indeterminate не должно измениться
        expect(result.current.allChecked).toBe(true);
        expect(result.current.indeterminate).toBe(false);
        expect(result.current.error).toBeNull(); // Ошибки быть не должно

        // Восстанавливаем оригинальный console.warn
        consoleWarnSpy.mockRestore();
    });
});
