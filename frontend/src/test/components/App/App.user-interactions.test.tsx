import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../../../App";
import { useFilteredTorrents } from "../../../components/TorrentList/hooks/useFilteredTorrents";
import { StatusType } from "@utils/torrentStatus"; // Импортируем StatusType

// Мокируем хуки
vi.mock("../../../components/TorrentList/hooks/useFilteredTorrents", () => ({
  useFilteredTorrents: vi.fn(() => ({
    searchTerm: "",
    setSearchTerm: vi.fn(),
    statusFilter: "all",
    setStatusFilter: vi.fn(),
    filteredTorrents: [
      {
        ID: 1,
        Name: "Test Torrent 1",
        Status: "stopped" as StatusType, // <-- Приводим к StatusType
        Progress: 50,
        SizeFormatted: "100 MB",
        UploadRatio: 1.5,
        SeedsConnected: 10,
        SeedsTotal: 20,
        PeersConnected: 5,
        PeersTotal: 10,
        UploadedFormatted: "50 MB",
        DownloadSpeedFormatted: "1 MB/s",
        UploadSpeedFormatted: "500 KB/s",
        IsSlowMode: false,
      },
    ],
  })),
}));

// Мокируем компоненты, которые не тестируются в этом файле
vi.mock("../../../components/Header", () => ({
  Header: ({ searchTerm, setSearchTerm }: any) => (
    <div data-testid="header-component">
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  ),
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: ({ torrents }: any) => (
    <div data-testid="torrent-list-component">
      {torrents.map((torrent: any) => (
        <div key={torrent.ID} data-testid={`torrent-${torrent.ID}`}>
          {torrent.Name}
        </div>
      ))}
      TorrentList Mocked
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

describe("App - Пользовательские взаимодействия", () => {
  const mockSetSearchTerm = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Настройка базовых моков для хуков
    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "",
      setSearchTerm: mockSetSearchTerm,
      statusFilter: null,
      setStatusFilter: vi.fn(),
      filteredTorrents: [
        {
          ID: 1,
          Name: "Test Torrent",
          Status: "stopped" as StatusType, // <-- Исправляем тип
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
      ],
    });
  });

  it("обновляет поисковый запрос при вводе текста", () => {
    render(<App />);

    // Имитируем ввод текста в поле поиска
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "test search" } });

    // Проверяем, что setSearchTerm был вызван с правильным значением
    expect(mockSetSearchTerm).toHaveBeenCalledWith("test search");
  });

  it("рендерит список торрентов после фильтрации", () => {
    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "test",
      setSearchTerm: mockSetSearchTerm,
      statusFilter: null,
      setStatusFilter: vi.fn(),
      filteredTorrents: [
        {
          ID: 1,
          Name: "Test Torrent",
          Status: "stopped" as StatusType, // <-- Исправляем тип
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
      ],
    });

    render(<App />);

    // Проверяем, что отфильтрованный торрент отображается
    expect(screen.getByText("Test Torrent")).toBeInTheDocument();
  });
});
