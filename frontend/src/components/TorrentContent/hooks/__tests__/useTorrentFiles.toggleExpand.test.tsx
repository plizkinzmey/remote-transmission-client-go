import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
// Импорт хука ПОСЛЕ моков
import {
    setupCommonMocks,
    mockBuildFileTree, // Импортируем мок для настройки
    mockFileTreeInitial, // Импортируем начальное дерево
    torrentId,
    findNodeByPath,
} from "./useTorrentFiles.setup"; // Fix: Update import path

// Импортируем хук ПОСЛЕ setupCommonMocks
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Toggle Expand", () => {
    setupCommonMocks(); // Применяет beforeEach с vi.resetAllMocks() и моками по умолчанию

    it("should toggle expand state of a node", async () => {
        // Настройка мока для этого теста
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Теперь fileTree должен быть корректно загружен
        const nodeToExpand = findNodeByPath(result.current.fileTree, "folder");
        expect(nodeToExpand).not.toBeNull(); // Эта проверка теперь должна пройти
        if (!nodeToExpand) return; // Защита для TypeScript
        expect(nodeToExpand.expanded).toBeUndefined(); // Начальное состояние

        act(() => {
            result.current.toggleExpand(nodeToExpand);
        });
        let updatedNode = findNodeByPath(result.current.fileTree, "folder");
        expect(updatedNode?.expanded).toBe(true); // Должно стать true

        // Повторный вызов для проверки переключения обратно в false
        act(() => {
            // Передаем обновленный узел (или можно снова найти по пути)
            result.current.toggleExpand(updatedNode!);
        });
        updatedNode = findNodeByPath(result.current.fileTree, "folder");
        expect(updatedNode?.expanded).toBe(false); // Должно стать false
    });
});