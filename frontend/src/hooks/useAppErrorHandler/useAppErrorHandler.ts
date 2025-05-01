import { useState, useEffect } from "react";
import { useLocalization } from "@contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification"; // Импортируем хук уведомлений

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
  const { showError } = useNotification(); // Получаем функцию showError
  const [appError, setAppError] = useState<string | null>(null);
  const { connectionError, configError, torrentListError, sessionStatsError } =
    errors;
  const { setConnectionError, setIsReconnectingState } = actions;

  useEffect(() => {
    let currentAppError: string | null = null;
    let shouldShowNotification = true; // Флаг, чтобы не показывать дублирующиеся уведомления

    // Приоритет ошибок: Connection > Config > TorrentList > SessionStats
    if (connectionError) {
      currentAppError = connectionError;
      // Уведомление об ошибке соединения уже показывается в useConnectionManager
      shouldShowNotification = false;
    } else if (configError) {
      currentAppError = configError;
      // Уведомление об ошибке конфига уже показывается в useConnectionManager (при загрузке)
      // или в useConfigManager (при сохранении)
      shouldShowNotification = false;
    } else if (torrentListError) {
      // Больше не устанавливаем isReconnecting, просто показываем ошибку
      currentAppError = torrentListError;
      // Устанавливаем общую ошибку соединения, так как список не загрузился
      // setConnectionError(t("errors.connectionFailed")); // Это может вызвать зацикливание, убираем
    } else if (sessionStatsError) {
      currentAppError = sessionStatsError;
    } else {
      currentAppError = null;
      shouldShowNotification = false; // Нет ошибки - нет уведомления
    }

    setAppError(currentAppError);

    // Показываем уведомление только если оно еще не было показано другим хуком
    if (currentAppError && shouldShowNotification) {
      // Обновляем использование API: вместо передачи текущего ключа ошибки как сообщения,
      // используем фиксированный ключ для сообщения и передаем текст ошибки как параметр
      showError(
        "notifications.genericErrorTitle",
        "notifications.genericErrorMessage",
        { error: t(currentAppError) }
      );
    }

    // Сбрасываем состояние переподключения, если ошибок соединения больше нет
    // (кроме случая, когда ошибка была torrentListError, т.к. она больше не вызывает isReconnecting)
    if (!connectionError && !configError && !torrentListError) {
      setIsReconnectingState(false);
    }
  }, [
    connectionError,
    configError,
    torrentListError,
    sessionStatsError,
    setConnectionError, // Оставляем, т.к. используется в логике (хотя и закомментировано)
    setIsReconnectingState,
    t,
    showError, // Добавляем showError в зависимости
  ]);

  return appError; // Возвращаем ключ ошибки для возможного использования в UI (хотя ConnectionStatus удаляется)
}
