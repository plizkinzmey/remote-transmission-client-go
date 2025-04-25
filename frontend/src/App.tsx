import React, { useEffect, useState, useCallback, useMemo } from "react"; // Добавлен useMemo
import "@radix-ui/themes/styles.css";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { Settings } from "./components/Settings/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useModals } from "@hooks/useModals";
import { useBulkOperations } from "@/hooks/useBulkOperations";
import { DragDropProvider } from "./components/DragDropProvider";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useFilteredTorrents } from "./components/TorrentList/hooks/useFilteredTorrents";
import { mapBackendStatusToFrontend } from "@utils/torrentStatus"; // Импортируем функцию маппинга
import { StatusType } from "@utils/torrentStatus"; // Импортируем StatusType
import {
  useConnectionManager,
  useTorrentList,
  useSessionStats,
  useTorrentSelection,
  useTorrentActions,
  useConfigManager,
  AppConfig,
  WailsTorrent, // Используем импорт WailsTorrent
} from "@hooks/torrent"; // Используем реэкспорт
import { useAppErrorHandler } from "@hooks/useAppErrorHandler/useAppErrorHandler"; // Используем прямой импорт пока пути не обновлены глобально
import "./App.css";
import "./styles/theme.css";
import styles from "./styles/App.module.css";
import { useLocalization } from "./contexts/LocalizationContext"; // Импорт useLocalization

// Интерфейс для настроек подключения (используется в окне настроек)
export interface ConnectionConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  maxUploadRatio: number;
  slowSpeedLimit: number;
  slowSpeedUnit: "KiB/s" | "MiB/s";
}

// Интерфейс для настроек UI (используется в контекстах)
export interface UIConfig {
  language: string;
  theme: "light" | "dark" | "auto";
}

/**
 * Тип данных торрента после обработки для UI
 */
interface ProcessedTorrentData {
  ID: number;
  Name: string;
  Status: StatusType; // <-- Используем StatusType
  Progress: number;
  Size: number;
  SizeFormatted: string;
  UploadRatio: number;
  SeedsConnected: number;
  SeedsTotal: number;
  PeersConnected: number;
  PeersTotal: number;
  UploadedBytes: number;
  UploadedFormatted: string;
  DownloadSpeed: number;
  UploadSpeed: number;
  DownloadSpeedFormatted: string;
  UploadSpeedFormatted: string;
  IsSlowMode: boolean;
}

/**
 * Основной компонент приложения.
 */
function App() {
  // const { t } = useLocalization(); // t больше не нужен здесь напрямую для ошибок
  // const [appError, setAppError] = useState<string | null>(null); // Управляется новым хуком

  // 1. Управление соединением и конфигурацией
  const {
    isInitialized,
    isLoading: isConnectionLoading,
    isReconnecting,
    error: connectionError,
    initialConfig,
    connect,
    setConnectionError, // Передаем в новый хук
    setIsReconnectingState, // Передаем в новый хук
  } = useConnectionManager();

  const {
    config,
    isSettingsSaving,
    error: configError, // Передаем в новый хук
    handleSettingsSave: saveSettingsAndConnect,
  } = useConfigManager({
    initialConfig,
    onConfigSave: connect,
  });

  // 2. Получение данных
  const {
    torrents: rawTorrents,
    isLoading: isTorrentListLoading,
    error: torrentListError, // Передаем в новый хук
    refreshTorrents,
  } = useTorrentList(isInitialized);

  // Маппинг сырых данных в обработанные для компонента TorrentList
  const processedTorrents = useMemo((): ProcessedTorrentData[] => {
    return rawTorrents.map((t: WailsTorrent): ProcessedTorrentData => ({
      ID: t.ID,
      Name: t.Name,
      Status: mapBackendStatusToFrontend(t.Status), // <-- Преобразуем статус
      IsSlowMode: t.IsSlowMode,
      UploadRatio: t.UploadRatio,
      Progress: t.Progress,
      Size: t.Size,
      SizeFormatted: t.SizeFormatted,
      SeedsConnected: t.SeedsConnected,
      SeedsTotal: t.SeedsTotal,
      PeersConnected: t.PeersConnected,
      PeersTotal: t.PeersTotal,
      UploadedBytes: t.UploadedBytes,
      UploadedFormatted: t.UploadedFormatted,
      DownloadSpeed: t.DownloadSpeed,
      DownloadSpeedFormatted: t.DownloadSpeedFormatted,
      UploadSpeed: t.UploadSpeed,
      UploadSpeedFormatted: t.UploadSpeedFormatted,
    }));
  }, [rawTorrents]);

  const {
    sessionStats,
    error: sessionStatsError, // Передаем в новый хук
  } = useSessionStats(isInitialized);

  // Создаем безопасный объект, чтобы убрать ветвления в JSX
  const statsSafe = sessionStats ?? {
    TotalDownloadSpeed: 0,
    TotalUploadSpeed: 0,
    FreeSpace: 0,
    TransmissionVersion: "",
  };

  // Используем новый хук для обработки ошибок
  const appError = useAppErrorHandler(
    { connectionError, configError, torrentListError, sessionStatsError },
    { setConnectionError, setIsReconnectingState }
  );

  // 3. Управление выбором
  const {
    selectedTorrents,
    hasSelectedTorrents,
    handleTorrentSelect,
    handleSelectAll,
    clearSelection,
  } = useTorrentSelection();

  // 4. Действия над торрентами
  const {
    addTorrent,
    addTorrentFile,
    removeTorrent,
    startTorrents,
    stopTorrents,
    setSpeedLimit,
    verifyTorrent,
  } = useTorrentActions({
    onActionStart: () => { },
    onActionSuccess: refreshTorrents,
    onActionError: () => { }, // Удаляем setAppError
  });

  // 5. Массовые операции (зависят от выбранных торрентов и действий)
  const {
    bulkOperations,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit: handleBulkSetSpeedLimit,
  } = useBulkOperations(
    processedTorrents,
    selectedTorrents,
    refreshTorrents,
    config || undefined,
  );

  // 6. Модальные окна
  const {
    showSettings,
    showAddTorrent,
    torrentFilePath,
    isFirstStart,
    torrentFileData,
    checkFirstStart,
    handleSuccessfulSettingsSave,
    openSettings,
    closeSettings,
    openAddTorrent,
    closeAddTorrent,
    handleTorrentFileDrop,
  } = useModals();

  // 7. Фильтрация
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredTorrents,
  } = useFilteredTorrents(processedTorrents);

  useEffect(() => {
    // Этот useEffect остается, он для проверки первого старта
    if (!isReconnecting) {
      checkFirstStart(isReconnecting);
    }
  }, [checkFirstStart, isReconnecting, isInitialized]);

  const handleSettingsSaveWrapper = async (
    settings: ConnectionConfig
  ): Promise<boolean> => {
    const success = await saveSettingsAndConnect(settings);
    if (success) {
      handleSuccessfulSettingsSave();
    }
    return success;
  };

  const selectedHaveSlowMode = Array.from(selectedTorrents).some((id) =>
    rawTorrents.find((t: WailsTorrent) => t.ID === id)?.IsSlowMode
  );

  const handleSelectAllAdapter = () => {
    handleSelectAll(filteredTorrents); // передаем полные объекты торрентов
  };

  const handleTorrentSpeedLimitAdapter = (id: number, isSlowMode: boolean) => {
    setSpeedLimit([id], isSlowMode);
  };

  const handleRemoveTorrentAdapter = (id: number, deleteData: boolean) => {
    removeTorrent(id, deleteData);
  };

  const handleStartTorrentAdapter = (id: number) => {
    startTorrents([id]);
  };

  const handleStopTorrentAdapter = (id: number) => {
    stopTorrents([id]);
  };

  const handleVerifyTorrentAdapter = (id: number) => {
    verifyTorrent(id);
  };

  const handleAddTorrentAdapter = async (url: string, downloadDir: string = "") => { // Делаем функцию асинхронной
    const success = await addTorrent(url, downloadDir); // Ожидаем результат
    if (success) {
      closeAddTorrent(); // Вызываем closeAddTorrent при успехе
    }
    return success; // Возвращаем результат
  };

  const handleAddTorrentFileAdapter = async (base64Content: string, downloadDir: string = "") => { // Делаем функцию асинхронной
    const success = await addTorrentFile(base64Content, downloadDir); // Ожидаем результат
    if (success) {
      closeAddTorrent(); // Вызываем closeAddTorrent при успехе
    }
    return success; // Возвращаем результат
  };

  return (
    <ThemeProvider>
      <DragDropProvider onFileDropped={handleTorrentFileDrop}>
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddTorrent={openAddTorrent}
          onSettings={openSettings}
          onStartSelected={handleStartSelected}
          onStopSelected={handleStopSelected}
          onRemoveSelected={handleRemoveSelected}
          hasSelectedTorrents={hasSelectedTorrents}
          startLoading={bulkOperations.start}
          stopLoading={bulkOperations.stop}
          removeLoading={bulkOperations.remove}
          filteredTorrents={filteredTorrents}
          selectedTorrents={selectedTorrents}
          onSelectAll={handleSelectAllAdapter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          torrents={rawTorrents}
          onSetSpeedLimit={(isSlowMode) => {
            handleBulkSetSpeedLimit(isSlowMode);
          }}
          isSlowModeEnabled={selectedHaveSlowMode}
          isReconnecting={isReconnecting}
          isFirstStart={isFirstStart}
        />

        {(isReconnecting || appError) && <ConnectionStatus isReconnecting={isReconnecting} error={appError} />}

        <div className={styles.content}>
          <div className={styles.scrollableContent}>
            <TorrentList
              torrents={filteredTorrents}
              searchTerm={searchTerm}
              selectedTorrents={selectedTorrents}
              onSelect={handleTorrentSelect}
              onRemove={handleRemoveTorrentAdapter}
              onStart={handleStartTorrentAdapter}
              onStop={handleStopTorrentAdapter}
              onVerify={handleVerifyTorrentAdapter}
              isLoading={isTorrentListLoading || isConnectionLoading}
              isReconnecting={isReconnecting}
              onSetSpeedLimit={handleTorrentSpeedLimitAdapter}
            />
          </div>
          <Footer
            totalDownloadSpeed={statsSafe.TotalDownloadSpeed}
            totalUploadSpeed={statsSafe.TotalUploadSpeed}
            freeSpace={statsSafe.FreeSpace}
            transmissionVersion={statsSafe.TransmissionVersion}
          />
        </div>

        {showSettings && (
          <Settings
            data-testid="settings-modal"
            onSave={handleSettingsSaveWrapper}
            onClose={closeSettings}
            isFirstStart={isFirstStart}
          />
        )}

        {showAddTorrent && (
          <AddTorrent
            data-testid="add-torrent-modal"
            torrentFile={torrentFilePath || undefined}
            torrentFileData={torrentFileData || undefined}
            onAdd={handleAddTorrentAdapter}
            onAddFile={handleAddTorrentFileAdapter}
            onClose={closeAddTorrent}
          />
        )}
      </DragDropProvider>
    </ThemeProvider>
  );
}

export default App;
