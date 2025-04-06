import { useState, useCallback, useEffect } from "react";
import { EventsOn } from "../../wailsjs/runtime";
import { LoadConfig } from "../../wailsjs/go/main/App";

interface TorrentFileData {
  name: string;
  data: string;
}

/**
 * Хук для управления состоянием модальных окон
 */
export const useModals = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [torrentFilePath, setTorrentFilePath] = useState<string | null>(null);
  const [isFirstStart, setIsFirstStart] = useState(false);
  const [torrentFileData, setTorrentFileData] =
    useState<TorrentFileData | null>(null);

  // Проверяем, является ли запуск первым
  const checkFirstStart = useCallback(async (isReconnecting: boolean) => {
    if (isReconnecting) return;

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
  }, []);

  // Обработчик успешного сохранения настроек
  const handleSuccessfulSettingsSave = useCallback(() => {
    setIsFirstStart(false);
    setShowSettings(false);
  }, []);

  // Обработчик нажатия кнопки настроек
  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  // Обработчик закрытия настроек
  const closeSettings = useCallback(() => {
    if (!isFirstStart) {
      setShowSettings(false);
    }
  }, [isFirstStart]);

  // Обработчик открытия окна добавления торрента
  const openAddTorrent = useCallback(() => {
    setShowAddTorrent(true);
  }, []);

  // Обработчик закрытия окна добавления торрента
  const closeAddTorrent = useCallback(() => {
    setShowAddTorrent(false);
    setTorrentFilePath(null);
    setTorrentFileData(null);
  }, []);

  // Обработчик перетаскивания торрент-файла
  const handleTorrentFileDrop = useCallback(
    (fileName: string, fileData: string) => {
      setTorrentFileData({
        name: fileName,
        data: fileData,
      });
      setShowAddTorrent(true);
    },
    []
  );

  // Слушаем событие открытия торрент-файла
  useEffect(() => {
    const unsubscribe = EventsOn("torrent-opened", (torrentPath: string) => {
      console.log("Получен путь к торрент-файлу:", torrentPath);
      setTorrentFilePath(torrentPath);
      setShowAddTorrent(true);
    });

    return () => {
      // Чистим подписки при размонтировании компонента
      // (если это поддерживается в текущей версии wails)
    };
  }, []);

  return {
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
  };
};
