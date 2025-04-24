import { useState, useEffect } from "react";
import { useLocalization } from "@contexts/LocalizationContext";

interface ErrorSources {
  connectionError: string | null;
  configError: string | null;
  torrentListError: string | null;
  sessionStatsError: string | null;
}

interface ConnectionActions {
  setConnectionError: (error: string | null) => void;
  setIsReconnectingState: (isReconnecting: boolean) => void;
}

/**
 * Хук для управления и приоритизации ошибок из различных источников в приложении.
 * @param errors - Объект с различными источниками ошибок.
 * @param actions - Действия для управления состоянием соединения.
 * @returns Актуальная ошибка приложения или null.
 */
export function useAppErrorHandler(
  errors: ErrorSources,
  actions: ConnectionActions
): string | null {
  const { t } = useLocalization();
  const [appError, setAppError] = useState<string | null>(null);
  const { connectionError, configError, torrentListError, sessionStatsError } =
    errors;
  const { setConnectionError, setIsReconnectingState } = actions;

  useEffect(() => {
    // Приоритет ошибок: Connection > Config > TorrentList > SessionStats
    if (connectionError) {
      setAppError(connectionError);
    } else if (configError) {
      setAppError(configError);
    } else if (torrentListError) {
      // Особая обработка ошибки списка торрентов - инициируем переподключение
      setAppError(torrentListError);
      setIsReconnectingState(true);
      // Устанавливаем общую ошибку соединения, так как список не загрузился
      setConnectionError(t("errors.connectionFailed"));
    } else if (sessionStatsError) {
      setAppError(sessionStatsError);
    } else {
      // Если ни одной ошибки нет, сбрасываем ошибку приложения
      setAppError(null);
    }
    // Зависимости включают все источники ошибок и действия,
    // чтобы корректно реагировать на их изменения.
  }, [
    connectionError,
    configError,
    torrentListError,
    sessionStatsError,
    setConnectionError,
    setIsReconnectingState,
    t,
  ]);

  return appError;
}
