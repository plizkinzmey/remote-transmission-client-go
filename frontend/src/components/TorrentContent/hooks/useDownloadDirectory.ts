import { useState, useEffect, useCallback } from "react";
import { GetTorrentDownloadDirectory } from "@wailsjs/go/main/App";

/**
 * Хук для получения директории загрузки торрента
 *
 * @param torrentId - ID торрента
 * @returns Объект с данными о директории загрузки
 */
export const useDownloadDirectory = (torrentId: number) => {
  const [downloadDir, setDownloadDir] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает директорию загрузки торрента
   */
  const loadDownloadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const directory = await GetTorrentDownloadDirectory(torrentId);
      setDownloadDir(directory);
      setError(null);
    } catch (err) {
      console.error("Failed to load torrent download directory:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [torrentId]);

  // Загружаем директорию при монтировании компонента
  useEffect(() => {
    loadDownloadDirectory();
  }, [loadDownloadDirectory]);

  return {
    downloadDir,
    loading,
    error,
    loadDownloadDirectory,
  };
};
