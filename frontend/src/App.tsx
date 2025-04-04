import React, { useState, useEffect } from "react";
import { EventsOn } from "../wailsjs/runtime";
import "@radix-ui/themes/styles.css";
import { Header } from "./components/Header";
import { TorrentList } from "./components/TorrentList";
import { Settings } from "./components/settings/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { Footer } from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useTorrentData } from "./hooks/useTorrentData";
import { useBulkOperations } from "./hooks/useBulkOperations";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useLocalization } from "./contexts/LocalizationContext";
import { LoadConfig } from "../wailsjs/go/main/App";
import styles from "./styles/App.module.css";
import "./App.css";
import "./styles/theme.css";

type ThemeType = "light" | "dark" | "auto";

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
  theme: ThemeType;
}

// Полный интерфейс конфигурации
export interface ConfigData extends ConnectionConfig, UIConfig {}

/**
 * Основной компонент приложения.
 * Использует хуки для управления данными и состоянием приложения,
 * а также компоненты для отображения UI.
 */
function App() {
  const { t } = useLocalization();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [torrentFilePath, setTorrentFilePath] = useState<string | null>(null);
  const [isFirstStart, setIsFirstStart] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [torrentFileData, setTorrentFileData] = useState<{
    name: string;
    data: string;
  } | null>(null);

  // Используем хук для работы с данными торрентов
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

  // Показываем окно настроек при первом запуске
  useEffect(() => {
    const checkFirstStart = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (!savedConfig) {
          setIsFirstStart(true);
          setShowSettings(true);
        }
      } catch (error) {
        console.error("Failed to check first start:", error);
        setIsFirstStart(true);
        setShowSettings(true);
      }
    };

    if (!isReconnecting) {
      checkFirstStart();
    }
  }, [isReconnecting]);

  // При сохранении настроек в режиме первого запуска
  const handleSettingsSaveWrapper = async (
    settings: ConnectionConfig
  ): Promise<boolean> => {
    try {
      // Предотвращаем миганиe UI при сохранении, не закрываем окно до завершения всех операций
      const success = await handleSettingsSave(settings);
      if (success) {
        // Установка флагов после успешного сохранения настроек
        setIsFirstStart(false);
        setShowSettings(false);
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

  // Фильтрация торрентов по поисковому запросу и статусу
  const filteredTorrents = torrents.filter((torrent) => {
    const matchesSearch = torrent.Name.toLowerCase().includes(
      searchTerm.toLowerCase()
    );
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "slow"
        ? torrent.IsSlowMode
        : statusFilter === "queued"
        ? ["queued", "queuedCheck", "queuedDownload"].includes(torrent.Status)
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

  // Обработчик события при перетаскивании файла над окном программы
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  // Обработчик события при уходе перетаскиваемого файла из окна программы
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Проверяем, что курсор действительно покинул область окна
    // Используем координаты события для более надежного определения
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Если курсор находится за пределами элемента, сбрасываем состояние
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  // Обработчик события при сбросе файла в окно программы
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const torrentFile = files.find((file) => file.name.endsWith(".torrent"));

    if (torrentFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(",")[1];

        // Открываем диалог добавления торрента с данными файла
        setTorrentFileData({
          name: torrentFile.name,
          data: base64Data,
        });
        setShowAddTorrent(true);
      };
      reader.readAsDataURL(torrentFile);
    }
  };

  useEffect(() => {
    EventsOn("torrent-opened", (torrentPath: string) => {
      console.log("Получен путь к торрент-файлу:", torrentPath);
      setTorrentFilePath(torrentPath);
      setShowAddTorrent(true);
    });
  }, []);

  return (
    <ThemeProvider>
      <div
        className={styles.appContainer}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className={styles.dragOverlay}>
            <div className={styles.dropIndicator}>
              {t("add.dropTorrentHere")}
            </div>
          </div>
        )}
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
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          torrents={torrents}
          onSetSpeedLimit={handleSetSpeedLimit}
          isSlowModeEnabled={selectedHaveSlowMode}
          isReconnecting={isReconnecting}
          isFirstStart={isFirstStart}
        />
        {isReconnecting && (
          <div className={styles.connectionStatus}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <LoadingSpinner size="medium" />
              <p>{t("errors.timeoutExplanation")}</p>
            </div>
          </div>
        )}
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
            onSave={
              isFirstStart ? handleSettingsSaveWrapper : handleSettingsSave
            }
            onClose={() => {
              if (!isFirstStart) {
                setShowSettings(false);
              }
            }}
            isFirstStart={isFirstStart}
          />
        )}
        {showAddTorrent && (
          <AddTorrent
            torrentFile={torrentFilePath || undefined} // передаётся путь, если есть
            torrentFileData={torrentFileData || undefined} // передаются данные перетаскиваемого файла
            onAdd={handleAddTorrent}
            onAddFile={handleAddTorrentFile}
            onClose={() => {
              setShowAddTorrent(false);
              setTorrentFilePath(null);
              setTorrentFileData(null); // сбрасываем данные о файле при закрытии окна
            }}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
