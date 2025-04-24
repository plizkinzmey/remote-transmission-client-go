import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

vi.mock("../../../components/Header", () => ({
  Header: ({ isSlowModeEnabled }: any) => (
    <div data-testid="header-component" data-slow-mode={isSlowModeEnabled}>
      Header Mocked
    </div>
  ),
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: ({ torrents, onSelect }: { torrents: ProcessedTorrentData[], onSelect: (id: number) => void }) => (
    <div data-testid="torrent-list-component">
      {torrents.map((torrent: ProcessedTorrentData) => (
        <div
          key={torrent.ID}
          data-testid={`torrent-${torrent.ID}`}
          onClick={() => onSelect(torrent.ID)}
        >
          {torrent.Name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer-component">Footer Mocked</div>,
}));

vi.mock("../../../components/ConnectionStatus", () => ({
  ConnectionStatus: () => (
    <div data-testid="connection-status-component">ConnectionStatus Mocked</div>
  ),
}));

vi.mock("../../../styles/App.module.css", () => ({
  default: {
    content: "content-mock",
    scrollableContent: "scrollableContent-mock",
  },
}));

const createMockWailsTorrent = (
  id: number,
  name: string,
  isSlowMode = false
): WailsTorrent => ({
  ID: id,
  Name: name,
  Status: "stopped",
  Progress: 0,
  Size: 0,
  SizeFormatted: "0 B",
  UploadRatio: 0,
  SeedsConnected: 0,
  SeedsTotal: 0,
  PeersConnected: 0,
  PeersTotal: 0,
  UploadedBytes: 0,
  UploadedFormatted: "0 B",
  DownloadSpeed: 0,
  UploadSpeed: 0,
  DownloadSpeedFormatted: "0 B/s",
  UploadSpeedFormatted: "0 B/s",
  IsSlowMode: isSlowMode,
});

const createMockProcessedTorrentData = (
  id: number,
  name: string,
  isSlowMode = false
): ProcessedTorrentData => ({
  ID: id,
  Name: name,
  Status: "stopped",
  Progress: 0,
  Size: 0,
  SizeFormatted: "0 B",
  UploadRatio: 0,
  SeedsConnected: 0,
  SeedsTotal: 0,
  PeersConnected: 0,
  PeersTotal: 0,
  UploadedBytes: 0,
  UploadedFormatted: "0 B",
  DownloadSpeed: 0,
  UploadSpeed: 0,
  DownloadSpeedFormatted: "0 B/s",
  UploadSpeedFormatted: "0 B/s",
  IsSlowMode: isSlowMode,
});

describe("App - Взаимодействие с торрентами", () => {
  const mockHandleTorrentSelect = vi.fn();
  const mockRefreshTorrents = vi.fn();

  const mockRawTorrents: WailsTorrent[] = [
    createMockWailsTorrent(1, "Torrent 1", false),
    createMockWailsTorrent(2, "Torrent 2", true),
  ];

  const mockProcessedTorrents: ProcessedTorrentData[] = [
    createMockProcessedTorrentData(1, "Torrent 1", false),
    createMockProcessedTorrentData(2, "Torrent 2", true),
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(useConnectionManager).mockReturnValue({
      isInitialized: true,
      isLoading: false,
      isReconnecting: false,
      error: null,
      initialConfig: null,
      connect: vi.fn(),
      reconnect: vi.fn(),
      setConnectionError: vi.fn(),
      setIsReconnectingState: vi.fn(),
    });

    vi.mocked(useTorrentList).mockReturnValue({
      torrents: mockRawTorrents,
      isLoading: false,
      error: null,
      refreshTorrents: mockRefreshTorrents,
    });

    vi.mocked(useSessionStats).mockReturnValue({
      sessionStats: {
        TotalDownloadSpeed: 0,
        TotalUploadSpeed: 0,
        FreeSpace: 0,
        TransmissionVersion: "",
      },
      error: null,
      refreshSessionStats: vi.fn(),
    });

    vi.mocked(useTorrentSelection).mockReturnValue({
      selectedTorrents: new Set(),
      hasSelectedTorrents: false,
      handleTorrentSelect: mockHandleTorrentSelect,
      handleSelectAll: vi.fn(),
      clearSelection: vi.fn(),
    });

    vi.mocked(useTorrentActions).mockReturnValue({
      addTorrent: vi.fn(),
      addTorrentFile: vi.fn(),
      removeTorrent: vi.fn(),
      startTorrents: vi.fn(),
      stopTorrents: vi.fn(),
      setSpeedLimit: vi.fn(),
      verifyTorrent: vi.fn(),
    });

    vi.mocked(useConfigManager).mockReturnValue({
      config: null,
      isSettingsSaving: false,
      error: null,
      handleSettingsSave: vi.fn(),
      setConfig: vi.fn(),
    });

    vi.mocked(useModals).mockReturnValue({
      showSettings: false,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: false,
      torrentFileData: null,
      checkFirstStart: vi.fn(),
      handleSuccessfulSettingsSave: vi.fn(),
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
      openAddTorrent: vi.fn(),
      closeAddTorrent: vi.fn(),
      handleTorrentFileDrop: vi.fn(),
    });

    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "",
      setSearchTerm: vi.fn(),
      statusFilter: null,
      setStatusFilter: vi.fn(),
      filteredTorrents: mockProcessedTorrents,
    });

    vi.mocked(useBulkOperations).mockReturnValue({
      bulkOperations: {
        start: false,
        stop: false,
        remove: false,
        speedLimit: false,
      },
      error: null,
      handleStartSelected: vi.fn(),
      handleStopSelected: vi.fn(),
      handleRemoveSelected: vi.fn(),
      handleSetSpeedLimit: vi.fn(),
    });
  });

  it("рендерит список торрентов", () => {
    render(<App />);
    expect(screen.getByTestId("torrent-1")).toBeInTheDocument();
    expect(screen.getByTestId("torrent-2")).toBeInTheDocument();
  });

  it("вызывает handleTorrentSelect при выборе торрента", () => {
    render(<App />);
    const torrent1 = screen.getByTestId("torrent-1");
    fireEvent.click(torrent1);
    expect(mockHandleTorrentSelect).toHaveBeenCalledWith(1);
  });

  it("корректно определяет наличие замедленных торрентов среди выбранных", () => {
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set([2]),
    });

    render(<App />);
    const header = screen.getByTestId("header-component");
    expect(header).toHaveAttribute("data-slow-mode", "true");
  });

  it("корректно определяет отсутствие замедленных торрентов среди выбранных", () => {
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set([1]),
    });

    render(<App />);
    const header = screen.getByTestId("header-component");
    expect(header).toHaveAttribute("data-slow-mode", "false");
  });
});
