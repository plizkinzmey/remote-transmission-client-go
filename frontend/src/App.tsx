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
// Импортируем тип TorrentData из компонента для маппинга
import { TorrentData as ProcessedTorrentData } from "@components/TorrentList";
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
 * Основной компонент приложения.
 */
function App() {
  const { t } = useLocalization(); // Получаем t для обработки ошибок
  const [appError, setAppError] = useState<string | null>(null); // Общее состояние ошибки приложения

  // 1. Управление соединением и конфигурацией
  const {
    isInitialized,
    isLoading: isConnectionLoading,
    isReconnecting,
    error: connectionError,
    initialConfig,
    connect,
    setConnectionError, // Функция для установки ошибки соединения из других хуков
    setIsReconnectingState, // Функция для установки состояния реконнекта из других хуков
  } = useConnectionManager();

  const {
    config,
    isSettingsSaving,
    error: configError,
    handleSettingsSave: saveSettingsAndConnect,
  } = useConfigManager({
    initialConfig,
    onConfigSave: connect, // Передаем функцию connect для сохранения и инициализации
  });

  // 2. Получение данных (зависит от isInitialized)
  const {
    torrents: rawTorrents, // Получаем "сырые" данные
    isLoading: isTorrentListLoading,
    error: torrentListError,
    refreshTorrents,
  } = useTorrentList(isInitialized);

  // Маппинг сырых данных в обработанные для компонента TorrentList
  const processedTorrents = useMemo((): ProcessedTorrentData[] => {
    // Используем WailsTorrent (domain.Torrent)
    return rawTorrents.map((t: WailsTorrent): ProcessedTorrentData => ({
      ID: t.ID,
      Name: t.Name,
      Status: t.Status, // Используем строковый статус напрямую
      IsSlowMode: t.IsSlowMode,
      UploadRatio: t.UploadRatio,
      Progress: t.Progress, // Используем t.Progress (число 0-100)
      Size: t.Size, // Используем t.Size
      SizeFormatted: t.SizeFormatted, // Используем t.SizeFormatted
      SeedsConnected: t.SeedsConnected, // Используем t.SeedsConnected
      SeedsTotal: t.SeedsTotal, // Используем t.SeedsTotal
      PeersConnected: t.PeersConnected,
      PeersTotal: t.PeersTotal, // Используем t.PeersTotal
      UploadedBytes: t.UploadedBytes, // Используем t.UploadedBytes
      UploadedFormatted: t.UploadedFormatted, // Используем t.UploadedFormatted
      DownloadSpeed: t.DownloadSpeed, // Используем t.DownloadSpeed
      DownloadSpeedFormatted: t.DownloadSpeedFormatted, // Используем t.DownloadSpeedFormatted
      UploadSpeed: t.UploadSpeed, // Используем t.UploadSpeed
      UploadSpeedFormatted: t.UploadSpeedFormatted, // Используем t.UploadSpeedFormatted
    }));
  }, [rawTorrents]);

  const {
    sessionStats,
    error: sessionStatsError,
  } = useSessionStats(isInitialized);

  // 3. Управление выбором
  const {
    selectedTorrents,
    hasSelectedTorrents,
    handleTorrentSelect,
    handleSelectAll,
    clearSelection, // Используем для сброса выделения
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
    onActionSuccess: refreshTorrents, // Обновляем список после успешного действия
    onActionError: setAppError, // Показываем ошибку действия пользователю
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

  // Обработка ошибок из разных хуков
  useEffect(() => {
    if (connectionError) {
      setAppError(connectionError);
    } else if (configError) {
      setAppError(configError);
    } else if (torrentListError) {
      setAppError(torrentListError);
      setIsReconnectingState(true);
      setConnectionError(t("errors.connectionFailed"));
    } else if (sessionStatsError) {
      setAppError(sessionStatsError);
    } else {
      setAppError(null);
    }
  }, [connectionError, configError, torrentListError, sessionStatsError, setConnectionError, setIsReconnectingState, t]);

  useEffect(() => {
    if (!isReconnecting) {
      checkFirstStart(isReconnecting); // Передаем isReconnecting
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
    // Используем WailsTorrent здесь
    rawTorrents.find((t: WailsTorrent) => t.ID === id)?.IsSlowMode
  );

  const handleSelectAllAdapter = () => {
    handleSelectAll(filteredTorrents.map(t => ({ ID: t.ID })));
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

  const handleAddTorrentAdapter = (url: string, downloadDir: string = "") => {
    return addTorrent(url, downloadDir);
  };

  const handleAddTorrentFileAdapter = (base64Content: string, downloadDir: string = "") => {
    return addTorrentFile(base64Content, downloadDir);
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
            totalDownloadSpeed={sessionStats?.TotalDownloadSpeed}
            totalUploadSpeed={sessionStats?.TotalUploadSpeed}
            freeSpace={sessionStats?.FreeSpace}
            transmissionVersion={sessionStats?.TransmissionVersion}
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
