import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
// --- ВСЕ Моки и setupCommonMocks должны быть ДО импорта useTorrentFiles ---
import {
    setupCommonMocks,
    mockSetFilesWanted,
    mockCollectFileIds,
    mockBuildFileTree, // Импортируем мок
    mockFileTreeInitial, // Импортируем дерево
    torrentId,
    findNodeByPath,
} from "./useTorrentFiles.setup";

// ВАЖНО: импортировать useTorrentFiles только после vi.mock/setupCommonMocks!
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Toggle Node", () => {
    setupCommonMocks();

    it("should toggle a single file node to wanted=false", async () => {
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.fileTree.length).toBeGreaterThan(0));

        const node = findNodeByPath(result.current.fileTree, "file1.txt");
        expect(node).not.toBeNull();
        if (!node) return;

        const ids = [0];

        await act(async () => {
            await result.current.toggleNode(node, false);
        });

        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, ids, false);

        await waitFor(() => {
            const updated = findNodeByPath(result.current.fileTree, "file1.txt");
            expect(updated?.Wanted).toBe(false);
            expect(result.current.error).toBeNull();
            expect(result.current.allChecked).toBe(false);
            expect(result.current.indeterminate).toBe(true);
        });
    });

    it("should toggle a directory node to wanted=true", async () => {
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.fileTree.length).toBeGreaterThan(0));

        const node = findNodeByPath(result.current.fileTree, "folder");
        expect(node).not.toBeNull();
        if (!node) return;

        const ids = [1, 2];

        await act(async () => {
            await result.current.toggleNode(node, true);
        });

        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, ids, true);

        await waitFor(() => {
            const updatedFolder = findNodeByPath(result.current.fileTree, "folder");
            const updatedFile1 = findNodeByPath(result.current.fileTree, "file1.txt");
            const updatedFile2 = findNodeByPath(result.current.fileTree, "folder/file2.iso");
            const updatedFile3 = findNodeByPath(result.current.fileTree, "folder/subfolder/file3.mkv");

            expect(updatedFolder?.Wanted).toBe(true);
            expect(updatedFolder?.indeterminate).toBe(false);
            expect(updatedFile2?.Wanted).toBe(true);
            expect(updatedFile3?.Wanted).toBe(true);
            expect(updatedFile1?.Wanted).toBe(true);

            expect(result.current.allChecked).toBe(true);
            expect(result.current.indeterminate).toBe(false);
            expect(result.current.error).toBeNull();
        });
    });

    it("should handle error during toggleNode", async () => {
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));
        mockSetFilesWanted.mockRejectedValueOnce(new Error("Failed"));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.fileTree.length).toBeGreaterThan(0));

        const node = findNodeByPath(result.current.fileTree, "file1.txt");
        expect(node).not.toBeNull();
        if (!node) return;

        const ids = [0];

        const initialTree = JSON.parse(JSON.stringify(result.current.fileTree));

        await act(async () => {
            await result.current.toggleNode(node, false);
        });

        expect(mockSetFilesWanted).toHaveBeenCalledWith(torrentId, ids, false);
        expect(result.current.error).toBe("errors.failedToUpdateFile:Error: Failed");
        expect(result.current.fileTree).toEqual(initialTree);
        expect(result.current.allChecked).toBe(false);
        expect(result.current.indeterminate).toBe(true);
    });
});