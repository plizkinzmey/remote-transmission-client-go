import { useCallback } from "react";
import {
  AddTorrent as AddTorrentAPI,
  AddTorrentFile as AddTorrentFileAPI,
  RemoveTorrent as RemoveTorrentAPI,
  StartTorrents as StartTorrentsAPI,
  StopTorrents as StopTorrentsAPI,
  SetTorrentSpeedLimit as SetTorrentSpeedLimitAPI,
  VerifyTorrent as VerifyTorrentAPI,
} from "@wailsjs/go/main/App";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification"; // Импортируем хук уведомлений

interface TorrentActionsProps {
  onActionStart?: () => void; // Колбэк перед началом действия
  onActionSuccess?: () => void; // Колбэк после успешного действия (например, для обновления списка)
  onActionError?: (errorKey: string) => void; // Колбэк при возникновении ошибки
}

/**
 * Хук для выполнения действий над торрентами (добавление, удаление, старт/стоп и т.д.).
 */
export function useTorrentActions({
  onActionStart,
  onActionSuccess,
  onActionError,
}: TorrentActionsProps) {
  const { t } = useLocalization();
  const { showSuccess, showError } = useNotification(); // Получаем функции уведомлений

  const performAction = useCallback(
    async <T extends unknown[]>(
      actionFn: (...args: T) => Promise<any>,
      args: T,
      successTitleKey: string, // Ключ для заголовка успеха
      successMessageKey: string, // Ключ для сообщения успеха
      errorTitleKey: string, // Ключ для заголовка ошибки
      errorMessageKey: string // Ключ для сообщения ошибки (шаблон)
    ): Promise<boolean> => {
      onActionStart?.();
      try {
        await actionFn(...args);
        // Показываем уведомление об успехе
        showSuccess(t(successTitleKey), t(successMessageKey));
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Action failed: ${errorMessageKey}`, error);
        // Формируем сообщение об ошибке, используя ключ и само сообщение ошибки
        const errorMessage = t(errorMessageKey, { error: String(error) });
        // Показываем уведомление об ошибке
        showError(t(errorTitleKey), errorMessage);
        // Вызываем колбэк ошибки, если он задан
        onActionError?.(errorMessageKey);
        return false;
      }
    },
    [onActionStart, onActionSuccess, onActionError, t, showSuccess, showError] // Добавляем зависимость onActionError
  );

  // Определяем ключи для каждого действия
  const addTorrent = useCallback(
    (url: string, downloadDir: string = "") =>
      performAction(
        AddTorrentAPI,
        [url, downloadDir],
        "notifications.addTorrentSuccessTitle",
        "notifications.addTorrentSuccessMessage",
        "notifications.addTorrentErrorTitle",
        "notifications.addTorrentErrorMessage"
      ),
    [performAction]
  );

  const addTorrentFile = useCallback(
    (base64Content: string, downloadDir: string = "") =>
      performAction(
        AddTorrentFileAPI,
        [base64Content, downloadDir],
        "notifications.addTorrentSuccessTitle", // Используем те же ключи, что и для URL
        "notifications.addTorrentSuccessMessage",
        "notifications.addTorrentErrorTitle",
        "notifications.addTorrentErrorMessage"
      ),
    [performAction]
  );

  const removeTorrent = useCallback(
    (id: number, deleteData: boolean) =>
      performAction(
        RemoveTorrentAPI,
        [id, deleteData],
        "notifications.removeTorrentSuccessTitle",
        "notifications.removeTorrentSuccessMessage",
        "notifications.removeTorrentErrorTitle",
        "notifications.removeTorrentErrorMessage"
      ),
    [performAction]
  );

  const startTorrents = useCallback(
    (ids: number[]) =>
      performAction(
        StartTorrentsAPI,
        [ids],
        "notifications.startTorrentSuccessTitle",
        "notifications.startTorrentSuccessMessage",
        "notifications.startTorrentErrorTitle",
        "notifications.startTorrentErrorMessage"
      ),
    [performAction]
  );

  const stopTorrents = useCallback(
    (ids: number[]) =>
      performAction(
        StopTorrentsAPI,
        [ids],
        "notifications.stopTorrentSuccessTitle",
        "notifications.stopTorrentSuccessMessage",
        "notifications.stopTorrentErrorTitle",
        "notifications.stopTorrentErrorMessage"
      ),
    [performAction]
  );

  const setSpeedLimit = useCallback(
    (ids: number[], isSlowMode: boolean) =>
      performAction(
        SetTorrentSpeedLimitAPI,
        [ids, isSlowMode],
        "notifications.setSpeedLimitSuccessTitle",
        isSlowMode
          ? "notifications.setSpeedLimitSlowSuccessMessage"
          : "notifications.setSpeedLimitNormalSuccessMessage",
        "notifications.setSpeedLimitErrorTitle",
        "notifications.setSpeedLimitErrorMessage"
      ),
    [performAction]
  );

  const verifyTorrent = useCallback(
    (id: number) =>
      performAction(
        VerifyTorrentAPI,
        [id],
        "notifications.verifyTorrentSuccessTitle",
        "notifications.verifyTorrentSuccessMessage",
        "notifications.verifyTorrentErrorTitle",
        "notifications.verifyTorrentErrorMessage"
      ),
    [performAction]
  );

  return {
    addTorrent,
    addTorrentFile,
    removeTorrent,
    startTorrents,
    stopTorrents,
    setSpeedLimit,
    verifyTorrent,
  };
}
