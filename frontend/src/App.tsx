import React, { useEffect } from "react";
import "@radix-ui/themes/styles.css";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { Settings } from "./components/Settings/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useTorrentData } from "./hooks/useTorrentData";
import { useBulkOperations } from "./hooks/useBulkOperations";
import { DragDropProvider } from "./components/DragDropProvider";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { useModals } from "./hooks/useModals";
import { useFilteredTorrents } from "./components/TorrentList/hooks/useFilteredTorrents";
import "./App.css";
import "./styles/theme.css";
import styles from "./styles/App.module.css";

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

// Полный интерфейс конфигурации
export interface ConfigData extends ConnectionConfig, UIConfig { }

/**
 * Основной компонент приложения.
 * Использует хуки для управления данными и состоянием приложения,
 * а также компоненты для отображения UI.
 */
function App() {
  // Используем хуки для управления данными и состоянием
  const {
    torrents,
    selectedTorrents,
    error,
    hasSelectedTorrents,
    sessionStats,
    isLoading,
    isReconnecting,
    handleTorrentSelect,
    handleSelectAll,
    refreshTorrents,
    handleAddTorrent,
    handleAddTorrentFile,
    handleRemoveTorrent,
    handleStartTorrent,
    handleStopTorrent,
    handleVerifyTorrent,
    handleSettingsSave,
    handleSetSpeedLimit: handleTorrentSpeedLimit,
    config,
  } = useTorrentData();

  // Используем хук для массовых операций
  const {
    bulkOperations,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  } = useBulkOperations(
    torrents,
    selectedTorrents,
    refreshTorrents,
    config || undefined
  );

  // Используем хук для модальных окон
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

  // Используем хук для фильтрации торрентов
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredTorrents,
  } = useFilteredTorrents(torrents);

  // Показываем окно настроек при первом запуске
  useEffect(() => {
    checkFirstStart(isReconnecting);
  }, [checkFirstStart, isReconnecting]);

  // Обновляем список торрентов при монтировании компонента
  useEffect(() => {
    refreshTorrents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей для вызова только при монтировании

  // При сохранении настроек в режиме первого запуска
  const handleSettingsSaveWrapper = async (
    settings: ConnectionConfig
  ): Promise<boolean> => {
    try {
      // Предотвращаем миганиe UI при сохранении, не закрываем окно до завершения всех операций
      const success = await handleSettingsSave(settings);
      if (success) {
        // Установка флагов после успешного сохранения настроек
        handleSuccessfulSettingsSave();
        return true;
      } else {
        // Если сохранение не удалось, оставляем окно открытым
        console.error("Failed to save settings");
        return false;
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  };

  // Проверяем, есть ли замедленные торренты среди выбранных
  const selectedHaveSlowMode = Array.from(selectedTorrents).some(
    (id) => torrents.find((t) => t.ID === id)?.IsSlowMode
  );

  // Адаптер для handleSelectAll без параметров
  const handleSelectAllAdapter = () => {
    handleSelectAll(filteredTorrents);
  };

  // Адаптер для handleSetSpeedLimit для работы с одним id вместо массива
  const handleTorrentSpeedLimitAdapter = (id: number, isSlowMode: boolean) => {
    handleTorrentSpeedLimit([id], isSlowMode);
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
          torrents={torrents}
          onSetSpeedLimit={handleSetSpeedLimit}
          isSlowModeEnabled={selectedHaveSlowMode}
          isReconnecting={isReconnecting}
          isFirstStart={isFirstStart}
        />

        <ConnectionStatus isReconnecting={isReconnecting} />

        <div className={styles.content}>
          <div className={styles.scrollableContent}>
            <TorrentList
              torrents={filteredTorrents}
              searchTerm={searchTerm}
              selectedTorrents={selectedTorrents}
              onSelect={handleTorrentSelect}
              onRemove={handleRemoveTorrent}
              onStart={handleStartTorrent}
              onStop={handleStopTorrent}
              onVerify={handleVerifyTorrent}
              isLoading={isLoading}
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

        {/* Модальные окна */}
        {showSettings && (
          <Settings
            data-testid="settings-modal"
            onSave={
              isFirstStart ? handleSettingsSaveWrapper : handleSettingsSave
            }
            onClose={closeSettings}
            isFirstStart={isFirstStart}
          />
        )}

        {showAddTorrent && (
          <AddTorrent
            data-testid="add-torrent-modal"
            torrentFile={torrentFilePath || undefined} // передаётся путь, если есть
            torrentFileData={torrentFileData || undefined} // передаются данные перетаскиваемого файла
            onAdd={handleAddTorrent}
            onAddFile={handleAddTorrentFile}
            onClose={closeAddTorrent}
          />
        )}
      </DragDropProvider>
    </ThemeProvider>
  );
}

export default App;
