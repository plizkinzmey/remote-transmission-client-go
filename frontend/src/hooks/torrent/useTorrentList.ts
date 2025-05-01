import { useState, useCallback, useEffect, useRef } from "react"; // Import useRef
import { WailsTorrent, withTimeout } from "./types";
import { GetTorrents } from "@wailsjs/go/main/App";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification"; // Import useNotification
import { mapBackendStatusToFrontend } from "@/utils/torrentStatus"; // Import status mapping
import { StatusType } from "@/utils/torrentStatus"; // Import StatusType

/**
 * Хук для получения и управления списком торрентов
 * @param isInitialized - Флаг, указывающий, инициализировано ли соединение
 * @returns Объект с данными торрентов, состоянием загрузки, ошибкой и функцией обновления
 */
export function useTorrentList(isInitialized: boolean) {
  const { t } = useLocalization();
  const { showFormatted } = useNotification(); // Get notification function
  const [torrents, setTorrents] = useState<WailsTorrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousTorrentsRef = useRef<Map<number, StatusType>>(new Map()); // Store previous statuses

  const refreshTorrents = useCallback(async () => {
    if (!isInitialized) return;

    if (isFirstLoad) {
      setIsLoading(true);
    }
    setError(null); // Сбрасываем ошибку перед попыткой

    try {
      const response = await withTimeout(GetTorrents(), 60000, t);
      const newTorrents = response as WailsTorrent[];

      // Check for completed downloads and verifications only after the first load
      if (!isFirstLoad) {
        const currentStatuses = new Map<number, StatusType>();

        // Проходим по всем торрентам из нового запроса
        newTorrents.forEach((torrent) => {
          const currentStatus = mapBackendStatusToFrontend(torrent.Status);
          currentStatuses.set(torrent.ID, currentStatus);

          // Получаем предыдущий статус из ref
          const previousStatus = previousTorrentsRef.current.get(torrent.ID);

          // Проверка на изменение статуса с downloading на completed/seeding
          if (
            previousStatus === "downloading" &&
            (currentStatus === "completed" || currentStatus === "seeding")
          ) {
            showFormatted(
              t("notifications.downloadCompleteTitle"),
              "notifications.downloadCompleteMessage",
              { name: torrent.Name },
              "success"
            );
          }

          // Проверка на изменение статуса с checking на любой другой
          if (previousStatus === "checking" && currentStatus !== "checking") {
            showFormatted(
              t("notifications.verifyCompleteTitle"),
              "notifications.verifyCompleteMessage",
              { name: torrent.Name },
              "success"
            );
          }
        });

        // Обновляем ссылку на предыдущие статусы для следующей проверки
        previousTorrentsRef.current = currentStatuses;
      } else {
        // При первой загрузке просто заполняем начальные статусы без проверок изменений
        const initialStatuses = new Map<number, StatusType>();
        newTorrents.forEach((torrent) => {
          initialStatuses.set(
            torrent.ID,
            mapBackendStatusToFrontend(torrent.Status)
          );
        });
        previousTorrentsRef.current = initialStatuses;
      }

      setTorrents(newTorrents);
      if (isFirstLoad) setIsFirstLoad(false);
    } catch (fetchError) {
      console.error("Failed to fetch torrents:", fetchError);
      // Устанавливаем ошибку только если это таймаут
      if ((fetchError as Error).message === t("errors.timeout")) {
        setError(t("errors.timeoutExplanation"));
      }
    } finally {
      if (isFirstLoad) {
        setIsLoading(false);
      }
    }
  }, [isInitialized, isFirstLoad, t, showFormatted]); // Add showFormatted to dependencies

  // Эффект для периодического обновления списка торрентов
  useEffect(() => {
    let torrentsInterval: number;

    if (isInitialized) {
      // Немедленно обновляем при инициализации
      refreshTorrents();
      // Устанавливаем интервал обновления
      torrentsInterval = window.setInterval(refreshTorrents, 3000); // Interval remains 3 seconds
    } else {
      // Clear previous state if connection is lost
      previousTorrentsRef.current = new Map();
      setIsFirstLoad(true); // Reset first load flag on disconnect
    }

    return () => {
      if (torrentsInterval) {
        clearInterval(torrentsInterval);
      }
    };
  }, [isInitialized, refreshTorrents]);

  return { torrents, isLoading, error, refreshTorrents };
}
