import { useState, useEffect, useCallback } from "react";
import { TorrentData } from "@/components/TorrentList";
import { useLocalization } from "@contexts/LocalizationContext";
import {
  StartTorrents,
  StopTorrents,
  RemoveTorrent,
  SetTorrentSpeedLimit,
} from "../../wailsjs/go/main/App";

interface BulkOperationsState {
  start: boolean;
  stop: boolean;
  remove: boolean;
  speedLimit: boolean;
}

interface Config {
  slowSpeedLimit: number;
  slowSpeedUnit: "KiB/s" | "MiB/s";
}

export function useBulkOperations(
  torrents: TorrentData[],
  selectedTorrents: Set<number>,
  refreshTorrents: () => Promise<void>,
  config: Config | undefined
): {
  bulkOperations: BulkOperationsState;
  error: string | null;
  handleStartSelected: () => Promise<void>;
  handleStopSelected: () => Promise<void>;
  handleRemoveSelected: (deleteData?: boolean) => Promise<void>;
  handleSetSpeedLimit: (isSlowMode: boolean) => Promise<void>;
} {
  const { t } = useLocalization();
  const [bulkOperations, setBulkOperations] = useState<BulkOperationsState>({
    start: false,
    stop: false,
    remove: false,
    speedLimit: false,
  });
  const [lastBulkAction, setLastBulkAction] = useState<
    "start" | "stop" | "remove" | "speedLimit" | null
  >(null);
  const [lastTorrentStates, setLastTorrentStates] = useState<
    Map<number, string>
  >(new Map());
  const [error, setError] = useState<string | null>(null);

  const isRunningTorrent = useCallback((status: string): boolean => {
    const isDownloading = status === "downloading";
    const isSeeding = status === "seeding";
    return isDownloading || isSeeding;
  }, []);

  // Effect for monitoring bulk operations
  useEffect(() => {
    if (!lastBulkAction || !(bulkOperations.start || bulkOperations.stop)) {
      return;
    }

    const selectedTorrentsArray = Array.from(selectedTorrents);

    const hasTorrentsToProcess = selectedTorrentsArray.some((id) => {
      const torrent = torrents.find((t) => t.ID === id);
      if (!torrent) return false;
      return lastBulkAction === "start"
        ? torrent.Status === "stopped"
        : isRunningTorrent(torrent.Status);
    });

    if (!hasTorrentsToProcess || selectedTorrentsArray.length === 0) {
      setBulkOperations((prev) => ({ ...prev, [lastBulkAction]: false }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
      return;
    }

    let shouldResetFlag = false;

    if (lastBulkAction === "start") {
      const allStarted = selectedTorrentsArray.every((id) => {
        const torrent = torrents.find((t) => t.ID === id);
        const previousState = lastTorrentStates.get(id);

        const isIrrelevantOrAlreadyDone =
          !torrent ||
          !previousState ||
          previousState === "downloading" ||
          previousState === "seeding";

        if (isIrrelevantOrAlreadyDone) return true;

        return (
          previousState !== torrent.Status &&
          (torrent.Status === "downloading" || torrent.Status === "seeding")
        );
      });
      shouldResetFlag = allStarted;
    } else if (lastBulkAction === "stop") {
      const allStopped = selectedTorrentsArray.every((id) => {
        const torrent = torrents.find((t) => t.ID === id);
        const previousState = lastTorrentStates.get(id);

        const isIrrelevantOrAlreadyDone =
          !torrent || !previousState || previousState === "stopped";

        if (isIrrelevantOrAlreadyDone) return true;

        return previousState !== torrent.Status && torrent.Status === "stopped";
      });
      shouldResetFlag = allStopped;
    }

    if (shouldResetFlag) {
      setBulkOperations((prev) => ({ ...prev, [lastBulkAction]: false }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [
    torrents,
    selectedTorrents,
    bulkOperations,
    lastBulkAction,
    lastTorrentStates,
    isRunningTorrent,
  ]);

  const handleStartSelected = useCallback(async () => {
    if (bulkOperations.start || selectedTorrents.size === 0) return;

    const torrentsToStart = torrents.filter(
      (t) =>
        selectedTorrents.has(t.ID) &&
        (t.Status === "stopped" || t.Status === "completed")
    );

    if (torrentsToStart.length === 0) return;

    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    setBulkOperations((prev: BulkOperationsState) => ({
      ...prev,
      start: true,
    }));
    setLastBulkAction("start");
    setLastTorrentStates(states);
    setError(null);

    try {
      const idsToStart = torrentsToStart.map((t) => Number(t.ID));
      console.log("Starting torrents with IDs:", idsToStart);
      await StartTorrents(idsToStart);
      await refreshTorrents();
    } catch (err) {
      console.error("Failed to start torrents:", err);
      setError(t("errors.failedToStartTorrents", String(err)));
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        start: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [bulkOperations.start, selectedTorrents, torrents, refreshTorrents, t]);

  const handleStopSelected = useCallback(async () => {
    if (bulkOperations.stop || selectedTorrents.size === 0) return;

    const torrentsToStop = torrents.filter(
      (t) =>
        selectedTorrents.has(t.ID) &&
        (t.Status === "downloading" || t.Status === "seeding")
    );

    if (torrentsToStop.length === 0) return;

    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    setBulkOperations((prev: BulkOperationsState) => ({
      ...prev,
      stop: true,
    }));
    setLastBulkAction("stop");
    setLastTorrentStates(states);
    setError(null);

    try {
      const idsToStop = torrentsToStop.map((t) => Number(t.ID));
      console.log("Stopping torrents with IDs:", idsToStop);
      await StopTorrents(idsToStop);
      await refreshTorrents();
    } catch (err) {
      console.error("Failed to stop torrents:", err);
      setError(t("errors.failedToStopTorrents", String(err)));
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        stop: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [bulkOperations.stop, selectedTorrents, torrents, refreshTorrents, t]);

  const handleRemoveSelected = useCallback(
    async (deleteData: boolean = false) => {
      if (bulkOperations.remove || selectedTorrents.size === 0) return;

      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        remove: true,
      }));
      setLastBulkAction("remove");
      setError(null);

      try {
        console.log(
          `Removing ${selectedTorrents.size} torrents, deleteData: ${deleteData}`
        );

        const idsToRemove = Array.from(selectedTorrents);

        for (const id of idsToRemove) {
          try {
            console.log(
              `Removing torrent ID: ${id}, deleteData: ${deleteData}`
            );
            await RemoveTorrent(Number(id), deleteData);
          } catch (singleError) {
            console.error(`Failed to remove torrent ${id}:`, singleError);
          }
        }

        await refreshTorrents();
      } catch (err) {
        console.error("Error in bulk remove operation:", err);
        setError(t("errors.failedToRemoveTorrents", String(err)));
      } finally {
        setBulkOperations((prev: BulkOperationsState) => ({
          ...prev,
          remove: false,
        }));
        setLastBulkAction(null);
      }
    },
    [bulkOperations.remove, selectedTorrents, refreshTorrents, t]
  );

  const handleSetSpeedLimit = useCallback(
    async (isSlowMode: boolean) => {
      if (bulkOperations.speedLimit || selectedTorrents.size === 0 || !config)
        return;

      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        speedLimit: true,
      }));
      setLastBulkAction("speedLimit");
      setError(null);

      try {
        console.log(
          `Setting speed limit (slow mode: ${isSlowMode}) for ${selectedTorrents.size} torrents`
        );

        const selectedIds = Array.from(selectedTorrents).map(Number);

        await SetTorrentSpeedLimit(selectedIds, isSlowMode);
        await refreshTorrents();
      } catch (err) {
        console.error("Failed to set speed limit:", err);
        setError(t("errors.failedToSetSpeedLimit", String(err)));
      } finally {
        setBulkOperations((prev: BulkOperationsState) => ({
          ...prev,
          speedLimit: false,
        }));
        setLastBulkAction(null);
      }
    },
    [bulkOperations.speedLimit, selectedTorrents, config, refreshTorrents, t]
  );

  return {
    bulkOperations,
    error,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  };
}
