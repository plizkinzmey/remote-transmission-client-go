import { useState, useCallback, useEffect, useRef } from "react";
import {
  EventsOn,
  WindowUnminimise,
  WindowShow,
  WindowSetAlwaysOnTop,
} from "@wailsjs/runtime";
import { LoadConfig } from "@wailsjs/go/main/App"; // Correct alias

// Константа для задержки сброса always-on-top состояния (в миллисекундах)
export const WINDOW_RESET_DELAY_MS = 1000;

/**
 * Represents the data of a torrent file.
 */
export interface TorrentFileData {
  /** The name of the torrent file. */
  name: string;
  /** The base64 encoded content of the torrent file. */
  data: string;
}

/**
 * Defines the return type of the useModals hook.
 */
export interface UseModalsReturn {
  /** Whether the settings modal is visible. */
  showSettings: boolean;
  /** Whether the add torrent modal is visible. */
  showAddTorrent: boolean;
  /** The path to a torrent file opened via event, if any. */
  torrentFilePath: string | null;
  /** Indicates if this is the first time the application is started. */
  isFirstStart: boolean;
  /** Data of a torrent file dropped onto the application, if any. */
  torrentFileData: TorrentFileData | null;
  /** Function to check if it's the first start (usually called on app load). */
  checkFirstStart: (isReconnecting: boolean) => Promise<void>;
  /** Function to call when settings have been successfully saved. */
  handleSuccessfulSettingsSave: () => void;
  /** Function to open the settings modal. */
  openSettings: () => void;
  /** Function to close the settings modal (respects first start logic). */
  closeSettings: () => void;
  /** Function to open the add torrent modal. */
  openAddTorrent: () => void;
  /** Function to close the add torrent modal and clear related state. */
  closeAddTorrent: () => void;
  /** Function to handle a dropped torrent file. */
  handleTorrentFileDrop: (fileName: string, fileData: string) => void;
}

/**
 * Custom hook to manage the state of various modals within the application,
 * handle the first start logic, and process torrent file inputs (events and drag-and-drop).
 *
 * @returns {UseModalsReturn} An object containing modal states and functions to control them.
 */
export const useModals = (): UseModalsReturn => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [torrentFilePath, setTorrentFilePath] = useState<string | null>(null);
  const [isFirstStart, setIsFirstStart] = useState(false);
  const [torrentFileData, setTorrentFileData] =
    useState<TorrentFileData | null>(null);

  // Создаем useRef для хранения ID таймера сброса always-on-top состояния
  const resetAlwaysOnTopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Активирует окно и временно устанавливает его поверх других окон
   * для привлечения внимания пользователя.
   */
  const activateWindowWithAlwaysOnTop = async (): Promise<void> => {
    try {
      // Активация окна
      await WindowUnminimise(); // Разворачиваем окно, если оно свёрнуто
      await WindowShow(); // Показываем окно, если оно скрыто

      // Кратковременно делаем окно "поверх всех", чтобы гарантировать видимость
      await WindowSetAlwaysOnTop(true);

      // Очищаем предыдущий таймер, если он существует
      if (resetAlwaysOnTopTimeoutRef.current !== null) {
        clearTimeout(resetAlwaysOnTopTimeoutRef.current);
      }

      // Устанавливаем новый таймер для сброса always-on-top состояния
      resetAlwaysOnTopTimeoutRef.current = setTimeout(async () => {
        try {
          await WindowSetAlwaysOnTop(false);
        } catch (error) {
          console.error("Failed to reset always-on-top state:", error);
        }
      }, WINDOW_RESET_DELAY_MS);
    } catch (error) {
      console.error("Failed to activate window:", error);
      throw error; // Пробрасываем ошибку дальше для обработки вызывающей стороной
    }
  };

  // Проверяем, является ли запуск первым
  const checkFirstStart = useCallback(async (isReconnecting: boolean) => {
    if (isReconnecting) return;

    try {
      const savedConfig = await LoadConfig();
      if (!savedConfig) {
        console.log("First start detected, opening settings.");
        setIsFirstStart(true);
        setShowSettings(true);
      }
    } catch (error) {
      console.error("Error loading config during first start check:", error);
      // Assume it's the first start if config loading fails
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
    // EventsOn returns a function to unsubscribe
    const unsubscribe = EventsOn(
      "torrent-opened",
      async (torrentPath: string) => {
        if (typeof torrentPath === "string" && torrentPath) {
          console.log("Received torrent file path via event:", torrentPath);

          // Активация окна
          try {
            await activateWindowWithAlwaysOnTop();
          } catch (error) {
            console.error("Failed to activate window:", error);
          }

          setTorrentFilePath(torrentPath);
          setShowAddTorrent(true);
        } else {
          console.warn("Received invalid torrent path via event:", torrentPath);
        }
      }
    );

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      // Очищаем таймер при размонтировании
      if (resetAlwaysOnTopTimeoutRef.current !== null) {
        clearTimeout(resetAlwaysOnTopTimeoutRef.current);
      }

      // Отписываемся от события
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

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
