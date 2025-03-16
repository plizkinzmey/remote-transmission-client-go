import { useState, useEffect, useCallback } from "react";
import { TorrentData } from "../components/TorrentList";
import { useLocalization } from "../contexts/LocalizationContext";
import {
  GetTorrents,
  AddTorrent as AddTorrentAPI,
  AddTorrentFile,
  RemoveTorrent,
  LoadConfig,
  Initialize,
  StartTorrents,
  StopTorrents,
  GetSessionStats,
} from "../../wailsjs/go/main/App";

interface ConfigData {
  host: string;
  port: number;
  username: string;
  password: string;
  language: string;
}

// Интерфейс для статистики сессии
interface SessionStatsData {
  TotalDownloadSpeed: number;
  TotalUploadSpeed: number;
  FreeSpace: number;
  TransmissionVersion: string;
}

/**
 * Хук для работы с данными торрентов и управления соединением
 */
export function useTorrentData() {
  const { t, setLanguage } = useLocalization();
  const [torrents, setTorrents] = useState<TorrentData[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStatsData | null>(
    null
  );
  const [selectedTorrents, setSelectedTorrents] = useState<Set<number>>(
    new Set()
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const maxReconnectAttempts = 3;

  // Обработчик выбора/снятия выбора с торрента
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

  // Обработчик выбора всех торрентов
  const handleSelectAll = (filteredTorrents: TorrentData[]) => {
    if (selectedTorrents.size === filteredTorrents.length) {
      // Если все выбраны - снимаем выделение
      setSelectedTorrents(new Set());
    } else {
      // Иначе выбираем все
      setSelectedTorrents(new Set(filteredTorrents.map((t) => t.ID)));
    }
  };

  // Функция для попытки переподключения к серверу
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

  // Функция для обновления списка торрентов
  const refreshTorrents = useCallback(async () => {
    if (isFirstLoad) {
      setIsLoading(true);
    }

    try {
      const response = await GetTorrents();
      setTorrents(response);
      setError(null);
      setReconnectAttempts(0);
      setIsReconnecting(false);
      setIsFirstLoad(false);
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
    } finally {
      setIsLoading(false);
    }
  }, [isReconnecting, reconnectAttempts, t, isFirstLoad]);

  // Функция для обновления статистики сессии
  const refreshSessionStats = useCallback(async () => {
    try {
      const stats = await GetSessionStats();
      if (stats) {
        setSessionStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch session stats:", error);
      // Не показываем ошибку пользователю, просто логируем
    }
  }, []);

  // Инициализация приложения при загрузке
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
            refreshSessionStats(); // Сразу запрашиваем статистику
            refreshTorrents(); // Затем запускаем загрузку торрентов
          } catch (initError) {
            console.error("Failed to connect with saved settings:", initError);
            setError(t("errors.connectionFailed", String(initError)));
            return false;
          }
        } else {
          return false;
        }
        return true;
      } catch (error) {
        console.error("Failed to load config:", error);
        setError(t("errors.failedToLoadConfig", String(error)));
        return false;
      }
    };

    initializeApp();
  }, []);

  // Эффект для периодического обновления данных
  useEffect(() => {
    let torrentsInterval: number;
    let statsInterval: number;

    if (isInitialized) {
      // Обновляем статистику каждую секунду
      statsInterval = window.setInterval(refreshSessionStats, 1000);

      // Обновляем список торрентов каждые 3 секунды
      torrentsInterval = window.setInterval(refreshTorrents, 3000);
    }

    return () => {
      if (statsInterval) {
        window.clearInterval(statsInterval);
      }
      if (torrentsInterval) {
        window.clearInterval(torrentsInterval);
      }
    };
  }, [isInitialized, refreshSessionStats, refreshTorrents]);

  // Обработчик добавления торрента
  const handleAddTorrent = async (url: string) => {
    try {
      await AddTorrentAPI(url);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to add torrent:", error);
      setError(t("errors.failedToAddTorrent", String(error)));
      return false;
    }
  };

  // Обработчик добавления торрента из файла
  const handleAddTorrentFile = async (base64Content: string) => {
    try {
      await AddTorrentFile(base64Content);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to add torrent file:", error);
      setError(t("errors.failedToAddTorrent", String(error)));
      return false;
    }
  };

  // Обработчик удаления торрента
  const handleRemoveTorrent = async (id: number, deleteData: boolean) => {
    try {
      await RemoveTorrent(id, deleteData);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to remove torrent:", error);
      setError(t("errors.failedToRemoveTorrent", String(error)));
      return false;
    }
  };

  // Обработчик запуска торрента
  const handleStartTorrent = async (id: number) => {
    try {
      await StartTorrents([id]);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to start torrent:", error);
      setError(t("errors.failedToStartTorrent", String(error)));
      return false;
    }
  };

  // Обработчик остановки торрента
  const handleStopTorrent = async (id: number) => {
    try {
      await StopTorrents([id]);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to stop torrent:", error);
      setError(t("errors.failedToStopTorrent", String(error)));
      return false;
    }
  };

  // Обработчик сохранения настроек
  const handleSettingsSave = async (settings: ConfigData) => {
    try {
      await Initialize(JSON.stringify(settings));
      setIsInitialized(true);
      setError(null);
      setLanguage(settings.language);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to update settings:", error);
      setError(t("errors.failedToUpdateSettings", String(error)));
      return false;
    }
  };

  // Флаг наличия выбранных торрентов
  const hasSelectedTorrents = selectedTorrents.size > 0;

  return {
    torrents,
    selectedTorrents,
    isInitialized,
    error,
    isReconnecting,
    hasSelectedTorrents,
    sessionStats,
    isLoading: isLoading && isFirstLoad,
    handleTorrentSelect,
    handleSelectAll,
    refreshTorrents,
    handleAddTorrent,
    handleAddTorrentFile,
    handleRemoveTorrent,
    handleStartTorrent,
    handleStopTorrent,
    handleSettingsSave,
  };
}
