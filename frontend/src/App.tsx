import { useState, useEffect } from "react";
import { Button } from "./components/Button";
import { TorrentItem } from "./components/TorrentItem";
import { Settings } from "./components/Settings";
import { AddTorrent } from "./components/AddTorrent";
import { useLocalization } from "./contexts/LocalizationContext";
import {
  Cog6ToothIcon,
  PlusCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import styles from "./styles/App.module.css";
import "./App.css";

import {
  GetTorrents,
  AddTorrent as AddTorrentAPI,
  AddTorrentFile,
  RemoveTorrent,
  Initialize,
  LoadConfig,
  StartTorrents,
  StopTorrents,
} from "../wailsjs/go/main/App";

interface Torrent {
  ID: number;
  Name: string;
  Status: string;
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
}

interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
  language: string;
}

function App() {
  const { t, setLanguage } = useLocalization();
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [selectedTorrents, setSelectedTorrents] = useState<Set<number>>(
    new Set()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  // Меняем isBulkLoading на объект состояний для каждой операции
  const [bulkOperations, setBulkOperations] = useState<{
    start: boolean;
    stop: boolean;
  }>({
    start: false,
    stop: false,
  });

  const [lastBulkAction, setLastBulkAction] = useState<"start" | "stop" | null>(
    null
  );
  const [lastTorrentStates, setLastTorrentStates] = useState<
    Map<number, string>
  >(new Map());

  // Обновляем useEffect для массовых операций
  useEffect(() => {
    if (!lastBulkAction || !(bulkOperations.start || bulkOperations.stop))
      return;

    const selectedTorrentsArray = Array.from(selectedTorrents);

    // Проверяем, есть ли торренты, которые можно обработать
    const hasTorrentsToProcess = selectedTorrentsArray.some((id) => {
      const torrent = torrents.find((t) => t.ID === id);
      if (!torrent) return false;

      if (lastBulkAction === "start") {
        return torrent.Status === "stopped";
      } else {
        return torrent.Status === "downloading" || torrent.Status === "seeding";
      }
    });

    // Если нет торрентов для обработки, отменяем операцию
    if (!hasTorrentsToProcess) {
      setBulkOperations((prev) => ({
        ...prev,
        [lastBulkAction]: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
      return;
    }

    // Проверяем изменение состояний торрентов
    const allTorrentsChanged = selectedTorrentsArray.every((id) => {
      const torrent = torrents.find((t) => t.ID === id);
      const previousState = lastTorrentStates.get(id);

      if (!torrent || !previousState) return false;

      // Торрент уже был в целевом состоянии
      const wasAlreadyInTargetState =
        (lastBulkAction === "start" &&
          (previousState === "downloading" || previousState === "seeding")) ||
        (lastBulkAction === "stop" && previousState === "stopped");

      if (wasAlreadyInTargetState) return true;

      // Проверяем, изменилось ли состояние на целевое
      if (lastBulkAction === "start") {
        return (
          previousState !== torrent.Status &&
          (torrent.Status === "downloading" || torrent.Status === "seeding")
        );
      } else {
        return previousState !== torrent.Status && torrent.Status === "stopped";
      }
    });

    if (allTorrentsChanged) {
      setBulkOperations((prev) => ({
        ...prev,
        [lastBulkAction]: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [
    torrents,
    selectedTorrents,
    bulkOperations,
    lastBulkAction,
    lastTorrentStates,
  ]);

  const handleTorrentSelect = (id: number) => {
    setSelectedTorrents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTorrents.size === filteredTorrents.length) {
      // Если все выбраны - снимаем выделение
      setSelectedTorrents(new Set());
    } else {
      // Иначе выбираем все
      setSelectedTorrents(new Set(filteredTorrents.map((t) => t.ID)));
    }
  };

  // Функция переподключения к серверу
  const reconnect = async () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setError(t("errors.maxReconnectAttempts"));
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        await Initialize(JSON.stringify(savedConfig));
        setError(null);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        return true;
      }
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
      setReconnectAttempts((prev) => prev + 1);
      return false;
    }
  };

  // Функция обновления списка торрентов
  const refreshTorrents = async () => {
    try {
      const response = await GetTorrents();
      setTorrents(response);
      setError(null);
      setReconnectAttempts(0);
      setIsReconnecting(false);
    } catch (error) {
      console.error("Failed to fetch torrents:", error);

      if (!isReconnecting) {
        setError(
          t(
            "errors.connectionLost",
            String(reconnectAttempts + 1),
            String(maxReconnectAttempts)
          )
        );
        const reconnected = await reconnect();
        if (!reconnected) {
          setError(
            t(
              "errors.reconnectFailed",
              String(reconnectAttempts + 1),
              String(maxReconnectAttempts)
            )
          );
        }
      }
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загружаем сохраненные настройки
        const savedConfig = await LoadConfig();

        if (savedConfig) {
          try {
            // Если есть сохраненные настройки, используем их
            await Initialize(JSON.stringify(savedConfig));
            setIsInitialized(true);
            refreshTorrents(); // Первоначальная загрузка
          } catch (initError) {
            console.error("Failed to connect with saved settings:", initError);
            setError(t("errors.connectionFailed", String(initError)));
            setShowSettings(true);
          }
        } else {
          setShowSettings(true);
        }
      } catch (error) {
        console.error("Failed to load config:", error);
        setError(t("errors.failedToLoadConfig", String(error)));
        setShowSettings(true);
      }
    };

    initializeApp();
  }, []);

  // Эффект для автоматического обновления списка торрентов
  useEffect(() => {
    let intervalId: number;

    if (isInitialized) {
      // Запускаем первоначальное обновление
      refreshTorrents();

      // Устанавливаем интервал обновления каждые 3 секунды
      intervalId = window.setInterval(refreshTorrents, 3000);
    }

    // Очистка при размонтировании
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isInitialized]);

  const handleAddTorrent = async (url: string) => {
    try {
      await AddTorrentAPI(url);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to add torrent:", error);
      setError(t("errors.failedToAddTorrent", String(error)));
    }
  };

  const handleAddTorrentFile = async (base64Content: string) => {
    try {
      await AddTorrentFile(base64Content);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to add torrent file:", error);
      setError(t("errors.failedToAddTorrent", String(error)));
    }
  };

  const handleRemoveTorrent = async (id: number, deleteData: boolean) => {
    try {
      await RemoveTorrent(id, deleteData);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to remove torrent:", error);
      setError(t("errors.failedToRemoveTorrent", String(error)));
    }
  };

  const handleStartSelected = async () => {
    if (bulkOperations.start || !hasSelectedTorrents) return;

    const torrentsToStart = torrents.filter(
      (t) => selectedTorrents.has(t.ID) && t.Status === "stopped"
    );

    if (torrentsToStart.length === 0) return;

    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    setBulkOperations((prev) => ({ ...prev, start: true }));
    setLastBulkAction("start");
    setLastTorrentStates(states);

    try {
      await StartTorrents(torrentsToStart.map((t) => t.ID));
      refreshTorrents();
    } catch (error) {
      console.error("Failed to start torrents:", error);
      setError(t("errors.failedToStartTorrents", String(error)));
      setBulkOperations((prev) => ({ ...prev, start: false }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  };

  const handleStopSelected = async () => {
    if (bulkOperations.stop || !hasSelectedTorrents) return;

    const torrentsToStop = torrents.filter(
      (t) =>
        selectedTorrents.has(t.ID) &&
        (t.Status === "downloading" || t.Status === "seeding")
    );

    if (torrentsToStop.length === 0) return;

    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    setBulkOperations((prev) => ({ ...prev, stop: true }));
    setLastBulkAction("stop");
    setLastTorrentStates(states);

    try {
      await StopTorrents(torrentsToStop.map((t) => t.ID));
      refreshTorrents();
    } catch (error) {
      console.error("Failed to stop torrents:", error);
      setError(t("errors.failedToStopTorrents", String(error)));
      setBulkOperations((prev) => ({ ...prev, stop: false }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  };

  const handleStartTorrent = async (id: number) => {
    try {
      await StartTorrents([id]);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to start torrent:", error);
      setError(t("errors.failedToStartTorrent", String(error)));
    }
  };

  const handleStopTorrent = async (id: number) => {
    try {
      await StopTorrents([id]);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to stop torrent:", error);
      setError(t("errors.failedToStopTorrent", String(error)));
    }
  };

  const handleSettingsSave = async (settings: Config) => {
    try {
      await Initialize(JSON.stringify(settings));
      setShowSettings(false);
      setIsInitialized(true);
      setError(null);
      // Update language if changed
      setLanguage(settings.language);
      refreshTorrents();
    } catch (error) {
      console.error("Failed to update settings:", error);
      setError(t("errors.failedToUpdateSettings", String(error)));
    }
  };

  const filteredTorrents = torrents.filter((torrent) =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasSelectedTorrents = selectedTorrents.size > 0;

  return (
    <div className={styles.appContainer}>
      <div className={styles.content}>
        <div className={styles.fixedHeader}>
          <div className={styles.controlPanel}>
            <div className={styles.leftSection}>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder={t("torrents.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="icon"
                onClick={() => setShowAddTorrent(true)}
                aria-label={t("add.title")}
              >
                <PlusCircleIcon />
              </Button>
              <Button
                variant="icon"
                onClick={handleStartSelected}
                disabled={!hasSelectedTorrents || bulkOperations.start}
                loading={bulkOperations.start}
                aria-label={t("torrents.startSelected")}
              >
                {bulkOperations.start ? (
                  <ArrowPathIcon className="loading-spinner" />
                ) : (
                  <PlayIcon />
                )}
              </Button>
              <Button
                variant="icon"
                onClick={handleStopSelected}
                disabled={!hasSelectedTorrents || bulkOperations.stop}
                loading={bulkOperations.stop}
                aria-label={t("torrents.stopSelected")}
              >
                {bulkOperations.stop ? (
                  <ArrowPathIcon className="loading-spinner" />
                ) : (
                  <PauseIcon />
                )}
              </Button>
            </div>
            <div className={styles.rightSection}>
              <Button
                variant="icon"
                onClick={() => setShowSettings(true)}
                aria-label={t("settings.title")}
              >
                <Cog6ToothIcon />
              </Button>
            </div>
          </div>

          {filteredTorrents.length > 0 && (
            <div className={styles.selectAllContainer}>
              <input
                type="checkbox"
                className={styles.selectAllCheckbox}
                checked={
                  selectedTorrents.size > 0 &&
                  selectedTorrents.size === filteredTorrents.length
                }
                onChange={handleSelectAll}
                id="selectAll"
              />
              <label htmlFor="selectAll" className={styles.selectAllLabel}>
                {selectedTorrents.size > 0
                  ? t(
                      "torrents.selected",
                      String(selectedTorrents.size),
                      String(filteredTorrents.length)
                    )
                  : t("torrents.selectAll")}
              </label>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}
          {isReconnecting && (
            <div className={styles.reconnectingStatus}>
              {t("app.reconnecting")}
            </div>
          )}
        </div>
        <div className={styles.torrentListContainer}>
          <div className={styles.torrentList}>
            {filteredTorrents.length > 0 ? (
              filteredTorrents.map((torrent) => (
                <TorrentItem
                  key={torrent.ID}
                  id={torrent.ID}
                  name={torrent.Name}
                  status={torrent.Status}
                  progress={torrent.Progress}
                  size={torrent.Size}
                  sizeFormatted={torrent.SizeFormatted}
                  uploadRatio={torrent.UploadRatio}
                  seedsConnected={torrent.SeedsConnected}
                  seedsTotal={torrent.SeedsTotal}
                  peersConnected={torrent.PeersConnected}
                  peersTotal={torrent.PeersTotal}
                  uploadedBytes={torrent.UploadedBytes}
                  uploadedFormatted={torrent.UploadedFormatted}
                  selected={selectedTorrents.has(torrent.ID)}
                  onSelect={handleTorrentSelect}
                  onRemove={handleRemoveTorrent}
                  onStart={handleStartTorrent}
                  onStop={handleStopTorrent}
                />
              ))
            ) : (
              <div className={styles.noTorrents}>
                {searchTerm
                  ? t("torrents.noTorrentsFound")
                  : t("torrents.noTorrents")}
              </div>
            )}
          </div>
        </div>
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
    </div>
  );
}

export default App;
