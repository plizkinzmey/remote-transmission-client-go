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

interface TorrentActionsProps {
  onActionStart?: () => void; // Колбэк перед началом действия
  onActionSuccess?: () => void; // Колбэк после успешного действия (например, для обновления списка)
  onActionError?: (error: string) => void; // Колбэк при ошибке действия
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

  const performAction = useCallback(
    async <T extends unknown[]>(
      actionFn: (...args: T) => Promise<any>,
      args: T,
      errorKey: string
    ): Promise<boolean> => {
      onActionStart?.();
      try {
        await actionFn(...args);
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Action failed: ${errorKey}`, error);
        const errorMessage = t(errorKey, String(error));
        onActionError?.(errorMessage);
        return false;
      }
    },
    [onActionStart, onActionSuccess, onActionError, t]
  );

  const addTorrent = useCallback(
    (url: string, downloadDir: string = "") =>
      performAction(
        AddTorrentAPI,
        [url, downloadDir],
        "errors.failedToAddTorrent"
      ),
    [performAction]
  );

  const addTorrentFile = useCallback(
    (base64Content: string, downloadDir: string = "") =>
      performAction(
        AddTorrentFileAPI,
        [base64Content, downloadDir],
        "errors.failedToAddTorrent"
      ),
    [performAction]
  );

  const removeTorrent = useCallback(
    (id: number, deleteData: boolean) =>
      performAction(
        RemoveTorrentAPI,
        [id, deleteData],
        "errors.failedToRemoveTorrent"
      ),
    [performAction]
  );

  const startTorrents = useCallback(
    (ids: number[]) =>
      performAction(StartTorrentsAPI, [ids], "errors.failedToStartTorrent"),
    [performAction]
  );

  const stopTorrents = useCallback(
    (ids: number[]) =>
      performAction(StopTorrentsAPI, [ids], "errors.failedToStopTorrent"),
    [performAction]
  );

  const setSpeedLimit = useCallback(
    (ids: number[], isSlowMode: boolean) =>
      performAction(
        SetTorrentSpeedLimitAPI,
        [ids, isSlowMode],
        "errors.failedToSetSpeedLimit"
      ),
    [performAction]
  );

  const verifyTorrent = useCallback(
    (id: number) =>
      performAction(VerifyTorrentAPI, [id], "errors.failedToVerifyTorrent"),
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
