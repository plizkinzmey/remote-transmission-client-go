import { useState, useMemo } from "react";
import { TorrentData } from "../components/TorrentList";
import { StatusType } from "../utils/torrentStatus";

/**
 * Хук для управления фильтрацией торрентов
 */
export const useFilteredTorrents = (torrents: TorrentData[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "slow" | null>(
    null
  );

  // Фильтрация торрентов по поисковому запросу и статусу
  const filteredTorrents = useMemo(() => {
    return torrents.filter((torrent) => {
      const matchesSearch = torrent.Name.toLowerCase().includes(
        searchTerm.toLowerCase()
      );
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "slow"
          ? torrent.IsSlowMode
          : statusFilter === "queued"
          ? ["queued", "queuedCheck", "queuedDownload"].includes(torrent.Status)
          : torrent.Status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [torrents, searchTerm, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredTorrents,
  };
};
