import React from "react";
// Добавляем импорт Mock
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor, screen } from "@testing-library/react";
import App, { ConnectionConfig } from "../../../App"; // Импортируем ConnectionConfig из App
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

// Определяем тип для мока useModals для лучшей типизации
type MockUseModalsResult = {
  showSettings: boolean;
  showAddTorrent: boolean;
  torrentFilePath: string | null;
  isFirstStart: boolean;
  torrentFileData: { name: string; data: string } | null;
  // Используем правильный синтаксис для моков функций
  checkFirstStart: ReturnType<typeof vi.fn>;
  handleSuccessfulSettingsSave: ReturnType<typeof vi.fn>;
  openSettings: ReturnType<typeof vi.fn>;
  closeSettings: ReturnType<typeof vi.fn>;
  openAddTorrent: ReturnType<typeof vi.fn>;
  closeAddTorrent: ReturnType<typeof vi.fn>;
  handleTorrentFileDrop: ReturnType<typeof vi.fn>;
};

// Мок для Settings компонента - сохраняем переданные колбэки
let settingsOnSaveCallback: ((settings: any) => Promise<boolean>) | undefined;
let settingsOnCloseCallback: (() => void) | undefined;
vi.mock("../../../components/settings/Settings", () => ({
  Settings: ({ onSave, onClose, isFirstStart, ...props }: any) => {
    settingsOnSaveCallback = onSave;
    settingsOnCloseCallback = onClose;
    return (
      <div
        data-testid="settings-modal"
        data-is-first-start={isFirstStart}
        {...props}
      >
        Settings Mocked
      </div>
    );
  },
}));

// Мок для AddTorrent компонента - сохраняем переданные колбэки
let addTorrentOnAddCallback: ((url: string, downloadDir?: string) => Promise<boolean>) | undefined;
let addTorrentOnAddFileCallback: ((base64: string, downloadDir?: string) => Promise<boolean>) | undefined;
let addTorrentOnCloseCallback: (() => void) | undefined;
vi.mock("../../../components/AddTorrent", () => ({
  AddTorrent: ({
    torrentFile,
    torrentFileData,
    onAdd,
    onAddFile,
    onClose,
    ...props
  }: any) => {
    addTorrentOnAddCallback = onAdd;
    addTorrentOnAddFileCallback = onAddFile;
    addTorrentOnCloseCallback = onClose;
    return (
      <div
        data-testid="add-torrent-modal"
        data-torrent-file={torrentFile}
        data-has-file-data={torrentFileData ? "true" : "false"}
        {...props}
      >
        AddTorrent Mocked
      </div>
    );
  },
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
  // Объявляем изменяемый объект для мока useModals
  let mockModalsResult: MockUseModalsResult;

  // Создаем моки без сложной типизации
  const mockCheckFirstStart = vi.fn();
  const mockHandleSuccessfulSettingsSave = vi.fn();
  const mockOpenSettings = vi.fn();
  const mockCloseSettings = vi.fn();
  const mockOpenAddTorrent = vi.fn();
  const mockCloseAddTorrent = vi.fn();
  const mockHandleTorrentFileDrop = vi.fn();
  const mockSaveSettingsAndConnect = vi.fn();
  const mockAddTorrent = vi.fn();
  const mockAddTorrentFile = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    settingsOnSaveCallback = undefined;
    settingsOnCloseCallback = undefined;
    addTorrentOnAddCallback = undefined;
    addTorrentOnAddFileCallback = undefined;
    addTorrentOnCloseCallback = undefined;

    // Инициализируем мок useModals перед каждым тестом
    mockModalsResult = {
      showSettings: false,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: false,
      torrentFileData: null,
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
    };
    // Мокируем useModals один раз, чтобы он возвращал наш изменяемый объект
    vi.mocked(useModals).mockReturnValue(mockModalsResult);

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
      handleSettingsSave: mockSaveSettingsAndConnect,
      setConfig: vi.fn(),
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
    // Устанавливаем состояние мока ПЕРЕД рендерингом
    mockModalsResult.showSettings = true;
    mockModalsResult.isFirstStart = true;
    mockSaveSettingsAndConnect.mockResolvedValue(true);

    // Когда handleSuccessfulSettingsSave вызывается, мы должны также вызвать closeSettings,
    // чтобы симулировать реальное поведение хука useModals
    mockHandleSuccessfulSettingsSave.mockImplementation(() => {
      mockCloseSettings();
    });

    render(<App />);

    // Ждем рендеринга модального окна и присвоения колбэка
    await waitFor(() => {
      expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
      expect(settingsOnSaveCallback).toBeDefined();
    });

    // Вызываем колбэк
    await act(async () => {
      if (settingsOnSaveCallback) {
        const success = await settingsOnSaveCallback({
          host: "test-host",
          username: "test-user",
          password: "test-pass",
          maxUploadRatio: 2,
        });
        expect(success).toBe(true);
      } else {
        throw new Error("settingsOnSaveCallback is undefined");
      }
    });

    // Проверяем результаты
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
    // Устанавливаем состояние мока ПЕРЕД рендерингом
    mockModalsResult.showSettings = true;
    mockModalsResult.isFirstStart = true;
    mockSaveSettingsAndConnect.mockResolvedValue(false);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
      expect(settingsOnSaveCallback).toBeDefined();
    });

    await act(async () => {
      if (settingsOnSaveCallback) {
        const success = await settingsOnSaveCallback({
          host: "test-host",
          username: "test-user",
          password: "test-pass",
          maxUploadRatio: 2,
        });
        expect(success).toBe(false);
      } else {
        throw new Error("settingsOnSaveCallback is undefined");
      }
    });

    expect(mockSaveSettingsAndConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
    expect(mockCloseSettings).not.toHaveBeenCalled();
  });

  it("корректно обрабатывает окно добавления торрента", async () => {
    // Устанавливаем состояние мока ПЕРЕД рендерингом
    mockModalsResult.showAddTorrent = true;
    mockModalsResult.torrentFilePath = "/path/to/test.torrent";
    mockModalsResult.torrentFileData = { name: "test.torrent", data: "fake torrent data" };

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("add-torrent-modal")).toBeInTheDocument();
      expect(addTorrentOnAddCallback).toBeDefined();
      expect(addTorrentOnAddFileCallback).toBeDefined();
      expect(addTorrentOnCloseCallback).toBeDefined();
    });

    await act(async () => {
      if (addTorrentOnAddCallback && addTorrentOnAddFileCallback && addTorrentOnCloseCallback) {
        await addTorrentOnAddCallback("magnet:test");
        await addTorrentOnAddFileCallback("test-file-path");
        addTorrentOnCloseCallback();
      } else {
        throw new Error("AddTorrent callbacks are undefined");
      }
    });

    expect(mockAddTorrent).toHaveBeenCalledWith("magnet:test", "");
    expect(mockAddTorrentFile).toHaveBeenCalledWith("test-file-path", "");
    expect(mockCloseAddTorrent).toHaveBeenCalledTimes(1);
  });

  it("корректно обрабатывает ошибки при сохранении настроек", async () => {
    const testError = new Error("Test error");
    // Устанавливаем состояние мока ПЕРЕД рендерингом
    mockModalsResult.showSettings = true;
    mockModalsResult.isFirstStart = true;
    mockSaveSettingsAndConnect.mockRejectedValue(testError);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("settings-modal")).toBeInTheDocument();
      expect(settingsOnSaveCallback).toBeDefined();
    });

    await expect(act(async () => {
      if (settingsOnSaveCallback) {
        await settingsOnSaveCallback({
          host: "test-host",
          username: "test-user",
          password: "test-pass",
          maxUploadRatio: 2,
        });
      } else {
        throw new Error("settingsOnSaveCallback is undefined");
      }
    })).rejects.toThrow(testError);

    expect(mockSaveSettingsAndConnect).toHaveBeenCalledTimes(1);
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
    expect(mockCloseSettings).not.toHaveBeenCalled();
  });
});
