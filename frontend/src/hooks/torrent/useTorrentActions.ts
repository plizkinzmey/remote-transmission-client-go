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
  const { showFormatted } = useNotification();
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
        showFormatted(
          t("notifications.addTorrentSuccessTitle"),
          "notifications.addTorrentSuccessMessage",
          { name: "New" },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error("Failed to add torrent:", error);
        showFormatted(
          t("notifications.addTorrentErrorTitle"),
          "notifications.addTorrentErrorMessage",
          { error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t]
  );

  const addTorrentFile = useCallback(
    async (
      base64Content: string,
      downloadDir: string = ""
    ): Promise<boolean> => {
      onActionStart?.();
      try {
        await GoAddTorrentFile(base64Content, downloadDir);
        showFormatted(
          t("notifications.addTorrentSuccessTitle"),
          "notifications.addTorrentSuccessMessage",
          { name: "New" },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error("Failed to add torrent file:", error);
        showFormatted(
          t("notifications.addTorrentErrorTitle"),
          "notifications.addTorrentErrorMessage",
          { error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t]
  );

  const removeTorrent = useCallback(
    async (id: number, deleteData: boolean): Promise<boolean> => {
      onActionStart?.();
      const name = getTorrentName(id);
      try {
        await GoRemoveTorrent(id, deleteData);
        showFormatted(
          t("notifications.removeTorrentSuccessTitle"),
          "notifications.removeTorrentSuccessMessage",
          { name },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to remove torrent ${id}:`, error);
        showFormatted(
          t("notifications.removeTorrentErrorTitle"),
          "notifications.removeTorrentErrorMessage",
          { name, error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t, getTorrentName]
  );

  const startTorrents = useCallback(
    async (ids: number[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      onActionStart?.();
      const name = getTorrentNames(ids);
      try {
        await GoStartTorrents(ids);
        showFormatted(
          t("notifications.startTorrentSuccessTitle"),
          "notifications.startTorrentSuccessMessage",
          { name },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to start torrents ${ids.join(", ")}:`, error);
        showFormatted(
          t("notifications.startTorrentErrorTitle"),
          "notifications.startTorrentErrorMessage",
          { name, error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t, getTorrentNames]
  );

  const stopTorrents = useCallback(
    async (ids: number[]): Promise<boolean> => {
      if (ids.length === 0) return true;
      onActionStart?.();
      const name = getTorrentNames(ids);
      try {
        await GoStopTorrents(ids);
        showFormatted(
          t("notifications.stopTorrentSuccessTitle"),
          "notifications.stopTorrentSuccessMessage",
          { name },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to stop torrents ${ids.join(", ")}:`, error);
        showFormatted(
          t("notifications.stopTorrentErrorTitle"),
          "notifications.stopTorrentErrorMessage",
          { name, error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t, getTorrentNames]
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
        showFormatted(
          t("notifications.setSpeedLimitSuccessTitle"),
          messageKey,
          { name },
          "success"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(
          `Failed to set speed limit for ${ids.join(", ")}:`,
          error
        );
        showFormatted(
          t("notifications.setSpeedLimitErrorTitle"),
          "notifications.setSpeedLimitErrorMessage",
          { name, error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t, getTorrentNames]
  );

  const verifyTorrent = useCallback(
    async (id: number): Promise<boolean> => {
      onActionStart?.();
      const name = getTorrentName(id);
      try {
        await GoVerifyTorrent(id);
        showFormatted(
          t("notifications.verifyTorrentSuccessTitle"),
          "notifications.verifyTorrentSuccessMessage",
          { name },
          "info"
        );
        onActionSuccess?.();
        return true;
      } catch (error) {
        console.error(`Failed to verify torrent ${id}:`, error);
        showFormatted(
          t("notifications.verifyTorrentErrorTitle"),
          "notifications.verifyTorrentErrorMessage",
          { name, error: String(error) },
          "error"
        );
        return false;
      }
    },
    [onActionStart, onActionSuccess, showFormatted, t, getTorrentName]
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
