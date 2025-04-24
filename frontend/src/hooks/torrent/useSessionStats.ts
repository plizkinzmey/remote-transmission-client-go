import { useState, useCallback, useEffect } from "react";
import { SessionStatsData } from "./types";
import { GetSessionStats } from "@wailsjs/go/main/App";

/**
 * Хук для получения и обновления статистики сессии Transmission.
 * @param isInitialized - Флаг, указывающий, инициализировано ли соединение.
 */
export function useSessionStats(isInitialized: boolean) {
  const [sessionStats, setSessionStats] = useState<SessionStatsData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null); // Ошибка специфичная для статистики

  const refreshSessionStats = useCallback(async () => {
    if (!isInitialized) return; // Не обновляем, если соединение не установлено

    setError(null); // Сбрасываем ошибку перед попыткой
    try {
      const stats = await GetSessionStats();
      if (stats) {
        setSessionStats(stats);
      }
    } catch (fetchError) {
      console.error("Failed to fetch session stats:", fetchError);
      setError("Failed to fetch session stats."); // Можно добавить локализацию
      // Не устанавливаем isReconnecting здесь
    }
  }, [isInitialized]);

  // Эффект для периодического обновления статистики
  useEffect(() => {
    let statsInterval: number;

    if (isInitialized) {
      // Немедленно обновляем при инициализации
      refreshSessionStats();
      // Устанавливаем интервал обновления
      statsInterval = window.setInterval(refreshSessionStats, 1000);
    }

    return () => {
      if (statsInterval) {
        window.clearInterval(statsInterval);
      }
    };
  }, [isInitialized, refreshSessionStats]);

  return {
    sessionStats,
    error, // Ошибка, специфичная для загрузки статистики
    refreshSessionStats,
  };
}
