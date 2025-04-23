import { useState, useCallback, useEffect } from "react";
// Используем WailsTorrent вместо TorrentData здесь
import { WailsTorrent, withTimeout } from "./types";
import { GetTorrents } from "@wailsjs/go/main/App";
import { useLocalization } from "@/contexts/LocalizationContext";

/**
 * Хук для получения и управления списком торрентов (возвращает "сырые" данные из Wails).
 * @param isInitialized - Флаг, указывающий, инициализировано ли соединение.
 */
export function useTorrentList(isInitialized: boolean) {
  const { t } = useLocalization();
  // Используем WailsTorrent для состояния
  const [torrents, setTorrents] = useState<WailsTorrent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTorrents = useCallback(async () => {
    if (!isInitialized) return; // Не обновляем, если соединение не установлено

    if (isFirstLoad) {
      setIsLoading(true);
    }
    setError(null); // Сбрасываем ошибку перед попыткой

    try {
      // Убираем приведение типа, GetTorrents должен возвращать WailsTorrent[] (или совместимый тип)
      const response = await withTimeout(GetTorrents(), 1 * 60 * 1000, t);
      // Убедимся, что response соответствует WailsTorrent[] или преобразуем его, если необходимо
      // В данном случае предполагаем, что GetTorrents() возвращает совместимый тип
      setTorrents(response as WailsTorrent[]); // Оставляем cast если GetTorrents() возвращает просто object[] или any[]
      if (isFirstLoad) setIsFirstLoad(false);
    } catch (fetchError) {
      console.error("Failed to fetch torrents:", fetchError);
      // Устанавливаем ошибку только если это таймаут, иначе она будет обработана в useConnectionManager
      if ((fetchError as Error).message === t("errors.timeout")) {
        setError(t("errors.timeoutExplanation"));
      }
      // Не устанавливаем isReconnecting здесь, это ответственность useConnectionManager
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
      // Немедленно обновляем при инициализации или при изменении isInitialized на true
      refreshTorrents();
      // Устанавливаем интервал обновления
      torrentsInterval = window.setInterval(refreshTorrents, 3000);
    }

    return () => {
      if (torrentsInterval) {
        window.clearInterval(torrentsInterval);
      }
    };
  }, [isInitialized, refreshTorrents]);

  // Возвращаем WailsTorrent[]
  return {
    torrents,
    isLoading: isLoading && isFirstLoad, // Показываем спиннер только при первой загрузке
    error, // Ошибка, специфичная для загрузки торрентов (таймаут)
    refreshTorrents,
  };
}
