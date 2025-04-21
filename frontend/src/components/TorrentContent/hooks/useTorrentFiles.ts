import { useState, useEffect, useCallback } from "react";
import { useLocalization } from "@contexts/LocalizationContext";
import { FileNode } from "types/FileTree"; // Corrected path based on baseUrl
import { GetTorrentFiles, SetFilesWanted } from "@wailsjs/go/main/App";
import { buildFileTree } from "@utils/fileTree/buildFileTree"; // Corrected path
import { collectFileIds } from "@utils/fileTree/collectFileIds"; // Corrected path
import { updateNodesWanted } from "@utils/fileTree/updateNodesWanted"; // Corrected path

/**
 * Хук для работы с файлами торрента
 *
 * @param torrentId - ID торрента
 * @returns Объект с данными и методами для работы с файлами торрента
 */
export const useTorrentFiles = (torrentId: number) => {
  const { t } = useLocalization();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allChecked, setAllChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState(false);

  /**
   * Обновляет состояние чекбоксов на основе дерева файлов
   */
  const updateAllCheckedState = useCallback((nodes: FileNode[]): void => {
    let allWanted = true;
    let anyWanted = false;

    const checkNode = (node: FileNode): void => {
      if (!node.children) {
        if (node.Wanted) anyWanted = true;
        else allWanted = false;
        return;
      }
      node.children.forEach(checkNode);
    };

    nodes.forEach(checkNode);
    setAllChecked(allWanted);
    setIndeterminate(anyWanted && !allWanted);
  }, []);

  /**
   * Загружает файлы торрента
   */
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetTorrentFiles(torrentId);
      const tree = buildFileTree(data);
      setFileTree(tree);
      updateAllCheckedState(tree);
    } catch (err) {
      console.error("Failed to load torrent files:", err);
      setError(t("errors.failedToLoadFiles", String(err)));
    } finally {
      setLoading(false);
    }
  }, [torrentId, t, updateAllCheckedState]);

  /**
   * Переключает состояние выбора узла
   */
  const toggleNode = useCallback(
    async (node: FileNode, wanted: boolean) => {
      const fileIds = collectFileIds(node);

      if (fileIds.length > 0) {
        try {
          await SetFilesWanted(torrentId, fileIds, wanted);
          setFileTree((prev: FileNode[]) => {
            const newTree = updateNodesWanted(prev, node, wanted, fileIds);
            updateAllCheckedState(newTree);
            return newTree;
          });
        } catch (err) {
          console.error("Failed to update file state:", err);
          setError(t("errors.failedToUpdateFile", String(err)));
        }
      }
    },
    [torrentId, t, updateAllCheckedState]
  );

  /**
   * Переключает состояние всех узлов
   */
  const toggleAll = useCallback(async () => {
    const newWanted = indeterminate || !allChecked;
    const allFiles: number[] = [];

    const collectAllFiles = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (!node.isDirectory && node.ID >= 0) {
          allFiles.push(node.ID);
        } else if (node.children) {
          collectAllFiles(node.children);
        }
      });
    };

    collectAllFiles(fileTree);

    try {
      await SetFilesWanted(torrentId, allFiles, newWanted);
      const updateAllNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => ({
          ...node,
          Wanted: newWanted,
          children: node.children ? updateAllNodes(node.children) : undefined,
        }));
      };

      setFileTree((prev) => {
        const newTree = updateAllNodes(prev);
        setAllChecked(newWanted);
        setIndeterminate(false);
        return newTree;
      });
    } catch (err) {
      console.error("Failed to update files:", err);
      setError(t("errors.failedToUpdateFiles", String(err)));
    }
  }, [torrentId, fileTree, allChecked, indeterminate, t]);

  /**
   * Переключает состояние развертывания узла
   */
  const toggleExpand = useCallback((node: FileNode) => {
    const toggleNodeExpanded = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        if (n === node) {
          return { ...n, expanded: !n.expanded };
        }
        if (n.children) {
          return { ...n, children: toggleNodeExpanded(n.children) };
        }
        return n;
      });
    };

    setFileTree((prev: FileNode[]) => toggleNodeExpanded(prev));
  }, []);

  // Загружаем файлы при монтировании компонента
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    fileTree,
    loading,
    error,
    allChecked,
    indeterminate,
    toggleNode,
    toggleAll,
    toggleExpand,
    loadFiles,
  };
};
