import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import App from "../../../App";
import { TorrentData } from "../../../components/TorrentList";
import { useTorrentData } from "../../../hooks/useTorrentData";
import { useModals } from "../../../hooks/useModals";
import { useFilteredTorrents } from "../../../hooks/useFilteredTorrents";
import { useBulkOperations } from "../../../hooks/useBulkOperations";

// Мокируем хуки
vi.mock("../../../hooks/useTorrentData");
vi.mock("../../../hooks/useModals");
vi.mock("../../../hooks/useFilteredTorrents");
vi.mock("../../../hooks/useBulkOperations");

// Мокируем компоненты для упрощения тестов
vi.mock("../../../components/Header", () => ({
  Header: (props: any) => {
    // Сохраняем переданные функции для тестирования
    (window as any).mockHeaderProps = props;
    return <div data-testid="header-component">Header Mocked</div>;
  },
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: (props: any) => {
    // Сохраняем переданные функции для тестирования
    (window as any).mockTorrentListProps = props;
    return <div data-testid="torrent-list-component">TorrentList Mocked</div>;
  },
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer-component">Footer Mocked</div>,
}));

vi.mock("../../../components/ConnectionStatus", () => ({
  ConnectionStatus: () => (
    <div data-testid="connection-status-component">ConnectionStatus Mocked</div>
  ),
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("../../../components/DragDropProvider", () => ({
  DragDropProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-drop-provider">{children}</div>
  ),
}));

const createMockTorrentData = (
  id: number,
  name: string,
  isSlowMode = false
): TorrentData => ({
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

describe("App - Адаптеры и вспомогательные функции", () => {
  const mockHandleSelectAll = vi.fn();
  const mockHandleTorrentSpeedLimit = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Базовый набор торрентов для тестов
    const mockTorrents = [
      createMockTorrentData(1, "Torrent 1", false),
      createMockTorrentData(2, "Torrent 2", true),
      createMockTorrentData(3, "Torrent 3", false),
    ];

    // Настраиваем моки для хуков
    vi.mocked(useTorrentData).mockReturnValue({
      torrents: mockTorrents,
      selectedTorrents: new Set([1, 2]), // Выбраны первый и второй торренты
      isInitialized: true,
      error: null,
      hasSelectedTorrents: true,
      sessionStats: null,
      isLoading: false,
      isReconnecting: false,
      handleTorrentSelect: vi.fn(),
      handleSelectAll: mockHandleSelectAll,
      refreshTorrents: vi.fn(),
      handleAddTorrent: vi.fn(),
      handleAddTorrentFile: vi.fn(),
      handleRemoveTorrent: vi.fn(),
      handleStartTorrent: vi.fn(),
      handleStopTorrent: vi.fn(),
      handleVerifyTorrent: vi.fn(),
      handleSettingsSave: vi.fn(),
      handleSetSpeedLimit: mockHandleTorrentSpeedLimit,
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

    const filteredTorrents = [
      createMockTorrentData(1, "Filtered 1", false),
      createMockTorrentData(2, "Filtered 2", true),
    ];

    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "",
      setSearchTerm: vi.fn(),
      statusFilter: "all",
      setStatusFilter: vi.fn(),
      filteredTorrents,
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

  it("проверяет наличие замедленных торрентов среди выбранных", () => {
    render(<App />);
    const headerProps = (window as any).mockHeaderProps;

    // Проверяем, что значение isSlowModeEnabled передается корректно в Header
    // В нашем случае среди выбранных торрентов (ID: 1, 2) есть один с IsSlowMode: true
    expect(headerProps.isSlowModeEnabled).toBe(true);
  });

  it("корректно определяет отсутствие замедленных торрентов", () => {
    // Изменяем моки для случая, когда нет замедленных торрентов
    vi.mocked(useTorrentData).mockReturnValue({
      ...vi.mocked(useTorrentData)(),
      torrents: [
        createMockTorrentData(1, "Torrent 1", false),
        createMockTorrentData(3, "Torrent 3", false),
      ],
      selectedTorrents: new Set([1, 3]),
      isInitialized: true,
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;

    // Проверяем, что значение isSlowModeEnabled корректно определяет отсутствие замедленных торрентов
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });

  it("вызывает handleSelectAll с отфильтрованными торрентами", () => {
    render(<App />);
    const headerProps = (window as any).mockHeaderProps;

    // Вызываем функцию handleSelectAll через адаптер
    headerProps.onSelectAll();

    // Проверяем, что handleSelectAll был вызван с правильными параметрами
    expect(mockHandleSelectAll).toHaveBeenCalledWith([
      createMockTorrentData(1, "Filtered 1", false),
      createMockTorrentData(2, "Filtered 2", true),
    ]);
  });

  it("корректно передает параметры в handleTorrentSpeedLimit", () => {
    render(<App />);
    const torrentListProps = (window as any).mockTorrentListProps;

    // Вызываем адаптер с тестовыми параметрами
    torrentListProps.onSetSpeedLimit(1, true);

    // Проверяем, что handleSetSpeedLimit был вызван с правильными параметрами
    expect(mockHandleTorrentSpeedLimit).toHaveBeenCalledWith([1], true);
  });

  it("корректно определяет отсутствие замедленных торрентов, если торрент не найден", () => {
    vi.mocked(useTorrentData).mockReturnValue({
      ...vi.mocked(useTorrentData)(),
      torrents: [createMockTorrentData(1, "Torrent 1", false)],
      selectedTorrents: new Set([999]), // ID, которого нет в списке торрентов
      isInitialized: true,
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });

  it("корректно определяет замедление, когда все выбранные торренты замедлены", () => {
    vi.mocked(useTorrentData).mockReturnValue({
      ...vi.mocked(useTorrentData)(),
      torrents: [
        createMockTorrentData(1, "Slow Torrent 1", true),
        createMockTorrentData(2, "Slow Torrent 2", true),
      ],
      selectedTorrents: new Set([1, 2]),
      isInitialized: true,
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(true);
  });

  it("корректно определяет замедление при пустом списке выбранных торрентов", () => {
    vi.mocked(useTorrentData).mockReturnValue({
      ...vi.mocked(useTorrentData)(),
      torrents: [
        createMockTorrentData(1, "Torrent 1", true),
        createMockTorrentData(2, "Torrent 2", true),
      ],
      selectedTorrents: new Set(), // Пустой список выбранных торрентов
      isInitialized: true,
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });
});
