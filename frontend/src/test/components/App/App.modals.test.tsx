import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import App from "../../../App";
import { useTorrentData } from "../../../hooks/useTorrentData";
import { useModals } from "../../../hooks/useModals";
import { useFilteredTorrents } from "../../../components/TorrentList/hooks/useFilteredTorrents";
import { useBulkOperations } from "../../../hooks/useBulkOperations";

// Мокируем хуки
vi.mock("../../../hooks/useTorrentData");
vi.mock("../../../hooks/useModals");
vi.mock("../../../components/TorrentList/hooks/useFilteredTorrents");
vi.mock("../../../hooks/useBulkOperations");

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
  const mockHandleSettingsSave = vi.fn();
  const mockHandleAddTorrent = vi.fn();
  const mockHandleAddTorrentFile = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

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
      handleAddTorrent: mockHandleAddTorrent,
      handleAddTorrentFile: mockHandleAddTorrentFile,
      handleRemoveTorrent: vi.fn(),
      handleStartTorrent: vi.fn(),
      handleStopTorrent: vi.fn(),
      handleVerifyTorrent: vi.fn(),
      handleSettingsSave: mockHandleSettingsSave.mockResolvedValue(true),
      handleSetSpeedLimit: vi.fn(),
      config: null,
    });

    vi.mocked(useModals).mockReturnValue({
      showSettings: false,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: false,
      torrentFileData: { name: "test.torrent", data: "fake data" }, // Исправлено на корректный объект
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
        speedLimit: false, // Исправлено на boolean
      },
      error: null, // Добавлено свойство error
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
    // Настраиваем useModals с showSettings = true
    vi.mocked(useModals).mockReturnValue({
      showSettings: true,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: true,
      torrentFileData: null,
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
    });

    mockHandleSettingsSave.mockResolvedValue(true);

    const { container } = render(<App />);

    // Используем waitFor для ожидания появления модального окна
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    // Кликаем по модальному окну для сохранения настроек
    await act(async () => {
      settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Проверяем, что handleSettingsSave был вызван с правильными параметрами
    expect(mockHandleSettingsSave).toHaveBeenCalledWith({
      host: "test-host",
      username: "test-user",
      password: "test-pass",
      maxUploadRatio: 2,
    });

    // Проверяем, что после успешного сохранения был вызван handleSuccessfulSettingsSave
    expect(mockHandleSuccessfulSettingsSave).toHaveBeenCalledTimes(1);

    // Проверяем, что окно закрылось
    expect(mockCloseSettings).toHaveBeenCalledTimes(1);
  });

  it("корректно обрабатывает неуспешное сохранение настроек", async () => {
    // Настраиваем useModals с showSettings = true
    vi.mocked(useModals).mockReturnValue({
      showSettings: true,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: true,
      torrentFileData: null,
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
    });

    // Имитируем неуспешное сохранение настроек
    mockHandleSettingsSave.mockResolvedValue(false);

    const { container } = render(<App />);

    // Используем waitFor для ожидания появления модального окна
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    // Кликаем по модальному окну для сохранения настроек
    await act(async () => {
      settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Проверяем, что handleSettingsSave был вызван
    expect(mockHandleSettingsSave).toHaveBeenCalledTimes(1);

    // Проверяем, что handleSuccessfulSettingsSave НЕ был вызван при неудаче
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
  });

  it("корректно обрабатывает окно добавления торрента", async () => {
    // Настраиваем useModals с showAddTorrent = true и данными файла
    vi.mocked(useModals).mockReturnValue({
      showSettings: false,
      showAddTorrent: true,
      torrentFilePath: "/path/to/test.torrent",
      isFirstStart: false,
      torrentFileData: { name: "test.torrent", data: "fake torrent data" },
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
    });

    const { container } = render(<App />);

    // Используем waitFor для ожидания появления модального окна
    let addTorrentModal: HTMLElement | null;
    await waitFor(() => {
      addTorrentModal = container.querySelector(
        '[data-testid="add-torrent-modal"]'
      );
      expect(addTorrentModal).not.toBeNull();
    });

    // Кликаем по модальному окну для добавления торрента
    await act(async () => {
      addTorrentModal?.dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    // Проверяем, что handleAddTorrent и handleAddTorrentFile были вызваны
    expect(mockHandleAddTorrent).toHaveBeenCalledWith("magnet:test");
    expect(mockHandleAddTorrentFile).toHaveBeenCalledWith(
      "test-file-path",
      "test-name"
    );

    // Проверяем, что окно закрылось
    expect(mockCloseAddTorrent).toHaveBeenCalledTimes(1);
  });

  it("корректно обрабатывает ошибки при сохранении настроек", async () => {
    // Настраиваем useModals с showSettings = true
    vi.mocked(useModals).mockReturnValue({
      showSettings: true,
      showAddTorrent: false,
      torrentFilePath: null,
      isFirstStart: true,
      torrentFileData: null,
      checkFirstStart: mockCheckFirstStart,
      handleSuccessfulSettingsSave: mockHandleSuccessfulSettingsSave,
      openSettings: mockOpenSettings,
      closeSettings: mockCloseSettings,
      openAddTorrent: mockOpenAddTorrent,
      closeAddTorrent: mockCloseAddTorrent,
      handleTorrentFileDrop: mockHandleTorrentFileDrop,
    });

    // Имитируем ошибку при сохранении настроек
    mockHandleSettingsSave.mockRejectedValue(new Error("Test error"));

    const { container } = render(<App />);

    // Ожидаем появления модального окна
    let settingsModal: HTMLElement | null;
    await waitFor(() => {
      settingsModal = container.querySelector('[data-testid="settings-modal"]');
      expect(settingsModal).not.toBeNull();
    });

    // Кликаем по модальному окну для сохранения настроек
    await act(async () => {
      settingsModal?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Проверяем, что handleSettingsSave был вызван
    expect(mockHandleSettingsSave).toHaveBeenCalledTimes(1);

    // Проверяем, что handleSuccessfulSettingsSave не был вызван при ошибке
    expect(mockHandleSuccessfulSettingsSave).not.toHaveBeenCalled();
  });
});
