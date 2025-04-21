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
    // eslint-disable-next-line no-console
    console.log(
      "HOOK DEBUG: updateAllCheckedState called with nodes:",
      JSON.stringify(nodes).substring(0, 100) + "..."
    ); // Лог входных данных (обрезанный)
    let allFilesWanted = true;
    let anyFileWanted = false;
    let hasFiles = false; // Флаг, что в дереве вообще есть файлы

    const checkNode = (node: FileNode): void => {
      if (node.isDirectory) {
        if (node.children) {
          node.children.forEach(checkNode);
        }
      } else {
        hasFiles = true;
        if (node.Wanted) {
          anyFileWanted = true;
        } else {
          allFilesWanted = false;
        }
      }
    };

    nodes.forEach(checkNode);

    // eslint-disable-next-line no-console
    console.log(
      `HOOK DEBUG: updateAllCheckedState - hasFiles: ${hasFiles}, anyFileWanted: ${anyFileWanted}, allFilesWanted: ${allFilesWanted}`
    );

    if (!hasFiles) {
      // eslint-disable-next-line no-console
      console.log(
        "HOOK DEBUG: updateAllCheckedState - No files found, setting allChecked=true, indeterminate=false"
      );
      setAllChecked(true);
      setIndeterminate(false);
      return;
    }

    const newAllChecked = allFilesWanted;
    const newIndeterminate = anyFileWanted && !allFilesWanted;
    // eslint-disable-next-line no-console
    console.log(
      `HOOK DEBUG: updateAllCheckedState - Setting allChecked=${newAllChecked}, indeterminate=${newIndeterminate}`
    );
    setAllChecked(newAllChecked);
    setIndeterminate(newIndeterminate);
  }, []);

  /**
   * Загружает файлы торрента
   */
  const loadFiles = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log("HOOK DEBUG: loadFiles started");
    try {
      setLoading(true);
      setError(null);
      const data = await GetTorrentFiles(torrentId);
      // eslint-disable-next-line no-console
      console.log("HOOK DEBUG: GetTorrentFiles returned", JSON.stringify(data));
      const tree = buildFileTree(data);
      // eslint-disable-next-line no-console
      console.log(
        "HOOK DEBUG: buildFileTree returned",
        JSON.stringify(tree).substring(0, 100) + "..."
      ); // Лог дерева (обрезанный)
      setFileTree(tree);
      updateAllCheckedState(tree); // Вызываем обновление состояния
      // eslint-disable-next-line no-console
      console.log(
        "HOOK DEBUG: loadFiles - setFileTree and updateAllCheckedState called"
      );
    } catch (err) {
      console.error("Failed to load torrent files:", err);
      setError(t("errors.failedToLoadFiles", String(err)));
    } finally {
      setLoading(false);
      // eslint-disable-next-line no-console
      console.log("HOOK DEBUG: loadFiles finished, setLoading(false)");
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
    // eslint-disable-next-line no-console
    console.log(
      `HOOK DEBUG: toggleAll started - initial indeterminate: ${indeterminate}, allChecked: ${allChecked}`
    );
    const newWanted = indeterminate || !allChecked;
    const allFiles: number[] = [];

    const collectAllFiles = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (!node.isDirectory && node.ID !== undefined && node.ID >= 0) {
          allFiles.push(node.ID);
        } else if (node.children) {
          collectAllFiles(node.children);
        }
      });
    };

    collectAllFiles(fileTree);
    // eslint-disable-next-line no-console
    console.log(
      `HOOK DEBUG: toggleAll - collected files: ${JSON.stringify(
        allFiles
      )}, calculated newWanted: ${newWanted}`
    );

    if (allFiles.length === 0) {
      console.warn("toggleAll called with no files to toggle.");
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `HOOK DEBUG: toggleAll - Calling SetFilesWanted with: torrentId=${torrentId}, files=${JSON.stringify(
        allFiles
      )}, wanted=${newWanted}`
    );

    try {
      await SetFilesWanted(torrentId, allFiles, newWanted);
      // eslint-disable-next-line no-console
      console.log("HOOK DEBUG: toggleAll - SetFilesWanted successful");
      const updateAllNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => ({
          ...node,
          Wanted: newWanted,
          indeterminate: node.isDirectory ? false : undefined,
          children: node.children ? updateAllNodes(node.children) : undefined,
        }));
      };

      setFileTree((prev) => {
        // eslint-disable-next-line no-console
        console.log("HOOK DEBUG: toggleAll - Updating fileTree state");
        const newTree = updateAllNodes(prev);
        updateAllCheckedState(newTree); // Пересчитываем состояние
        // eslint-disable-next-line no-console
        console.log(
          "HOOK DEBUG: toggleAll - fileTree state updated, updateAllCheckedState called"
        );
        return newTree;
      });
      setError(null);
    } catch (err) {
      console.error("Failed to update files:", err);
      setError(t("errors.failedToUpdateFiles", String(err)));
      // eslint-disable-next-line no-console
      console.log("HOOK DEBUG: toggleAll - SetFilesWanted failed", err);
    }
  }, [
    torrentId,
    fileTree,
    allChecked,
    indeterminate,
    t,
    updateAllCheckedState,
  ]);

  /**
   * Переключает состояние развертывания узла
   */
  const toggleExpand = useCallback((node: FileNode) => {
    // Не делаем ничего, если узел не является директорией
    if (!node.isDirectory) {
      return;
    }

    const toggleNodeExpanded = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((n) => {
        // Добавляем проверку на isDirectory здесь тоже, на всякий случай,
        // хотя основная проверка выше должна предотвратить вызов для файлов.
        if (n === node && n.isDirectory) {
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
