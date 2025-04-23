import { useState, useCallback, useEffect } from "react";
import { WailsTorrent, withTimeout } from "./types";
import { GetTorrents } from "@wailsjs/go/main/App";
import { useLocalization } from "@/contexts/LocalizationContext";

/**
 * Хук для получения и управления списком торрентов
 * @param isInitialized - Флаг, указывающий, инициализировано ли соединение
 * @returns Объект с данными торрентов, состоянием загрузки, ошибкой и функцией обновления
 */
export function useTorrentList(isInitialized: boolean) {
  const { t } = useLocalization();
  const [torrents, setTorrents] = useState<WailsTorrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTorrents = useCallback(async () => {
    if (!isInitialized) return;

    if (isFirstLoad) {
      setIsLoading(true);
    }
    setError(null); // Сбрасываем ошибку перед попыткой

    try {
      const response = await withTimeout(GetTorrents(), 60000, t);
      setTorrents(response as WailsTorrent[]);
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
  }, [isInitialized, isFirstLoad, t]);

  // Эффект для периодического обновления списка торрентов
  useEffect(() => {
    let torrentsInterval: number;

    if (isInitialized) {
      // Немедленно обновляем при инициализации
      refreshTorrents();
      // Устанавливаем интервал обновления
      torrentsInterval = window.setInterval(refreshTorrents, 3000);
    }

    return () => {
      if (torrentsInterval) {
        clearInterval(torrentsInterval);
      }
    };
  }, [isInitialized, refreshTorrents]);

  return { torrents, isLoading, error, refreshTorrents };
}
