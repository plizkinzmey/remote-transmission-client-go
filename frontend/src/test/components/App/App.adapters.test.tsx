import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import App from "../../../App";
// Импортируем ProcessedTorrentData для моков
import { TorrentData as ProcessedTorrentData } from "../../../components/TorrentList";
// Импортируем новые хуки
import {
  useConnectionManager,
  useTorrentList,
  useSessionStats,
  useTorrentSelection,
  useTorrentActions,
  useConfigManager,
  WailsTorrent, // Используем WailsTorrent для rawTorrents
} from "@/hooks/torrent";
import { useBulkOperations, useModals } from "@/hooks";
import { useFilteredTorrents } from "../../../components/TorrentList/hooks/useFilteredTorrents";

// Мокируем новые хуки из @hooks/torrent
vi.mock("@/hooks/torrent", async () => {
  const actual = await vi.importActual("@/hooks/torrent");
  return {
    ...(actual as any), // Сохраняем реальные экспорты (типы и т.д.)
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

// Обновляем тип TorrentData на ProcessedTorrentData
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
  // Добавляем недостающие поля, если они есть в ProcessedTorrentData
  // ETAFormatted: '∞',
  // RatioFormatted: '0.00',
});

// Создаем мок для WailsTorrent
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

describe("App - Адаптеры и вспомогательные функции", () => {
  const mockHandleSelectAll = vi.fn();
  const mockSetSpeedLimit = vi.fn(); // Из useTorrentActions

  beforeEach(() => {
    vi.resetAllMocks();

    // Базовый набор сырых торрентов для тестов
    const mockRawTorrents: WailsTorrent[] = [
      createMockWailsTorrent(1, "Torrent 1", false),
      createMockWailsTorrent(2, "Torrent 2", true),
      createMockWailsTorrent(3, "Torrent 3", false),
    ];

    // Настраиваем моки для новых хуков
    vi.mocked(useConnectionManager).mockReturnValue({
      isInitialized: true,
      isLoading: false,
      isReconnecting: false,
      error: null,
      initialConfig: null,
      connect: vi.fn(),
      reconnect: vi.fn(), // Добавляем reconnect
      setConnectionError: vi.fn(),
      setIsReconnectingState: vi.fn(),
    });

    vi.mocked(useTorrentList).mockReturnValue({
      torrents: mockRawTorrents, // Возвращаем сырые торренты
      isLoading: false,
      error: null,
      refreshTorrents: vi.fn(),
    });

    vi.mocked(useSessionStats).mockReturnValue({
      sessionStats: null,
      error: null,
      refreshSessionStats: vi.fn(), // Добавляем refreshSessionStats
    });

    vi.mocked(useTorrentSelection).mockReturnValue({
      selectedTorrents: new Set([1, 2]), // Выбраны первый и второй торренты
      hasSelectedTorrents: true,
      handleTorrentSelect: vi.fn(),
      handleSelectAll: mockHandleSelectAll,
      clearSelection: vi.fn(),
    });

    vi.mocked(useTorrentActions).mockReturnValue({
      addTorrent: vi.fn(),
      addTorrentFile: vi.fn(),
      removeTorrent: vi.fn(),
      startTorrents: vi.fn(),
      stopTorrents: vi.fn(),
      setSpeedLimit: mockSetSpeedLimit, // Используем мок из useTorrentActions
      verifyTorrent: vi.fn(),
    });

    vi.mocked(useConfigManager).mockReturnValue({
      config: null,
      isSettingsSaving: false,
      error: null,
      handleSettingsSave: vi.fn(),
      setConfig: vi.fn(), // Добавляем setConfig
    });

    // Моки для остальных хуков
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

    // Используем ProcessedTorrentData для filteredTorrents
    const filteredTorrents: ProcessedTorrentData[] = [
      createMockProcessedTorrentData(1, "Filtered 1", false),
      createMockProcessedTorrentData(2, "Filtered 2", true),
    ];

    vi.mocked(useFilteredTorrents).mockReturnValue({
      searchTerm: "",
      setSearchTerm: vi.fn(),
      statusFilter: null,
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
    expect(headerProps.isSlowModeEnabled).toBe(true);
  });

  it("корректно определяет отсутствие замедленных торрентов", () => {
    // Изменяем моки для случая, когда нет замедленных торрентов
    // Убираем лишние () после vi.mocked(...)
    const currentTorrentListMock = vi.mocked(useTorrentList).mock.results[0]?.value ?? { torrents: [], isLoading: false, error: null, refreshTorrents: vi.fn() };
    vi.mocked(useTorrentList).mockReturnValue({
      ...currentTorrentListMock,
      torrents: [
        createMockWailsTorrent(1, "Torrent 1", false),
        createMockWailsTorrent(3, "Torrent 3", false),
      ],
    });
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set([1, 3]),
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });

  it("вызывает handleSelectAll с ID отфильтрованных торрентов", () => {
    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    headerProps.onSelectAll();

    // Проверяем, что handleSelectAll был вызван с массивом объектов { ID: number }
    expect(mockHandleSelectAll).toHaveBeenCalledWith([{ ID: 1 }, { ID: 2 }]);
  });

  it("корректно передает параметры в setSpeedLimit через адаптер", () => {
    render(<App />);
    const torrentListProps = (window as any).mockTorrentListProps;
    torrentListProps.onSetSpeedLimit(1, true);

    // Проверяем, что setSpeedLimit из useTorrentActions был вызван
    expect(mockSetSpeedLimit).toHaveBeenCalledWith([1], true);
  });

  it("корректно определяет отсутствие замедленных торрентов, если торрент не найден", () => {
    // Убираем лишние () после vi.mocked(...)
    const currentTorrentListMock = vi.mocked(useTorrentList).mock.results[0]?.value ?? { torrents: [], isLoading: false, error: null, refreshTorrents: vi.fn() };
    vi.mocked(useTorrentList).mockReturnValue({
      ...currentTorrentListMock,
      torrents: [createMockWailsTorrent(1, "Torrent 1", false)],
    });
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set([999]), // ID, которого нет в списке торрентов
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });

  it("корректно определяет замедление, когда все выбранные торренты замедлены", () => {
    // Убираем лишние () после vi.mocked(...)
    const currentTorrentListMock = vi.mocked(useTorrentList).mock.results[0]?.value ?? { torrents: [], isLoading: false, error: null, refreshTorrents: vi.fn() };
    vi.mocked(useTorrentList).mockReturnValue({
      ...currentTorrentListMock,
      torrents: [
        createMockWailsTorrent(1, "Slow Torrent 1", true),
        createMockWailsTorrent(2, "Slow Torrent 2", true),
      ],
    });
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set([1, 2]),
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(true);
  });

  it("корректно определяет замедление при пустом списке выбранных торрентов", () => {
    // Убираем лишние () после vi.mocked(...)
    const currentTorrentListMock = vi.mocked(useTorrentList).mock.results[0]?.value ?? { torrents: [], isLoading: false, error: null, refreshTorrents: vi.fn() };
    vi.mocked(useTorrentList).mockReturnValue({
      ...currentTorrentListMock,
      torrents: [
        createMockWailsTorrent(1, "Torrent 1", true),
        createMockWailsTorrent(2, "Torrent 2", true),
      ],
    });
    const currentSelectionMock = vi.mocked(useTorrentSelection).mock.results[0]?.value ?? { selectedTorrents: new Set(), hasSelectedTorrents: false, handleTorrentSelect: vi.fn(), handleSelectAll: vi.fn(), clearSelection: vi.fn() };
    vi.mocked(useTorrentSelection).mockReturnValue({
      ...currentSelectionMock,
      selectedTorrents: new Set(), // Пустой список выбранных торрентов
    });

    render(<App />);
    const headerProps = (window as any).mockHeaderProps;
    expect(headerProps.isSlowModeEnabled).toBe(false);
  });
});
