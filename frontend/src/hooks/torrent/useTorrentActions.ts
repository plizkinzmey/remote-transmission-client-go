import { useCallback } from "react";
import {
  AddTorrent as GoAddTorrent,
  AddTorrentFile as GoAddTorrentFile,
  RemoveTorrent as GoRemoveTorrent, // Corrected import name
  StartTorrents as GoStartTorrents,
  StopTorrents as GoStopTorrents,
  SetTorrentSpeedLimit as GoSetTorrentSpeedLimit,
  VerifyTorrent as GoVerifyTorrent, // Corrected import name
} from "@wailsjs/go/main/App";
import { WailsTorrent } from "./types";
import { useNotification } from "@/hooks/useNotification";
import { useLocalization } from "@/contexts/LocalizationContext";

interface UseTorrentActionsProps {
  onActionStart?: () => void;
  onActionSuccess?: () => void;
  torrents: WailsTorrent[];
}

export function useTorrentActions({
  onActionStart,
  onActionSuccess,
  torrents,
}: UseTorrentActionsProps) {
  const { showSuccess, showError, showInfo } = useNotification();
  const { t } = useLocalization();

  const getTorrentName = useCallback(
    (id: number): string => {
      const torrent = torrents.find((t) => t.ID === id);
      return torrent ? torrent.Name : `ID ${id}`;
    },
    [torrents]
  );

  const getTorrentNames = useCallback(
    (ids: number[]): string => {
      if (ids.length === 1) {
        return getTorrentName(ids[0]);
      }
      return t("torrents.selected", {
        0: String(ids.length), // Convert to string
        1: String(ids.length), // Convert to string
      });
    },
    [getTorrentName, t]
  );

  const addTorrent = useCallback(
    async (url: string, downloadDir: string = ""): Promise<boolean> => {
      onActionStart?.();
      try {
        await GoAddTorrent(url, downloadDir);
        showSuccess(
          "notifications.addTorrentSuccessTitle",
          "notifications.addTorrentSuccessMessage",
          { name: "New" }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error("Failed to add torrent:", error);
        showError(
          "notifications.addTorrentErrorTitle",
          "notifications.addTorrentErrorMessage",
          { error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError]
  );

  const addTorrentFile = useCallback(
    async (
      base64Content: string,
      downloadDir: string = ""
    ): Promise<boolean> => {
      onActionStart?.();
      try {
        await GoAddTorrentFile(base64Content, downloadDir);
        showSuccess(
          "notifications.addTorrentSuccessTitle",
          "notifications.addTorrentSuccessMessage",
          { name: "New" }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error("Failed to add torrent file:", error);
        showError(
          "notifications.addTorrentErrorTitle",
          "notifications.addTorrentErrorMessage",
          { error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError]
  );

  const removeTorrent = useCallback(
    async (id: number, deleteData: boolean): Promise<boolean> => {
      onActionStart?.();
      const name = getTorrentName(id);
      try {
        await GoRemoveTorrent(id, deleteData);
        showSuccess(
          "notifications.removeTorrentSuccessTitle",
          "notifications.removeTorrentSuccessMessage",
          { name }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to remove torrent ${id}:`, error);
        showError(
          "notifications.removeTorrentErrorTitle",
          "notifications.removeTorrentErrorMessage",
          { name, error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError, getTorrentName]
  );

  const startTorrents = useCallback(
    async (ids: number[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      onActionStart?.();
      const name = getTorrentNames(ids);
      try {
        await GoStartTorrents(ids);
        showSuccess(
          "notifications.startTorrentSuccessTitle",
          "notifications.startTorrentSuccessMessage",
          { name }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to start torrents ${ids.join(", ")}:`, error);
        showError(
          "notifications.startTorrentErrorTitle",
          "notifications.startTorrentErrorMessage",
          { name, error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError, getTorrentNames]
  );

  const stopTorrents = useCallback(
    async (ids: number[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      onActionStart?.();
      const name = getTorrentNames(ids);
      try {
        await GoStopTorrents(ids);
        showSuccess(
          "notifications.stopTorrentSuccessTitle",
          "notifications.stopTorrentSuccessMessage",
          { name }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to stop torrents ${ids.join(", ")}:`, error);
        showError(
          "notifications.stopTorrentErrorTitle",
          "notifications.stopTorrentErrorMessage",
          { name, error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError, getTorrentNames]
  );

  const setSpeedLimit = useCallback(
    async (ids: number[], isSlowMode: boolean): Promise<boolean> => {
      if (ids.length === 0) return true;
      onActionStart?.();
      const name = getTorrentNames(ids);
      try {
        await GoSetTorrentSpeedLimit(ids, isSlowMode);
        const messageKey = isSlowMode
          ? "notifications.setSpeedLimitSlowSuccessMessage"
          : "notifications.setSpeedLimitNormalSuccessMessage";
        showSuccess("notifications.setSpeedLimitSuccessTitle", messageKey, {
          name,
        });
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(
          `Failed to set speed limit for ${ids.join(", ")}:`,
          error
        );
        showError(
          "notifications.setSpeedLimitErrorTitle",
          "notifications.setSpeedLimitErrorMessage",
          { name, error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showSuccess, showError, getTorrentNames]
  );

  const verifyTorrent = useCallback(
    async (id: number): Promise<boolean> => {
      onActionStart?.();
      const name = getTorrentName(id);
      try {
        await GoVerifyTorrent(id);
        showInfo(
          "notifications.verifyTorrentSuccessTitle",
          "notifications.verifyTorrentSuccessMessage",
          { name }
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to verify torrent ${id}:`, error);
        showError(
          "notifications.verifyTorrentErrorTitle",
          "notifications.verifyTorrentErrorMessage",
          { name, error: String(error) }
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showInfo, showError, getTorrentName]
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
