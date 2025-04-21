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

    it("should toggle expand state of a top-level node with children", async () => {
        // Переименовали для ясности
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

    it("should toggle expand state of a nested node with children", async () => {
        // Настройка мока для этого теста
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        const nestedNodePath = "folder/subfolder";
        const nodeToExpand = findNodeByPath(result.current.fileTree, nestedNodePath);
        expect(nodeToExpand).not.toBeNull();
        if (!nodeToExpand) return;
        expect(nodeToExpand.expanded).toBeUndefined(); // Начальное состояние

        // Первый вызов - развернуть
        act(() => {
            result.current.toggleExpand(nodeToExpand);
        });
        let updatedNode = findNodeByPath(result.current.fileTree, nestedNodePath);
        expect(updatedNode?.expanded).toBe(true); // Должно стать true
        // Проверим, что родительский узел не изменился (кроме ссылки на children)
        const parentNode = findNodeByPath(result.current.fileTree, "folder");
        expect(parentNode?.expanded).toBeUndefined();

        // Второй вызов - свернуть
        act(() => {
            result.current.toggleExpand(updatedNode!);
        });
        updatedNode = findNodeByPath(result.current.fileTree, nestedNodePath);
        expect(updatedNode?.expanded).toBe(false); // Должно стать false
    });

    it("should not change state when toggling expand on a node without children", async () => {
        // Настройка мока для этого теста
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        const fileNode = findNodeByPath(result.current.fileTree, "file1.txt");
        expect(fileNode).not.toBeNull();
        if (!fileNode) return;
        expect(fileNode.expanded).toBeUndefined(); // Файлы не имеют expanded

        const initialTreeState = JSON.stringify(result.current.fileTree);

        act(() => {
            // Пытаемся "развернуть" файл
            result.current.toggleExpand(fileNode);
        });

        // Проверяем, что состояние дерева не изменилось
        const finalTreeState = JSON.stringify(result.current.fileTree);
        expect(finalTreeState).toBe(initialTreeState);

        // Проверяем сам узел - expanded не должен появиться
        const updatedFileNode = findNodeByPath(result.current.fileTree, "file1.txt");
        expect(updatedFileNode?.expanded).toBeUndefined();
    });
});