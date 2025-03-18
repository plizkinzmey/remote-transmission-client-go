import { useState } from "react";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { Settings } from "./components/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import styles from "./styles/App.module.css";
import "./App.css";
import "./styles/theme.css";

// Импортируем созданные хуки
import { useTorrentData } from "./hooks/useTorrentData";
import { useBulkOperations } from "./hooks/useBulkOperations";

/**
 * Основной компонент приложения.
 * Использует хуки для управления данными и состоянием приложения,
 * а также компоненты для отображения UI.
 */
function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);

  // Используем хук для работы с данными торрентов
  const {
    torrents,
    selectedTorrents,
    isInitialized,
    error,
    isReconnecting,
    hasSelectedTorrents,
    sessionStats,
    isLoading,
    handleTorrentSelect,
    handleSelectAll,
    refreshTorrents,
    handleAddTorrent,
    handleAddTorrentFile,
    handleRemoveTorrent,
    handleStartTorrent,
    handleStopTorrent,
    handleSettingsSave,
    handleSetSpeedLimit: handleTorrentSpeedLimit,
  } = useTorrentData();

  // Хук для массовых операций
  const {
    bulkOperations,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  } = useBulkOperations(torrents, selectedTorrents, refreshTorrents);

  // Фильтрация торрентов по поисковому запросу и статусу
  const filteredTorrents = torrents.filter((torrent) => {
    const matchesSearch = torrent.Name.toLowerCase().includes(
      searchTerm.toLowerCase()
    );
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "slow"
        ? torrent.IsSlowMode
        : torrent.Status === statusFilter);
    return matchesSearch && matchesStatus;
  });

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
      <div className={styles.appContainer}>
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddTorrent={() => setShowAddTorrent(true)}
          onSettings={() => setShowSettings(true)}
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
          error={error}
          isReconnecting={isReconnecting}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          torrents={torrents}
          onSetSpeedLimit={handleSetSpeedLimit}
          isSlowModeEnabled={selectedHaveSlowMode}
        />
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
              isLoading={isLoading}
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
            onSave={handleSettingsSave}
            onClose={() => {
              if (isInitialized) {
                setShowSettings(false);
              }
            }}
          />
        )}
        {showAddTorrent && (
          <AddTorrent
            onAdd={handleAddTorrent}
            onAddFile={handleAddTorrentFile}
            onClose={() => setShowAddTorrent(false)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
