import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { domain } from "@wailsjs/go/models";
import { FileNode } from "types/FileTree";
import {
    setupCommonMocks,
    mockGetTorrentFiles,
    mockBuildFileTree,
    mockFileTreeInitial,
    torrentId,
    mockRawFiles,
} from "./useTorrentFiles.setup"; // Fix: Update import path

// Import the hook after setupCommonMocks
import { useTorrentFiles } from "../useTorrentFiles";

describe("useTorrentFiles Hook - Check State Updates", () => {
    setupCommonMocks();

    it("should update check state correctly when all files are wanted", async () => {
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
        mockBuildFileTree.mockImplementationOnce(() => allWantedTree);

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.allChecked).toBe(true);
        expect(result.current.indeterminate).toBe(false);
    });

    it("should update check state correctly when no files are wanted", async () => {
        const noneWantedRaw: domain.TorrentFile[] = mockRawFiles.map(f => ({ ...f, Wanted: false }));
        const noneWantedTree: FileNode[] = JSON.parse(JSON.stringify(mockFileTreeInitial));
        const setWantedFalse = (nodes: FileNode[]) => {
            nodes.forEach(node => {
                node.Wanted = false;
                node.indeterminate = false;
                if (node.children) setWantedFalse(node.children);
            });
        };
        setWantedFalse(noneWantedTree);

        mockGetTorrentFiles.mockResolvedValue(noneWantedRaw);
        mockBuildFileTree.mockImplementationOnce(() => noneWantedTree);

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.allChecked).toBe(false);
        expect(result.current.indeterminate).toBe(false);
    });

    it("should update check state correctly for indeterminate state", async () => {
        mockGetTorrentFiles.mockResolvedValue([...mockRawFiles]);
        mockBuildFileTree.mockImplementationOnce(() => JSON.parse(JSON.stringify(mockFileTreeInitial)));

        const { result } = renderHook(() => useTorrentFiles(torrentId));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.allChecked).toBe(false);
        expect(result.current.indeterminate).toBe(true);
    });
});