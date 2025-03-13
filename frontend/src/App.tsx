import { useState } from "react";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { Settings } from "./components/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { Footer } from "./components/Footer";
import styles from "./styles/App.module.css";
import "./App.css";

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
    handleTorrentSelect,
    handleSelectAll,
    refreshTorrents,
    handleAddTorrent,
    handleAddTorrentFile,
    handleRemoveTorrent,
    handleStartTorrent,
    handleStopTorrent,
    handleSettingsSave,
  } = useTorrentData();

  // Фильтрация торрентов по поисковому запросу
  const filteredTorrents = torrents.filter((torrent) =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Используем хук для массовых операций
  const { bulkOperations, handleStartSelected, handleStopSelected } =
    useBulkOperations(torrents, selectedTorrents, refreshTorrents);

  // Обработчик выбора всех видимых торрентов
  const onSelectAll = () => {
    handleSelectAll(filteredTorrents);
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.content}>
        {/* Шапка приложения */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddTorrent={() => setShowAddTorrent(true)}
          onSettings={() => setShowSettings(true)}
          onStartSelected={handleStartSelected}
          onStopSelected={handleStopSelected}
          hasSelectedTorrents={hasSelectedTorrents}
          startLoading={bulkOperations.start}
          stopLoading={bulkOperations.stop}
          filteredTorrents={filteredTorrents}
          selectedTorrents={selectedTorrents}
          onSelectAll={onSelectAll}
          error={error}
          isReconnecting={isReconnecting}
        />

        {/* Список торрентов */}
        <TorrentList
          torrents={torrents}
          searchTerm={searchTerm}
          selectedTorrents={selectedTorrents}
          onSelect={handleTorrentSelect}
          onRemove={handleRemoveTorrent}
          onStart={handleStartTorrent}
          onStop={handleStopTorrent}
        />

        {/* Футер с информацией о сессии */}
        {sessionStats && (
          <Footer
            totalDownloadSpeed={sessionStats.TotalDownloadSpeed}
            totalUploadSpeed={sessionStats.TotalUploadSpeed}
            freeSpace={sessionStats.FreeSpace}
            transmissionVersion={sessionStats.TransmissionVersion}
          />
        )}

        {/* Модальное окно настроек */}
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

        {/* Модальное окно добавления торрента */}
        {showAddTorrent && (
          <AddTorrent
            onAdd={handleAddTorrent}
            onAddFile={handleAddTorrentFile}
            onClose={() => setShowAddTorrent(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
