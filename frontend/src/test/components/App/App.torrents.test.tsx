import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../../App";
import { useTorrentData } from "../../../hooks/useTorrentData";
import { useFilteredTorrents } from "../../../hooks/useFilteredTorrents";

// Мокируем хуки
vi.mock("../../../hooks/useTorrentData");
vi.mock("../../../hooks/useFilteredTorrents");

// Мокируем компоненты, которые не тестируются в этом файле
vi.mock("../../../components/Header", () => ({
  Header: () => <div data-testid="header-component">Header Mocked</div>,
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: ({ torrents, onSelect }: any) => (
    <div data-testid="torrent-list-component">
      {torrents.map((torrent: any) => (
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

describe("App - Взаимодействие с торрентами", () => {
  const mockHandleTorrentSelect = vi.fn();
  const mockRefreshTorrents = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Настройка базовых моков для хуков
    vi.mocked(useTorrentData).mockReturnValue({
      torrents: [
        {
          ID: 1,
          Name: "Torrent 1",
          Status: "0",
          Progress: 0,
          Size: 0,
          SizeFormatted: "0 B",
          UploadRatio: 0,
          SeedsConnected: 0,
          SeedsTotal: 0,
          PeersConnected: 0,
          PeersTotal: 0,
          DownloadSpeed: 0,
          DownloadSpeedFormatted: "0 B/s",
          UploadSpeed: 0,
          UploadSpeedFormatted: "0 B/s",
          UploadedBytes: 0,
          UploadedFormatted: "0 B",
          IsSlowMode: false,
        },
        {
          ID: 2,
          Name: "Torrent 2",
          Status: "0",
          Progress: 0,
          Size: 0,
          SizeFormatted: "0 B",
          UploadRatio: 0,
          SeedsConnected: 0,
          SeedsTotal: 0,
          PeersConnected: 0,
          PeersTotal: 0,
          DownloadSpeed: 0,
          DownloadSpeedFormatted: "0 B/s",
          UploadSpeed: 0,
          UploadSpeedFormatted: "0 B/s",
          UploadedBytes: 0,
          UploadedFormatted: "0 B",
          IsSlowMode: true,
        },
      ],
      selectedTorrents: new Set(),
      isInitialized: true,
      error: null,
      hasSelectedTorrents: false,
      sessionStats: null,
      isLoading: false,
      isReconnecting: false,
      handleTorrentSelect: mockHandleTorrentSelect,
      handleSelectAll: vi.fn(),
      refreshTorrents: mockRefreshTorrents,
      handleAddTorrent: vi.fn(),
      handleAddTorrentFile: vi.fn(),
      handleRemoveTorrent: vi.fn(),
      handleStartTorrent: vi.fn(),
      handleStopTorrent: vi.fn(),
      handleVerifyTorrent: vi.fn(),
      handleSettingsSave: vi.fn(),
      handleSetSpeedLimit: vi.fn(),
      config: null,
    });

    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "",
      setSearchTerm: vi.fn(),
      statusFilter: "all",
      setStatusFilter: vi.fn(),
      filteredTorrents: [
        {
          ID: 1,
          Name: "Torrent 1",
          Status: "0",
          Progress: 0,
          Size: 0,
          SizeFormatted: "0 B",
          UploadRatio: 0,
          SeedsConnected: 0,
          SeedsTotal: 0,
          PeersConnected: 0,
          PeersTotal: 0,
          DownloadSpeed: 0,
          DownloadSpeedFormatted: "0 B/s",
          UploadSpeed: 0,
          UploadSpeedFormatted: "0 B/s",
          UploadedBytes: 0,
          UploadedFormatted: "0 B",
          IsSlowMode: false,
        },
        {
          ID: 2,
          Name: "Torrent 2",
          Status: "0",
          Progress: 0,
          Size: 0,
          SizeFormatted: "0 B",
          UploadRatio: 0,
          SeedsConnected: 0,
          SeedsTotal: 0,
          PeersConnected: 0,
          PeersTotal: 0,
          DownloadSpeed: 0,
          DownloadSpeedFormatted: "0 B/s",
          UploadSpeed: 0,
          UploadSpeedFormatted: "0 B/s",
          UploadedBytes: 0,
          UploadedFormatted: "0 B",
          IsSlowMode: true,
        },
      ],
    });
  });

  it("рендерит список торрентов", () => {
    render(<App />);

    // Проверяем, что торренты отображаются
    expect(screen.getByTestId("torrent-1")).toBeInTheDocument();
    expect(screen.getByTestId("torrent-2")).toBeInTheDocument();
  });

  it("вызывает handleTorrentSelect при выборе торрента", () => {
    render(<App />);

    // Имитируем выбор торрента
    const torrent1 = screen.getByTestId("torrent-1");
    fireEvent.click(torrent1);

    // Проверяем, что handleTorrentSelect был вызван с правильным ID
    expect(mockHandleTorrentSelect).toHaveBeenCalledWith(1);
  });

  it("обновляет список торрентов при вызове refreshTorrents", () => {
    render(<App />);

    // Проверяем, что refreshTorrents был вызван при монтировании
    expect(mockRefreshTorrents).toHaveBeenCalledTimes(1);
  });
});
