import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilteredTorrents } from "./useFilteredTorrents";
import { TorrentData } from "../types";
import { StatusType } from "@utils/torrentStatus";

// Mock torrent data
const mockTorrents: TorrentData[] = [
    {
        ID: 1,
        Name: "Ubuntu ISO",
        Status: "downloading",
        IsSlowMode: false,
        Size: 1000,
        UploadedBytes: 500,
        Progress: 0.5,
        DownloadSpeed: 100,
        UploadSpeed: 10,
        PeersConnected: 5,
        UploadRatio: 0.1,
        SizeFormatted: "1.0 kB",
        SeedsConnected: 2,
        SeedsTotal: 10,
        PeersTotal: 5,
        UploadedFormatted: "500 B",
        DownloadSpeedFormatted: "100 B/s",
        UploadSpeedFormatted: "10 B/s",
    },
    {
        ID: 2,
        Name: "Debian Netinstall",
        Status: "seeding",
        IsSlowMode: false,
        Size: 200,
        UploadedBytes: 200,
        Progress: 1,
        DownloadSpeed: 0,
        UploadSpeed: 50,
        PeersConnected: 10,
        UploadRatio: 2.5,
        SizeFormatted: "200 B",
        SeedsConnected: 8,
        SeedsTotal: 15,
        PeersTotal: 10,
        UploadedFormatted: "200 B",
        DownloadSpeedFormatted: "0 B/s",
        UploadSpeedFormatted: "50 B/s",
    },
    {
        ID: 3,
        Name: "Arch Linux",
        Status: "stopped",
        IsSlowMode: false,
        Size: 800,
        UploadedBytes: 100,
        Progress: 0.125,
        DownloadSpeed: 0,
        UploadSpeed: 0,
        PeersConnected: 0,
        UploadRatio: 0,
        SizeFormatted: "800 B",
        SeedsConnected: 0,
        SeedsTotal: 5,
        PeersTotal: 0,
        UploadedFormatted: "100 B",
        DownloadSpeedFormatted: "0 B/s",
        UploadSpeedFormatted: "0 B/s",
    },
    {
        ID: 4,
        Name: "Fedora Workstation",
        Status: "queuedDownload",
        IsSlowMode: false,
        Size: 1500,
        UploadedBytes: 0,
        Progress: 0,
        DownloadSpeed: 0,
        UploadSpeed: 0,
        PeersConnected: 0,
        UploadRatio: 0,
        SizeFormatted: "1.5 kB",
        SeedsConnected: 0,
        SeedsTotal: 20,
        PeersTotal: 0,
        UploadedFormatted: "0 B",
        DownloadSpeedFormatted: "0 B/s",
        UploadSpeedFormatted: "0 B/s",
    },
    {
        ID: 5,
        Name: "Slow Download",
        Status: "downloading",
        IsSlowMode: true,
        Size: 500,
        UploadedBytes: 50,
        Progress: 0.1,
        DownloadSpeed: 5,
        UploadSpeed: 1,
        PeersConnected: 2,
        UploadRatio: 0.02,
        SizeFormatted: "500 B",
        SeedsConnected: 1,
        SeedsTotal: 3,
        PeersTotal: 2,
        UploadedFormatted: "50 B",
        DownloadSpeedFormatted: "5 B/s",
        UploadSpeedFormatted: "1 B/s",
    },
];

describe("useFilteredTorrents Hook", () => {
    it("should initialize with empty search term and null status filter", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        expect(result.current.searchTerm).toBe("");
        expect(result.current.statusFilter).toBeNull();
        expect(result.current.filteredTorrents).toEqual(mockTorrents);
    });

    it("should update search term", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setSearchTerm("ubuntu");
        });
        expect(result.current.searchTerm).toBe("ubuntu");
    });

    it("should update status filter", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setStatusFilter("seeding");
        });
        expect(result.current.statusFilter).toBe("seeding");
    });

    it("should filter torrents by search term (case-insensitive)", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setSearchTerm("linux");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);
        expect(result.current.filteredTorrents[0].Name).toBe("Arch Linux");
    });

    it("should filter torrents by status", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setStatusFilter("stopped");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);
        expect(result.current.filteredTorrents[0].Status).toBe("stopped");
    });

    it("should filter torrents by 'queued' status (including variations)", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setStatusFilter("queued");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);
        expect(result.current.filteredTorrents[0].Name).toBe("Fedora Workstation");
        expect(
            ["queued", "queuedCheck", "queuedDownload"].includes(
                result.current.filteredTorrents[0].Status
            )
        ).toBe(true);
    });

    it("should filter torrents by 'slow' status", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setStatusFilter("slow");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);
        expect(result.current.filteredTorrents[0].Name).toBe("Slow Download");
        expect(result.current.filteredTorrents[0].IsSlowMode).toBe(true);
    });

    it("should filter torrents by both search term and status", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setSearchTerm("dEbIaN");
            result.current.setStatusFilter("seeding");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);
        expect(result.current.filteredTorrents[0].Name).toBe("Debian Netinstall");
        expect(result.current.filteredTorrents[0].Status).toBe("seeding");
    });

    it("should return all torrents if search term and status filter are reset", () => {
        const { result } = renderHook(() => useFilteredTorrents(mockTorrents));
        act(() => {
            result.current.setSearchTerm("ubuntu");
            result.current.setStatusFilter("downloading");
        });
        expect(result.current.filteredTorrents).toHaveLength(1);

        act(() => {
            result.current.setSearchTerm("");
            result.current.setStatusFilter(null);
        });
                expect(result.current.filteredTorrents).toHaveLength(mockTorrents.length);
            });
        });