import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../../App";
// Импортируем новые хуки
import {
  useConnectionManager,
  useTorrentList,
  useSessionStats,
  useTorrentSelection,
  useTorrentActions,
  useConfigManager,
} from "@/hooks/torrent";
import { useBulkOperations, useModals } from "@/hooks";
import { useFilteredTorrents } from "../../../components/TorrentList/hooks/useFilteredTorrents";

// Мокируем новые хуки из @hooks/torrent
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
// Мокируем остальные хуки
vi.mock("@/hooks/useModals");
vi.mock("@/hooks/useBulkOperations");
vi.mock("@/components/TorrentList/hooks/useFilteredTorrents");

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

vi.mock("../../../components/Settings/Settings", () => ({
  Settings: () => <div data-testid="settings-modal">Settings Mocked</div>,
}));

vi.mock("../../../components/AddTorrent", () => ({
  AddTorrent: () => (
    <div data-testid="add-torrent-modal">AddTorrent Mocked</div>
  ),
}));

// Мокируем CSS модули
vi.mock("../../../styles/App.module.css", () => ({
  default: {
    content: "content-mock",
    scrollableContent: "scrollableContent-mock",
  },
}));

describe("App - Рендеринг компонента", () => {
  beforeEach(() => {
    // Настройка базовых моков для новых хуков
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
      torrents: [],
      isLoading: false,
      error: null,
      refreshTorrents: vi.fn(),
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
      handleTorrentSelect: vi.fn(),
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

    // Моки для остальных хуков
    const currentModalsMock =
      vi.mocked(useModals).mock.results[0]?.value ?? {
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
      };
    vi.mocked(useModals).mockReturnValue({
      ...currentModalsMock,
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
      error: null,
      handleStartSelected: vi.fn(),
      handleStopSelected: vi.fn(),
      handleRemoveSelected: vi.fn(),
      handleSetSpeedLimit: vi.fn(),
    });
  });

  it("рендерит основные компоненты интерфейса", () => {
    render(<App />);

    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("drag-drop-provider")).toBeInTheDocument();
    expect(screen.getByTestId("header-component")).toBeInTheDocument();
    // ConnectionStatus рендерится условно, проверяем его отсутствие по умолчанию
    expect(screen.queryByTestId("connection-status-component")).not.toBeInTheDocument();
    expect(screen.getByTestId("torrent-list-component")).toBeInTheDocument();
    expect(screen.getByTestId("footer-component")).toBeInTheDocument();
  });

  it("отображает ConnectionStatus при isReconnecting", () => {
    const currentConnectionMock =
      vi.mocked(useConnectionManager).mock.results[0]?.value ?? {
        isInitialized: true,
        isLoading: false,
        isReconnecting: false,
        error: null,
        initialConfig: null,
        connect: vi.fn(),
        reconnect: vi.fn(),
        setConnectionError: vi.fn(),
        setIsReconnectingState: vi.fn(),
      };
    vi.mocked(useConnectionManager).mockReturnValue({
      ...currentConnectionMock,
      isReconnecting: true,
    });
    render(<App />);
    expect(screen.getByTestId("connection-status-component")).toBeInTheDocument();
  });

  it("отображает ConnectionStatus при appError", () => {
    // Мокируем ошибку, например, из useTorrentList
    // Получаем предыдущее значение мока и переопределяем только error
    const currentTorrentListMock = vi.mocked(useTorrentList).mock.results[0]?.value ?? { torrents: [], isLoading: false, error: null, refreshTorrents: vi.fn() };
    vi.mocked(useTorrentList).mockReturnValue({
      ...currentTorrentListMock,
      error: "errors.timeoutExplanation",
    });
    render(<App />);
    // Ожидаем, что ConnectionStatus будет отрендерен из-за ошибки
    expect(screen.getByTestId("connection-status-component")).toBeInTheDocument();
  });

  it("не отображает модальные окна при начальной загрузке", () => {
    render(<App />);
    expect(screen.queryByTestId("settings-modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-torrent-modal")).not.toBeInTheDocument();
  });

  it("отображает окно настроек, когда showSettings = true", () => {
    const currentModalsMock =
      vi.mocked(useModals).mock.results[0]?.value ?? {
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
      };
    vi.mocked(useModals).mockReturnValue({
      ...currentModalsMock,
      showSettings: true,
    });
    render(<App />);
    expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
  });

  it("отображает окно добавления торрента, когда showAddTorrent = true", () => {
    const currentModalsMock =
      vi.mocked(useModals).mock.results[0]?.value ?? {
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
      };
    vi.mocked(useModals).mockReturnValue({
      ...currentModalsMock,
      showAddTorrent: true,
    });
    render(<App />);
    expect(screen.getByTestId("add-torrent-modal")).toBeInTheDocument();
  });

  it("корректно передает данные сессии в Footer", () => {
    // Мокируем useSessionStats с непустым sessionStats
    const currentSessionStatsMock =
      vi.mocked(useSessionStats).mock.results[0]?.value ?? {
        sessionStats: null,
        error: null,
        refreshSessionStats: vi.fn(),
      };
    vi.mocked(useSessionStats).mockReturnValue({
      ...currentSessionStatsMock,
      sessionStats: {
        TotalDownloadSpeed: 1024,
        TotalUploadSpeed: 2048,
        FreeSpace: 1073741824,
        TransmissionVersion: "3.0.0",
      },
      error: null,
    });

    render(<App />);
    const footer = screen.getByTestId("footer-component");
    expect(footer).toHaveAttribute("data-download-speed", "1024");
    expect(footer).toHaveAttribute("data-upload-speed", "2048");
    expect(footer).toHaveAttribute("data-free-space", "1073741824");
    expect(footer).toHaveAttribute("data-version", "3.0.0");
  });
});
