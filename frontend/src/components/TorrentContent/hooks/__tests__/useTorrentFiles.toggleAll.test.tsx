import { describe, it, expect, vi } from "vitest"; // Добавили vi для console.log
import { renderHook, act, waitFor } from "@testing-library/react";
// ИМПОРТЫ ДОЛЖНЫ БЫТЬ ПОСЛЕ МОКОВ В setupCommonMocks
// import { useTorrentFiles } from "../useTorrentFiles"; // Перемещено ниже
import { domain } from "@wailsjs/go/models";
import { FileNode } from "types/FileTree";
import {
    setupCommonMocks,
    mockSetFilesWanted,
    mockGetTorrentFiles,
    mockBuildFileTree,
    mockFileTreeInitial,
    torrentId,
    mockRawFiles,
} from "./useTorrentFiles.setup"; // Fix: Update import path

// Импортируем хук ПОСЛЕ setupCommonMocks
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Toggle All", () => {
    setupCommonMocks();

    it("should toggle all files to wanted=true when indeterminate", async () => {
        // Настройка для этого теста: используем исходное дерево
        mockGetTorrentFiles.mockResolvedValue([...mockRawFiles]);
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Ждем только окончания загрузки
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Проверяем состояние СРАЗУ ПОСЛЕ загрузки
        expect(result.current.indeterminate).toBe(true); // Ожидаем true
        expect(result.current.allChecked).toBe(false); // Ожидаем false

        const allFileIds = [0, 1, 2];

        await act(async () => {
            await result.current.toggleAll();
        });

        // Проверяем вызов API
        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, allFileIds, true);

        // Проверяем состояние дерева и хука ПОСЛЕ toggleAll, используя waitFor
        await waitFor(() => {
            expect(result.current.allChecked).toBe(true); // Состояние должно обновиться
            expect(result.current.indeterminate).toBe(false);
            expect(result.current.fileTree[0].Wanted).toBe(true);
            const file2 = result.current.fileTree[1]?.children?.[0];
            const file3 = result.current.fileTree[1]?.children?.[1]?.children?.[0];
            expect(file2?.Wanted).toBe(true);
            expect(file3?.Wanted).toBe(true);
            expect(result.current.error).toBeNull();
        });
    });

    it("should toggle all files to wanted=false when allChecked", async () => {
        // --- Настройка для этого теста: все файлы wanted=true ---
        const allWantedRaw: domain.TorrentFile[] = mockRawFiles.map(f => ({ ...f, Wanted: true }));
        const allWantedTree: FileNode[] = JSON.parse(JSON.stringify(mockFileTreeInitial));
        const setWantedTrue = (nodes: FileNode[]) => {
            nodes.forEach(node => {
                node.Wanted = true;
                node.indeterminate = false;
                if (node.children) setWantedTrue(node.children);
            });
        };
        setWantedTrue(allWantedTree);

        mockGetTorrentFiles.mockResolvedValue(allWantedRaw);
        // Устанавливаем мок buildFileTree для этого теста
        mockBuildFileTree.mockImplementationOnce(() => allWantedTree);
        // --- Конец настройки ---

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Ждем окончания загрузки И установки allChecked в true
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.allChecked).toBe(true); // Ожидаем true из-за настройки
            expect(result.current.indeterminate).toBe(false); // Ожидаем false
        });

        // Дополнительная проверка состояния перед действием
        expect(result.current.allChecked).toBe(true);
        expect(result.current.indeterminate).toBe(false);

        const allFileIds = [0, 1, 2];

        // Лог состояния ПЕРЕД вызовом toggleAll
        // eslint-disable-next-line no-console
        console.log("TEST DEBUG (allChecked): State before toggleAll - allChecked:", result.current.allChecked, "indeterminate:", result.current.indeterminate, "fileTree empty:", result.current.fileTree.length === 0);


        await act(async () => {
            await result.current.toggleAll();
        });

        // Проверяем вызов API
        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, allFileIds, false);

        // Проверяем состояние дерева и хука ПОСЛЕ toggleAll, используя waitFor
        await waitFor(() => {
            expect(result.current.allChecked).toBe(false); // Состояние должно обновиться
            expect(result.current.indeterminate).toBe(false);
            expect(result.current.fileTree[0].Wanted).toBe(false);
            const file2 = result.current.fileTree[1]?.children?.[0];
            const file3 = result.current.fileTree[1]?.children?.[1]?.children?.[0];
            expect(file2?.Wanted).toBe(false);
            expect(file3?.Wanted).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    it("should handle error during toggleAll", async () => {
        // Настройка для этого теста: используем исходное дерево
        mockGetTorrentFiles.mockResolvedValue([...mockRawFiles]);
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const toggleAllError = new Error("Failed to set all wanted");
        mockSetFilesWanted.mockRejectedValue(toggleAllError);

        const { result } = renderHook(() => useTorrentFiles(torrentId));

        // Ждем только окончания загрузки
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Проверяем начальное состояние СРАЗУ ПОСЛЕ загрузки
        expect(result.current.indeterminate).toBe(true); // Ожидаем true
        expect(result.current.allChecked).toBe(false); // Ожидаем false

        const allFileIds = [0, 1, 2];

        await act(async () => {
            await result.current.toggleAll();
        });

        // Проверяем вызов API (он должен был быть вызван перед ошибкой)
        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, allFileIds, true);

        // Проверяем, что состояние НЕ изменилось из-за ошибки
        // Используем waitFor, чтобы убедиться, что React закончил обработку ошибки
        await waitFor(() => {
            expect(result.current.fileTree).toEqual(mockFileTreeInitial); // Дерево осталось прежним
            expect(result.current.allChecked).toBe(false); // Как было при indeterminate=true
            expect(result.current.indeterminate).toBe(true); // Как было при indeterminate=true
            expect(result.current.error).toBe("errors.failedToUpdateFiles:Error: Failed to set all wanted");
        });
    });
});