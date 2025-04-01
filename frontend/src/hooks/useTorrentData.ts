import { useState, useEffect, useCallback } from "react";
import { TorrentData } from "../components/TorrentList";
import { useLocalization } from "../contexts/LocalizationContext";
import { ConnectionConfig, UIConfig, ConfigData } from "../App";
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
  SetTorrentSpeedLimit,
  VerifyTorrent,
} from "../../wailsjs/go/main/App";

// Интерфейс для статистики сессии
interface SessionStatsData {
  TotalDownloadSpeed: number;
  TotalUploadSpeed: number;
  FreeSpace: number;
  TransmissionVersion: string;
}

// Функция для создания таймаута
const withTimeout = <T>(
  promise: Promise<T>,
  timeout: number,
  t: (key: string) => string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(t("errors.timeout"))), timeout)
    ),
  ]);
};

/**
 * Хук для работы с данными торрентов и управления соединением
 */
export function useTorrentData() {
  const { t, currentLanguage: languageState } = useLocalization();
  const [torrents, setTorrents] = useState<TorrentData[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStatsData | null>(null);
  const [selectedTorrents, setSelectedTorrents] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

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
    setIsReconnecting(true);
    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        await Initialize(JSON.stringify(savedConfig));
        setError(null);
        setIsReconnecting(false);
        return true;
      }
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
      return false;
    }
  };

  // Функция для обновления статистики сессии
  const refreshSessionStats = useCallback(async () => {
    if (!isInitialized) return;

    try {
      const stats = await GetSessionStats();
      if (stats) {
        setSessionStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch session stats:", error);
    }
  }, [isInitialized]);

  // Функция для обновления списка торрентов с таймаутом
  const refreshTorrents = useCallback(async () => {
    if (isFirstLoad) {
      setIsLoading(true); // Показываем спиннер загрузки торрентов только при первом запуске
    }

    try {
      const response = await withTimeout(GetTorrents(), 1 * 60 * 1000, t); // Таймаут 1 минута
      setTorrents(response);
      setError(null);
      setIsReconnecting(false);
      setIsFirstLoad(false); // После первого успешного обновления отключаем спиннер загрузки торрентов
    } catch (error) {
      console.error("Failed to fetch torrents:", error);
      setError(t("errors.timeoutExplanation"));
      setIsReconnecting(true); // Устанавливаем реконнект только при таймауте
    } finally {
      if (isFirstLoad) {
        setIsLoading(false); // Отключаем спиннер загрузки торрентов только при первом запуске
      }
    }
  }, [t, isFirstLoad]);

  // Инициализация приложения при загрузке
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          const config: ConfigData = {
            ...savedConfig,
            theme: (savedConfig.theme || "light") as "light" | "dark" | "auto",
            slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as "KiB/s" | "MiB/s",
          };

          setConfig(config);

          // Пытаемся подключиться только если есть конфигурация
          try {
            await Initialize(JSON.stringify(config));
            await refreshSessionStats();
            await refreshTorrents();
            setIsInitialized(true);
            setError(null);
          } catch (initError) {
            console.error("Failed to connect with saved settings:", initError);
            setError(t("errors.timeoutExplanation"));
            setIsReconnecting(true);
          }
        }
      } catch (error) {
        // Если конфигурации нет или произошла ошибка при загрузке,
        // просто игнорируем - это нормальный кейс при первом запуске
        console.log("No configuration found or failed to load:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [refreshSessionStats, refreshTorrents, t]);

  // Эффект для периодического обновления данных
  useEffect(() => {
    let torrentsInterval: number;
    let statsInterval: number;

    if (isInitialized) {
      // Немедленно обновляем данные при инициализации
      refreshSessionStats();

      // Устанавливаем интервалы обновления
      statsInterval = window.setInterval(refreshSessionStats, 1000);
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
  const handleAddTorrent = async (url: string, downloadDir: string = "") => {
    try {
      await AddTorrentAPI(url, downloadDir);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to add torrent:", error);
      setError(t("errors.failedToAddTorrent", String(error)));
      return false;
    }
  };

  // Обработчик добавления торрента из файла
  const handleAddTorrentFile = async (
    base64Content: string,
    downloadDir: string = ""
  ) => {
    try {
      await AddTorrentFile(base64Content, downloadDir);
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

  // Обработчик установки лимита скорости торрента
  const handleSetSpeedLimit = async (ids: number[], isSlowMode: boolean) => {
    if (!config) return false;
    try {
      await SetTorrentSpeedLimit(ids, isSlowMode);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to set speed limit:", error);
      setError(t("errors.failedToSetSpeedLimit", String(error)));
      return false;
    }
  };

  // Обработчик сохранения настроек
  const handleSettingsSave = async (connectionSettings: ConnectionConfig) => {
    try {
      setIsSettingsSaving(true);
      
      // При первом запуске у нас нет текущего конфига, используем значения по умолчанию
      // но сохраняем текущий язык если он есть
      const uiSettings: UIConfig = {
        language: config?.language || languageState || "en",
        theme: (config?.theme || "light") as "light" | "dark" | "auto",
      };

      // Создаем полный конфиг
      const fullConfig: ConfigData = {
        ...connectionSettings,
        ...uiSettings,
      };

      // Инициализация с новыми настройками
      await Initialize(JSON.stringify(fullConfig));
      
      // Сброс состояния
      setError(null);
      setIsReconnecting(false);
      setConfig(fullConfig);
      setIsInitialized(true);

      // Обновляем данные последовательно
      try {
        await refreshSessionStats();
        await refreshTorrents();
        return true;
      } catch (error) {
        console.error("Failed to refresh data after settings save:", error);
        return false;
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setError(t("errors.failedToUpdateSettings", String(error)));
      return false;
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // Обработчик верификации торрента
  const handleVerifyTorrent = async (id: number) => {
    try {
      await VerifyTorrent(id);
      refreshTorrents();
      return true;
    } catch (error) {
      console.error("Failed to verify torrent:", error);
      setError(t("errors.failedToVerifyTorrent", String(error)));
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
    hasSelectedTorrents,
    sessionStats,
    isLoading: isLoading && isFirstLoad,
    isReconnecting, // Добавлено возвращение isReconnecting
    config,
    handleTorrentSelect,
    handleSelectAll,
    refreshTorrents,
    handleAddTorrent,
    handleAddTorrentFile,
    handleRemoveTorrent,
    handleStartTorrent,
    handleStopTorrent,
    handleSettingsSave,
    handleSetSpeedLimit,
    handleVerifyTorrent,
  };
}
