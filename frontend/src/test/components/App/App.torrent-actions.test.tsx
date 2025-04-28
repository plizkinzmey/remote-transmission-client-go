import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import App from "../../../App";
import { TorrentData as ProcessedTorrentData } from "../../../components/TorrentList";
import {
    useConnectionManager,
    useTorrentList,
    useSessionStats,
    useTorrentSelection,
    useTorrentActions,
    useConfigManager,
    WailsTorrent,
} from "@/hooks/torrent";
import { useBulkOperations, useModals } from "@/hooks";
import { useFilteredTorrents } from "../../../components/TorrentList/hooks/useFilteredTorrents";

// --- Mocks Setup ---
vi.mock("@/hooks/torrent", async () => {
    const actual = await vi.importActual("@/hooks/torrent");
    return {
        ...(actual as any),
        useConnectionManager: vi.fn(),
        useTorrentList: vi.fn(),
        useSessionStats: vi.fn(),
        useTorrentSelection: vi.fn(),
        useTorrentActions: vi.fn(),
        useConfigManager: vi.fn(),
    };
});
vi.mock("@/hooks/useModals");
vi.mock("@/hooks/useBulkOperations");
vi.mock("@/components/TorrentList/hooks/useFilteredTorrents");

// Define store for AddTorrent props
let mockAddTorrentPropsStore: { onAdd?: any; onAddFile?: any } = {};

vi.mock("../../../components/AddTorrent", () => ({
    AddTorrent: (props: any) => {
        // Store props in the accessible store
        mockAddTorrentPropsStore.onAdd = props.onAdd;
        mockAddTorrentPropsStore.onAddFile = props.onAddFile;
        return <div data-testid="add-torrent-modal">AddTorrent Mocked</div>;
    },
}));

vi.mock("../../../components/Header", () => ({
    Header: (props: any) => {
        (window as any).mockHeaderProps = props; // Keep for potential future tests if needed
        return <div data-testid="header-component">Header Mocked</div>;
    },
}));
vi.mock("../../../components/TorrentList", () => ({
    TorrentList: (props: any) => {
        (window as any).mockTorrentListProps = props;
        return <div data-testid="torrent-list-component">TorrentList Mocked</div>;
    },
}));
vi.mock("../../../components/Footer", () => ({
    Footer: () => <div data-testid="footer-component">Footer Mocked</div>,
}));
vi.mock("../../../components/ConnectionStatus", () => ({
    ConnectionStatus: () => <div data-testid="connection-status-component">ConnectionStatus Mocked</div>,
}));
vi.mock("../../../styles/App.module.css", () => ({
    default: { content: "content-mock", scrollableContent: "scrollableContent-mock" },
}));
vi.mock("@wailsjs/go/main/App", async () => {
    const actual = await vi.importActual("@wailsjs/go/main/App");
    return {
        ...(actual as any),
        AddTorrent: vi.fn(), AddTorrentFile: vi.fn(), Connect: vi.fn(), DeleteDownloadPath: vi.fn(),
        GetConfig: vi.fn(), GetDownloadPaths: vi.fn().mockResolvedValue(["/default/path"]), GetSessionStats: vi.fn(),
        GetTorrents: vi.fn(), RemoveTorrent: vi.fn(), SaveConfig: vi.fn(), SetSpeedLimit: vi.fn(),
        StartTorrents: vi.fn(), StopTorrents: vi.fn(), ValidateDownloadPath: vi.fn().mockResolvedValue(true),
        VerifyTorrent: vi.fn(),
    };
});
vi.mock("../../../contexts/ThemeContext", () => ({ // Added ThemeProvider mock
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="theme-provider">{children}</div>
    ),
}));
vi.mock("../../../components/DragDropProvider", () => ({ // Added DragDropProvider mock
    DragDropProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="drag-drop-provider">{children}</div>
    ),
}));
// --- Mock Data ---
const createMockWailsTorrent = (id: number, name: string, isSlowMode = false): WailsTorrent => ({
    ID: id, Name: name, Status: "stopped", Progress: 0, Size: 0, SizeFormatted: "0 B", UploadRatio: 0,
    SeedsConnected: 0, SeedsTotal: 0, PeersConnected: 0, PeersTotal: 0, UploadedBytes: 0, UploadedFormatted: "0 B",
    DownloadSpeed: 0, UploadSpeed: 0, DownloadSpeedFormatted: "0 B/s", UploadSpeedFormatted: "0 B/s", IsSlowMode: isSlowMode,
});
const createMockProcessedTorrentData = (id: number, name: string, isSlowMode = false): ProcessedTorrentData => ({
    ID: id, Name: name, Status: "stopped", Progress: 0, Size: 0, SizeFormatted: "0 B", UploadRatio: 0,
    SeedsConnected: 0, SeedsTotal: 0, PeersConnected: 0, PeersTotal: 0, UploadedBytes: 0, UploadedFormatted: "0 B",
    DownloadSpeed: 0, UploadSpeed: 0, DownloadSpeedFormatted: "0 B/s", UploadSpeedFormatted: "0 B/s", IsSlowMode: isSlowMode,
});
const mockRawTorrents: WailsTorrent[] = [createMockWailsTorrent(1, "Torrent 1"), createMockWailsTorrent(2, "Torrent 2", true)];
const mockProcessedTorrents: ProcessedTorrentData[] = [createMockProcessedTorrentData(1, "Torrent 1"), createMockProcessedTorrentData(2, "Torrent 2", true)];

// --- Test Suite ---
describe("App - Torrent Actions Adapters", () => {
    const mockRemoveTorrent = vi.fn();
    const mockStartTorrents = vi.fn();
    const mockStopTorrents = vi.fn();
    const mockVerifyTorrent = vi.fn();
    const mockAddTorrent = vi.fn();
    const mockCloseAddTorrent = vi.fn();
    const mockAddTorrentFile = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        // Reset the props store before each test
        mockAddTorrentPropsStore = {};

        // Common hook setup for these tests
        vi.mocked(useConnectionManager).mockReturnValue({
            isInitialized: true, isLoading: false, isReconnecting: false, error: null, initialConfig: null,
            connect: vi.fn(), reconnect: vi.fn(), setConnectionError: vi.fn(), setIsReconnectingState: vi.fn(),
        });
        vi.mocked(useTorrentList).mockReturnValue({
            torrents: mockRawTorrents, isLoading: false, error: null, refreshTorrents: vi.fn(),
        });
        vi.mocked(useSessionStats).mockReturnValue({
            sessionStats: { TotalDownloadSpeed: 0, TotalUploadSpeed: 0, FreeSpace: 0, TransmissionVersion: "" },
            error: null, refreshSessionStats: vi.fn(),
        });
        vi.mocked(useTorrentSelection).mockReturnValue({
            selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(),
            handleSelectAll: vi.fn(), clearSelection: vi.fn(),
        });
        vi.mocked(useTorrentActions).mockReturnValue({
            addTorrent: mockAddTorrent, addTorrentFile: mockAddTorrentFile, removeTorrent: mockRemoveTorrent,
            startTorrents: mockStartTorrents, stopTorrents: mockStopTorrents, setSpeedLimit: vi.fn(),
            verifyTorrent: mockVerifyTorrent,
        });
        vi.mocked(useConfigManager).mockReturnValue({
            config: null, isSettingsSaving: false, error: null, handleSettingsSave: vi.fn(), setConfig: vi.fn(),
        });
        vi.mocked(useModals).mockReturnValue({ // Need this for add torrent tests
            showSettings: false, showAddTorrent: true, torrentFilePath: null, isFirstStart: false, torrentFileData: null,
            checkFirstStart: vi.fn(), handleSuccessfulSettingsSave: vi.fn(), openSettings: vi.fn(), closeSettings: vi.fn(),
            openAddTorrent: vi.fn(), closeAddTorrent: mockCloseAddTorrent, handleTorrentFileDrop: vi.fn(),
        });
        vi.mocked(useFilteredTorrents).mockReturnValue({
            searchTerm: "", setSearchTerm: vi.fn(), statusFilter: null, setStatusFilter: vi.fn(),
            filteredTorrents: mockProcessedTorrents,
        });
        vi.mocked(useBulkOperations).mockReturnValue({ // Keep basic mock
            bulkOperations: { start: false, stop: false, remove: false, speedLimit: false }, error: null,
            handleStartSelected: vi.fn(), handleStopSelected: vi.fn(), handleRemoveSelected: vi.fn(), handleSetSpeedLimit: vi.fn(),
        });
    });

    it("calls removeTorrent when handleRemoveTorrentAdapter is called", () => {
        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;
        torrentListProps.onRemove(1, true);
        expect(mockRemoveTorrent).toHaveBeenCalledWith(1, true);
    });

    it("calls startTorrents when handleStartTorrentAdapter is called", () => {
        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;
        torrentListProps.onStart(1);
        expect(mockStartTorrents).toHaveBeenCalledWith([1]);
    });

    it("calls stopTorrents when handleStopTorrentAdapter is called", () => {
        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;
        torrentListProps.onStop(1);
        expect(mockStopTorrents).toHaveBeenCalledWith([1]);
    });

    it("calls verifyTorrent when handleVerifyTorrentAdapter is called", () => {
        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;
        torrentListProps.onVerify(1);
        expect(mockVerifyTorrent).toHaveBeenCalledWith(1);
    });

    it("closes add torrent modal on successful torrent add (URL)", async () => {
        mockAddTorrent.mockResolvedValue(true);
        render(<App />); // Render App, which renders the mocked AddTorrent

        // Check if the callback was captured and call it
        if (mockAddTorrentPropsStore.onAdd) {
            await mockAddTorrentPropsStore.onAdd("magnet:test", "/download/dir");
            expect(mockAddTorrent).toHaveBeenCalledWith("magnet:test", "/download/dir");
            expect(mockCloseAddTorrent).toHaveBeenCalled();
        } else {
            throw new Error("onAdd callback not captured from AddTorrent mock");
        }
    });

    it("doesn't close add torrent modal on failed torrent add (URL)", async () => {
        mockAddTorrent.mockResolvedValue(false); // Simulate failure
        render(<App />); // Render App

        // Check if the callback was captured and call it
        if (mockAddTorrentPropsStore.onAdd) {
            await mockAddTorrentPropsStore.onAdd("magnet:fail", "/download/dir");
            expect(mockAddTorrent).toHaveBeenCalledWith("magnet:fail", "/download/dir");
            expect(mockCloseAddTorrent).not.toHaveBeenCalled();
        } else {
            throw new Error("onAdd callback not captured from AddTorrent mock");
        }
    });

    it("closes add torrent modal on successful torrent add (File)", async () => {
        mockAddTorrentFile.mockResolvedValue(true);
        render(<App />); // Render App

        // Check if the callback was captured and call it
        if (mockAddTorrentPropsStore.onAddFile) {
            await mockAddTorrentPropsStore.onAddFile("base64data", "/download/dir");
            expect(mockAddTorrentFile).toHaveBeenCalledWith("base64data", "/download/dir");
            expect(mockCloseAddTorrent).toHaveBeenCalled();
        } else {
            throw new Error("onAddFile callback not captured from AddTorrent mock");
        }
    });

    it("doesn't close add torrent modal on failed torrent add (File)", async () => {
        mockAddTorrentFile.mockResolvedValue(false); // Simulate failure
        render(<App />); // Render App

        // Check if the callback was captured and call it
        if (mockAddTorrentPropsStore.onAddFile) {
            await mockAddTorrentPropsStore.onAddFile("base64data-fail", "/download/dir");
            expect(mockAddTorrentFile).toHaveBeenCalledWith("base64data-fail", "/download/dir");
            expect(mockCloseAddTorrent).not.toHaveBeenCalled();
        } else {
            throw new Error("onAddFile callback not captured from AddTorrent mock");
        }
    });

});

describe("App - Torrent Actions Callbacks", () => {
    const mockStartTorrents = vi.fn();
    const mockRefreshTorrents = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(useConnectionManager).mockReturnValue({
            isInitialized: true, isLoading: false, isReconnecting: false, error: null, initialConfig: null,
            connect: vi.fn(), reconnect: vi.fn(), setConnectionError: vi.fn(), setIsReconnectingState: vi.fn(),
        });

        vi.mocked(useTorrentList).mockReturnValue({
            torrents: mockRawTorrents,
            isLoading: false,
            error: null,
            refreshTorrents: mockRefreshTorrents,
        });

        vi.mocked(useSessionStats).mockReturnValue({
            sessionStats: { TotalDownloadSpeed: 0, TotalUploadSpeed: 0, FreeSpace: 0, TransmissionVersion: "" },
            error: null, refreshSessionStats: vi.fn(),
        });

        vi.mocked(useTorrentSelection).mockReturnValue({
            selectedTorrents: new Set(), hasSelectedTorrents: false,
            handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn(),
        });

        vi.mocked(useConfigManager).mockReturnValue({
            config: null, isSettingsSaving: false, error: null,
            handleSettingsSave: vi.fn(), setConfig: vi.fn(),
        });

        vi.mocked(useModals).mockReturnValue({
            showSettings: false, showAddTorrent: false, torrentFilePath: null,
            isFirstStart: false, torrentFileData: null, checkFirstStart: vi.fn(),
            handleSuccessfulSettingsSave: vi.fn(), openSettings: vi.fn(),
            closeSettings: vi.fn(), openAddTorrent: vi.fn(),
            closeAddTorrent: vi.fn(), handleTorrentFileDrop: vi.fn(),
        });

        vi.mocked(useFilteredTorrents).mockReturnValue({
            searchTerm: "", setSearchTerm: vi.fn(), statusFilter: null,
            setStatusFilter: vi.fn(), filteredTorrents: mockProcessedTorrents,
        });

        vi.mocked(useBulkOperations).mockReturnValue({
            bulkOperations: { start: false, stop: false, remove: false, speedLimit: false },
            error: null, handleStartSelected: vi.fn(), handleStopSelected: vi.fn(),
            handleRemoveSelected: vi.fn(), handleSetSpeedLimit: vi.fn(),
        });
    });

    it("вызывает onActionStart и onActionSuccess при успешном выполнении действия", async () => {
        // Мокируем успешный вызов API
        vi.mocked(useTorrentActions).mockImplementation(({ onActionStart, onActionSuccess }) => ({
            addTorrent: vi.fn(),
            addTorrentFile: vi.fn(),
            removeTorrent: vi.fn(),
            startTorrents: async (ids: number[]) => {
                onActionStart?.();
                await Promise.resolve();
                onActionSuccess?.();
            },
            stopTorrents: vi.fn(),
            setSpeedLimit: vi.fn(),
            verifyTorrent: vi.fn(),
        }));

        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;
        await torrentListProps.onStart(1);

        expect(mockRefreshTorrents).toHaveBeenCalled();
    });

    it("вызывает onActionStart без onActionSuccess при ошибке", async () => {
        // Мокируем неуспешный вызов API
        vi.mocked(useTorrentActions).mockImplementation(({ onActionStart }) => ({
            addTorrent: vi.fn(),
            addTorrentFile: vi.fn(),
            removeTorrent: vi.fn(),
            startTorrents: async (ids: number[]) => {
                onActionStart?.();
                throw new Error("Test error");
            },
            stopTorrents: vi.fn(),
            setSpeedLimit: vi.fn(),
            verifyTorrent: vi.fn(),
        }));

        render(<App />);
        const torrentListProps = (window as any).mockTorrentListProps;

        await expect(torrentListProps.onStart(1)).rejects.toThrow("Test error");
        expect(mockRefreshTorrents).not.toHaveBeenCalled();
    });
});
