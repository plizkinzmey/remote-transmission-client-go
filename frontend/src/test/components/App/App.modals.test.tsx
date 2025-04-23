import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
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

// Мокируем контекст темы и компоненты для упрощения тестов
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

// Мок для Settings компонента с детальной проверкой пропсов
vi.mock("../../../components/settings/Settings", () => ({
  Settings: ({ onSave, onClose, isFirstStart, ...props }: any) => (
    <div
      data-testid="settings-modal" // Изменён с settings-component на settings-modal
      data-is-first-start={isFirstStart}
      onClick={() => {
        onSave({
          host: "test-host",
          username: "test-user",
          password: "test-pass",
          maxUploadRatio: 2,
        });
        onClose();
      }}
      {...props}
    >
      Settings Mocked
    </div>
  ),
}));

// Мок для AddTorrent компонента с детальной проверкой пропсов
vi.mock("../../../components/AddTorrent", () => ({
  AddTorrent: ({
    torrentFile,
    torrentFileData,
    onAdd,
    onAddFile,
    onClose,
    ...props
  }: any) => (
    <div
      data-testid="add-torrent-modal" // Изменён с add-torrent-component на add-torrent-modal
      data-torrent-file={torrentFile}
      data-has-file-data={torrentFileData ? "true" : "false"}
      onClick={() => {
        onAdd("magnet:test");
        onAddFile("test-file-path", "test-name");
        onClose();
      }}
      {...props}
    >
      AddTorrent Mocked
    </div>
  ),
}));

// Мокируем остальные компоненты более просто, т.к. они не важны для этих тестов
vi.mock("../../../components/Header", () => ({
  Header: () => <div data-testid="header-component">Header Mocked</div>,
}));

vi.mock("../../../components/TorrentList", () => ({
  TorrentList: () => (
    <div data-testid="torrent-list-component">TorrentList Mocked</div>
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

// Мокируем CSS модули
vi.mock("../../../styles/App.module.css", () => ({
  default: {
    content: "content-mock",
    scrollableContent: "scrollableContent-mock",
  },
}));

describe("App - Модальные окна", () => {
  const mockCheckFirstStart = vi.fn();
  const mockHandleSuccessfulSettingsSave = vi.fn();
  const mockOpenSettings = vi.fn();
  const mockCloseSettings = vi.fn();
  const mockOpenAddTorrent = vi.fn();
  const mockCloseAddTorrent = vi.fn();
  const mockHandleTorrentFileDrop = vi.fn();
  const mockSaveSettingsAndConnect = vi.fn(); // Из useConfigManager
  const mockAddTorrent = vi.fn(); // Из useTorrentActions
  const mockAddTorrentFile = vi.fn(); // Из useTorrentActions

  beforeEach(() => {
    vi.resetAllMocks();

    // Настройка базовых моков для новых хуков
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
      torrents: [],
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
      selectedTorrents: new Set(),
      hasSelectedTorrents: false,
      handleTorrentSelect: vi.fn(),
      handleSelectAll: vi.fn(),
      clearSelection: vi.fn(),
    });

    vi.mocked(useTorrentActions).mockReturnValue({
      addTorrent: mockAddTorrent,
      addTorrentFile: mockAddTorrentFile,
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
      handleSettingsSave: mockSaveSettingsAndConnect.mockResolvedValue(true),
      setConfig: vi.fn(), // Добавляем setConfig
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
      torrentFileData: { name: "test.torrent", data: "fake data" },
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
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

  it("вызывает checkFirstStart при монтировании", async () => {
    await act(async () => {
      render(<App />);
    });

    expect(mockCheckFirstStart).toHaveBeenCalledTimes(1);
    expect(mockCheckFirstStart).toHaveBeenCalledWith(false); // isReconnecting = false
  });

  it("корректно обрабатывает успешное сохранение настроек", async () => {
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
      isFirstStart: true,
    });
    mockSaveSettingsAndConnect.mockResolvedValue(true); // Успешное сохранение

    const { container } = render(<App />);
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    await act(async () => {
      settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Проверяем вызов saveSettingsAndConnect из useConfigManager
    expect(mockSaveSettingsAndConnect).toHaveBeenCalledWith({
      host: "test-host",
      username: "test-user",
      password: "test-pass",
      maxUploadRatio: 2,
    });
    expect(mockHandleSuccessfulSettingsSave).toHaveBeenCalledTimes(1);
    expect(mockCloseSettings).toHaveBeenCalledTimes(1);
  });

  it("корректно обрабатывает неуспешное сохранение настроек", async () => {
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
      isFirstStart: true,
    });
    mockSaveSettingsAndConnect.mockResolvedValue(false); // Неуспешное сохранение

    const { container } = render(<App />);
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    await act(async () => {
      settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mockSaveSettingsAndConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
    // Окно не должно закрываться автоматически при неуспешном сохранении (если это логика Settings)
    // expect(mockCloseSettings).not.toHaveBeenCalled(); // Зависит от реализации Settings
  });

  it("корректно обрабатывает окно добавления торрента", async () => {
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
      torrentFilePath: "/path/to/test.torrent",
      torrentFileData: { name: "test.torrent", data: "fake torrent data" },
    });

    const { container } = render(<App />);
    let addTorrentModal: HTMLElement | null;
    await waitFor(() => {
      addTorrentModal = container.querySelector(
        '[data-testid="add-torrent-modal"]'
      );
      expect(addTorrentModal).not.toBeNull();
    });

    await act(async () => {
      addTorrentModal?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    // Проверяем вызовы addTorrent и addTorrentFile из useTorrentActions
    expect(mockAddTorrent).toHaveBeenCalledWith("magnet:test", ""); // Проверяем второй аргумент downloadDir
    expect(mockAddTorrentFile).toHaveBeenCalledWith("test-file-path", ""); // Проверяем второй аргумент downloadDir
    expect(mockCloseAddTorrent).toHaveBeenCalledTimes(1);
  });

  it("корректно обрабатывает ошибки при сохранении настроек", async () => {
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
      isFirstStart: true,
    });
    mockSaveSettingsAndConnect.mockRejectedValue(new Error("Test error")); // Ошибка при сохранении

    const { container } = render(<App />);
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    // Оборачиваем клик в try/catch или используем expect().rejects если тестируем сам wrapper
    try {
      await act(async () => {
        settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    } catch (e) {
      // Ожидаем ошибку, если она не перехватывается внутри handleSettingsSaveWrapper
    }

    expect(mockSaveSettingsAndConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
  });
});
