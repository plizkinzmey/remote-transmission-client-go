import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  ScrollArea,
  IconButton,
  Checkbox as RadixCheckbox,
} from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  XMarkIcon,
  ChevronDownIcon,
  FolderIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import { GetTorrentFiles, SetFilesWanted } from "../../wailsjs/go/main/App";

interface TorrentContentProps {
  id: number;
  name: string;
  onClose: () => void;
}

interface TorrentFile {
  ID: number;
  Name: string;
  Path: string;
  Size: number;
  Progress: number;
  Wanted: boolean;
}

interface FileNode {
  ID: number;
  Name: string;
  Path: string;
  Size: number;
  Progress: number;
  Wanted: boolean;
  isDirectory?: boolean;
  children?: FileNode[];
  parent?: FileNode;
  expanded?: boolean;
  indeterminate?: boolean; // Добавляем новое свойство
}

const processTreeNodes = (nodes: FileNode[]): FileNode[] => {
  return nodes.map((node) => {
    const newNode = { ...node };
    if (newNode.children?.length) {
      newNode.children = processTreeNodes(newNode.children);
      const childProgress = newNode.children.reduce(
        (sum, child) => sum + child.Progress,
        0
      );
      newNode.Progress = childProgress / newNode.children.length;
    }
    return newNode;
  });
};

const collectFileIds = (node: FileNode): number[] => {
  if (!node.isDirectory && node.ID >= 0) {
    return [node.ID];
  }
  if (node.children) {
    return node.children.flatMap(collectFileIds);
  }
  return [];
};

const updateNodesWanted = (
  nodes: FileNode[],
  targetNode: FileNode,
  wanted: boolean,
  fileIds: number[]
): FileNode[] => {
  return nodes.map((node) => {
    const newNode = { ...node };
    if (
      node === targetNode ||
      (node.isDirectory &&
        targetNode.isDirectory &&
        node.Path.startsWith(targetNode.Path)) ||
      fileIds.includes(node.ID)
    ) {
      newNode.Wanted = wanted;
    }
    if (node.children) {
      newNode.children = updateNodesWanted(
        node.children,
        targetNode,
        wanted,
        fileIds
      );
    }
    return newNode;
  });
};

const formatFileSize = (size: number | undefined): string => {
  // Проверка на undefined или отрицательные значения
  if (size === undefined || size < 0) {
    return "0.00 B";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// Вспомогательная функция для создания узла дерева
const createNodeForPath = (
  file: TorrentFile,
  partName: string,
  fullPath: string,
  isFile: boolean
): FileNode => {
  return {
    ID: isFile ? file.ID : -1,
    Name: partName,
    Path: fullPath,
    Size: isFile ? file.Size : 0,
    Progress: isFile ? file.Progress : 0,
    Wanted: isFile ? file.Wanted : false, // Изменяем на false для каталогов
    isDirectory: !isFile,
    children: !isFile ? [] : undefined,
    expanded: false, // Меняем на false, чтобы каталоги были свернуты
  };
};

// Вспомогательная функция для добавления узла к родителю
const addNodeToParent = (
  root: { [path: string]: FileNode },
  node: FileNode,
  parentPath: string
): void => {
  const parentNode = root[parentPath];
  if (parentNode?.children) {
    parentNode.children.push(node);
  }
};

// Изменяем функцию calculateDirStats, чтобы она также вычисляла Wanted для каталогов
const calculateDirStats = (
  node: FileNode
): {
  size: number;
  progressSum: number;
  count: number;
  allWanted: boolean;
  anyWanted: boolean;
} => {
  if (!node.isDirectory || !node.children?.length) {
    return {
      size: node.Size || 0,
      progressSum: node.Progress || 0,
      count: 1,
      allWanted: node.Wanted,
      anyWanted: node.Wanted,
    };
  }

  const stats = node.children.map(calculateDirStats);
  const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
  const totalProgressSum = stats.reduce(
    (sum, s) => sum + s.progressSum * s.count,
    0
  );
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  const allWanted = stats.every((s) => s.allWanted);
  const anyWanted = stats.some((s) => s.anyWanted);

  node.Size = totalSize;
  node.Progress = totalCount > 0 ? totalProgressSum / totalCount : 0;
  node.Wanted = allWanted; // Устанавливаем Wanted для каталога на основе вложенных файлов
  node.indeterminate = anyWanted && !allWanted; // Устанавливаем промежуточное состояние

  return {
    size: totalSize,
    progressSum: node.Progress,
    count: totalCount,
    allWanted,
    anyWanted,
  };
};

const buildFileTree = (files: TorrentFile[]): FileNode[] => {
  const root: { [path: string]: FileNode } = {};

  // Сначала сортируем файлы для более логичного отображения
  const sortedFiles = [...files].sort((a, b) => a.Path.localeCompare(b.Path));

  // Создаем узлы дерева для всех файлов и директорий
  sortedFiles.forEach((file) => {
    const pathParts = file.Path.split("/");
    let fullPath = "";

    // Создаем цепочку директорий для каждого файла
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;

      fullPath = fullPath ? `${fullPath}/${part}` : part;

      if (!root[fullPath]) {
        // Создаем узел для директории или файла
        const node = createNodeForPath(file, part, fullPath, isLastPart);
        root[fullPath] = node;

        // Добавляем узел к родительскому узлу, если это не корневой узел
        if (i > 0) {
          const parentPath = pathParts.slice(0, i).join("/");
          addNodeToParent(root, node, parentPath);
        }
      } else if (isLastPart) {
        // Если узел уже существует, но это конечный файл, обновляем его свойства
        const node = root[fullPath];
        node.ID = file.ID;
        node.Size = file.Size;
        node.Progress = file.Progress;
        node.Wanted = file.Wanted;
        node.isDirectory = false;
        node.children = undefined;
      }
    }
  });

  // Получаем только корневые узлы
  const rootNodes = Object.values(root).filter((node) => {
    const parentPath = node.Path.split("/").slice(0, -1).join("/");
    return parentPath === "" || !root[parentPath];
  });

  // Вычисляем статистику для всех директорий
  rootNodes.forEach(calculateDirStats);

  return rootNodes;
};

export const TorrentContent: React.FC<TorrentContentProps> = ({
  id,
  name,
  onClose,
}) => {
  const { t } = useLocalization();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allChecked, setAllChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState(false);

  const updateAllCheckedState = (nodes: FileNode[]): void => {
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
  };

  const toggleNode = async (node: FileNode, wanted: boolean): Promise<void> => {
    const fileIds = collectFileIds(node);

    if (fileIds.length > 0) {
      try {
        await SetFilesWanted(id, fileIds, wanted);
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
  };

  const toggleExpand = (node: FileNode) => {
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
  };

  const toggleAll = async () => {
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
      await SetFilesWanted(id, allFiles, newWanted);
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
  };

  const renderFileNode = (node: FileNode, depth: number = 0) => {
    return (
      <Box
        key={node.Path}
        style={{
          marginLeft: `${depth * 24}px`,
          marginBottom: "2px",
        }}
      >
        <Flex
          align="center"
          gap="2"
          style={{
            padding: "8px",
            borderRadius: "4px",
            backgroundColor: node.isDirectory
              ? "var(--tree-folder-bg)"
              : "transparent",
          }}
          className="file-node-content"
        >
          {node.isDirectory ? (
            <Box
              style={{
                width: "24px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <IconButton
                size="1"
                variant="ghost"
                onClick={() => toggleExpand(node)}
                aria-label={node.expanded ? "Свернуть" : "Развернуть"}
                style={{
                  transform: node.expanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.2s",
                }}
              >
                <ChevronDownIcon width={16} height={16} />
              </IconButton>
            </Box>
          ) : (
            <Box style={{ width: "24px" }} />
          )}

          <Box
            style={{
              width: "24px",
              display: "flex",
              justifyContent: "center",
              color: node.isDirectory
                ? "var(--text-primary)"
                : "var(--text-secondary)",
            }}
          >
            {node.isDirectory ? (
              <FolderIcon width={20} height={20} />
            ) : (
              <DocumentIcon width={20} height={20} />
            )}
          </Box>

          <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
            <Box style={{ display: "flex", alignItems: "center" }}>
              <RadixCheckbox
                checked={node.Wanted}
                onCheckedChange={(checked) => toggleNode(node, !!checked)}
                ref={(el) => {
                  if (el && node.indeterminate) {
                    // Используем класс для стилизации вместо прямого изменения style
                    el.classList.add("indeterminate-checkbox");
                  }
                }}
                className={node.indeterminate ? "indeterminate-checkbox" : ""}
              />
            </Box>

            <Text
              size="1"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
              title={node.Name}
            >
              {node.Name}
            </Text>
          </Flex>

          <Box style={{ width: "100px" }}>
            <Box
              style={{
                width: "100px",
                height: "4px",
                backgroundColor: "var(--tree-progress-bg)",
                borderRadius: "2px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${node.Progress ?? 0}%`,
                  backgroundColor: "var(--tree-progress-fill)",
                  borderRadius: "2px",
                }}
              />
            </Box>
          </Box>

          <Text
            size="1"
            color="gray"
            style={{ width: "100px", textAlign: "right", whiteSpace: "nowrap" }}
          >
            {formatFileSize(node.Size)}
          </Text>
        </Flex>

        {node.isDirectory && node.children && node.expanded && (
          <Box>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{ height: "100%" }}
        >
          <LoadingSpinner size="large" />
          <Text size="2" color="gray" style={{ marginTop: "16px" }}>
            {t("torrent.loadingFiles")}
          </Text>
        </Flex>
      );
    }

    if (error) {
      return (
        <Box
          style={{
            padding: "16px",
            borderRadius: "6px",
            backgroundColor: "var(--error-background)",
            color: "var(--error-color)",
          }}
        >
          <Text>{error}</Text>
        </Box>
      );
    }

    return (
      <Box>
        <Flex
          align="center"
          gap="2"
          style={{
            padding: "12px",
            borderRadius: "6px",
            backgroundColor: "var(--background-secondary)",
            marginBottom: "16px",
          }}
        >
          <RadixCheckbox
            checked={allChecked}
            onCheckedChange={toggleAll}
            ref={(el) => {
              if (el && indeterminate) {
                el.classList.add("indeterminate-checkbox");
              }
            }}
            className={indeterminate ? "indeterminate-checkbox" : ""}
          />
          <Text size="2">{t("torrent.selectAll")}</Text>
        </Flex>

        <Box>{fileTree.map((node) => renderFileNode(node))}</Box>
      </Box>
    );
  };

  useEffect(() => {
    // Добавляем CSS для стилизации индетерминированных чекбоксов
    if (!document.getElementById("indeterminate-checkbox-style")) {
      const style = document.createElement("style");
      style.id = "indeterminate-checkbox-style";
      style.textContent = `
        .indeterminate-checkbox [data-state="checked"] {
          background-color: var(--accent-color);
          opacity: 0.7;
        }
        .file-node-content:hover {
          background-color: var(--tree-file-hover);
        }
      `;
      document.head.appendChild(style);
    }

    const loadFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await GetTorrentFiles(id);
        const tree = buildFileTree(data);
        setFileTree(tree);
        updateAllCheckedState(tree);
      } catch (err) {
        console.error("Failed to load torrent files:", err);
        setError(t("errors.failedToLoadFiles", String(err)));
      } finally {
        setLoading(false);
      }
    };
    loadFiles();
  }, [id, t]);

  return (
    <Box
      position="fixed"
      top="0"
      bottom="0"
      left="0"
      right="0"
      style={{
        backgroundColor: "var(--background-primary)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Flex
        justify="between"
        align="center"
        px="5"
        py="3"
        style={{
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <Heading
          size="4"
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Heading>
        <IconButton
          variant="ghost"
          size="2"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <XMarkIcon width={20} height={20} />
        </IconButton>
      </Flex>

      <ScrollArea
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        {renderContent()}
      </ScrollArea>
    </Box>
  );
};
