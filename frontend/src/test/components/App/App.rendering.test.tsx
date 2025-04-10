import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../../App";
import { useTorrentData } from "../../../hooks/useTorrentData";
import { useModals } from "../../../hooks/useModals";
import { useFilteredTorrents } from "../../../hooks/useFilteredTorrents";
import { useBulkOperations } from "../../../hooks/useBulkOperations";

// Мокаем все хуки, используемые в App
vi.mock("../../../hooks/useTorrentData");
vi.mock("../../../hooks/useModals");
vi.mock("../../../hooks/useFilteredTorrents");
vi.mock("../../../hooks/useBulkOperations");

// Мок для контекста темы
vi.mock("../../../contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

// Мокаем компоненты, используемые в App
vi.mock("../../../components/Header", () => ({
  Header: () => <div data-testid="header-component">Header Mocked</div>,
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: () => (
    <div data-testid="torrent-list-component">TorrentList Mocked</div>
  ),
}));

vi.mock("../../../components/Footer", () => ({
  Footer: ({
    totalDownloadSpeed,
    totalUploadSpeed,
    freeSpace,
    transmissionVersion,
  }: any) => (
    <div
      data-testid="footer-component"
      data-download-speed={totalDownloadSpeed}
      data-upload-speed={totalUploadSpeed}
      data-free-space={freeSpace}
      data-version={transmissionVersion}
    >
      Footer Mocked
    </div>
  ),
}));

vi.mock("../../../components/ConnectionStatus", () => ({
  ConnectionStatus: () => (
    <div data-testid="connection-status-component">ConnectionStatus Mocked</div>
  ),
}));

vi.mock("../../../components/DragDropProvider", () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-drop-provider">{children}</div>
  ),
}));

vi.mock("../../../components/settings/Settings", () => ({
  Settings: () => <div data-testid="settings-component">Settings Mocked</div>,
}));

vi.mock("../../../components/AddTorrent", () => ({
  AddTorrent: () => (
    <div data-testid="add-torrent-component">AddTorrent Mocked</div>
  ),
}));

// Мокируем CSS модули
vi.mock("../../../styles/App.module.css", () => ({
  default: {
    content: "content-mock",
    scrollableContent: "scrollableContent-mock",
  },
}));

// Создаем базовый объект торрента с полными данными
const createMockTorrent = (id: number, name: string, isSlowMode = false) => ({
  ID: id,
  Name: name,
  Status: 0,
  Progress: 0,
  Size: 0,
  SizeFormatted: "0 B",
  Downloaded: 0,
  DownloadedFormatted: "0 B",
  Uploaded: 0,
  UploadedFormatted: "0 B",
  DownloadSpeed: 0,
  DownloadSpeedFormatted: "0 B/s",
  UploadSpeed: 0,
  UploadSpeedFormatted: "0 B/s",
  RemainingTime: "Unknown",
  DateAdded: "2023-01-01",
  IsSlowMode: isSlowMode,
  AddedOnFormatted: "01.01.2023 00:00",
});

describe("App - Рендеринг компонента", () => {
  beforeEach(() => {
    // Настройка базовых моков для хуков
    vi.mocked(useTorrentData).mockReturnValue({
      torrents: [],
      selectedTorrents: new Set(),
      isInitialized: true,
      error: null,
      hasSelectedTorrents: false,
      sessionStats: null,
      isLoading: false,
      isReconnecting: false,
      handleTorrentSelect: vi.fn(),
      handleSelectAll: vi.fn(),
      refreshTorrents: vi.fn(),
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
      filteredTorrents: [],
    });

    vi.mocked(useBulkOperations).mockReturnValue({
      bulkOperations: {
        start: false,
        stop: false,
        remove: false,
        speedLimit: false,
      },
      error: null, // Добавляю обязательное поле error
      handleStartSelected: vi.fn(),
      handleStopSelected: vi.fn(),
      handleRemoveSelected: vi.fn(),
      handleSetSpeedLimit: vi.fn(),
    });
  });

  it("рендерит основные компоненты интерфейса", () => {
    render(<App />);

    // Проверяем наличие основных компонентов
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument();
    expect(screen.getByTestId("header-component")).toBeInTheDocument();
    expect(
      screen.getByTestId("connection-status-component")
    ).toBeInTheDocument();
    expect(screen.getByTestId("torrent-list-component")).toBeInTheDocument();
    expect(screen.getByTestId("footer-component")).toBeInTheDocument();
  });

  it("не отображает модальные окна при начальной загрузке", () => {
    render(<App />);

    // Проверяем, что модальные окна не отображаются по умолчанию
    expect(screen.queryByTestId("settings-component")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("add-torrent-component")
    ).not.toBeInTheDocument();
  });

  it("отображает окно настроек, когда showSettings = true", () => {
    vi.mocked(useModals).mockReturnValue({
      showSettings: true,
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

    render(<App />);

    // Проверяем, что окно настроек отображается
    expect(screen.getByTestId("settings-component")).toBeInTheDocument();
  });

  it("отображает окно добавления торрента, когда showAddTorrent = true", () => {
    vi.mocked(useModals).mockReturnValue({
      showSettings: false,
      showAddTorrent: true,
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

    render(<App />);

    // Проверяем, что окно добавления торрента отображается
    expect(screen.getByTestId("add-torrent-component")).toBeInTheDocument();
  });

  it("корректно передает данные сессии в Footer", () => {
    // Мокируем useTorrentData с непустым sessionStats
    vi.mocked(useTorrentData).mockReturnValue({
      ...vi.mocked(useTorrentData)(),
      sessionStats: {
        TotalDownloadSpeed: 1024,
        TotalUploadSpeed: 2048,
        FreeSpace: 1073741824,
        TransmissionVersion: "3.0.0",
      },
    });

    render(<App />);

    const footer = screen.getByTestId("footer-component");
    expect(footer).toHaveAttribute("data-download-speed", "1024");
    expect(footer).toHaveAttribute("data-upload-speed", "2048");
    expect(footer).toHaveAttribute("data-free-space", "1073741824");
    expect(footer).toHaveAttribute("data-version", "3.0.0");
  });
});
