import React, { useState, useEffect } from "react";
import { useLocalization } from "../contexts/LocalizationContext";
import { Button } from "./Button";
import { ArrowPathIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import styled from "@emotion/styled";
import styles from "../styles/TorrentContent.module.css";
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
}

// Styled components
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-primary);
  z-index: 1000;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const FileTree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FileNode = styled.div<{ depth: number; isDirectory: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: var(--background-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  margin-left: ${props => props.depth * 20}px;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;

  &:hover {
    color: var(--accent-color);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Checkbox = styled.input`
  margin-right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const FileName = styled.span`
  flex: 1;
`;

const FileProgress = styled.div<{ progress: number }>`
  width: 100px;
  height: 4px;
  background-color: var(--background-tertiary);
  border-radius: 2px;
  margin: 0 12px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${(props) => props.progress}%;
    background-color: var(--accent-color);
    border-radius: 2px;
  }
`;

const FileSize = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-left: 8px;
`;

const createFileNode = (file: TorrentFile, path: string, isLast: boolean): FileNode => ({
  ID: isLast ? file.ID : -1,
  Name: path.split('/').pop() ?? '',
  Path: path,
  Size: isLast ? file.Size : 0,
  Progress: isLast ? file.Progress : 0,
  Wanted: isLast ? file.Wanted : true,
  isDirectory: !isLast,
  children: !isLast ? [] : undefined,
  expanded: true
});

const updateNodeStats = (node: FileNode, size: number, progress: number): void => {
  node.Size = (node.Size || 0) + size;
  node.Progress = (node.Progress || 0) + progress;
};

const processTreeNodes = (nodes: FileNode[]): FileNode[] => {
  return nodes.map(node => {
    const newNode = { ...node };
    if (newNode.children?.length) {
      newNode.children = processTreeNodes(newNode.children);
      const childProgress = newNode.children.reduce((sum, child) => sum + child.Progress, 0);
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

const updateNodesWanted = (nodes: FileNode[], targetNode: FileNode, wanted: boolean, fileIds: number[]): FileNode[] => {
  return nodes.map(node => {
    const newNode = { ...node };
    if (node === targetNode || 
        (node.isDirectory && targetNode.isDirectory && node.Path.startsWith(targetNode.Path)) || 
        fileIds.includes(node.ID)) {
      newNode.Wanted = wanted;
    }
    if (node.children) {
      newNode.children = updateNodesWanted(node.children, targetNode, wanted, fileIds);
    }
    return newNode;
  });
};

const formatFileSize = (size: number): string => {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

export const TorrentContent: React.FC<TorrentContentProps> = ({ id, name, onClose }) => {
  const { t } = useLocalization();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allChecked, setAllChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState(false);

  const buildFileTree = (files: TorrentFile[]): FileNode[] => {
    const root: { [key: string]: FileNode } = {};
    
    files.forEach(file => {
      const parts = file.Path.split('/');
      let currentPath = '';
      let currentNode = root;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = i === parts.length - 1;
        
        if (!currentNode[currentPath]) {
          currentNode[currentPath] = createFileNode(file, currentPath, isLast);
        }
        
        if (!isLast) {
          const parentNode = currentNode[currentPath];
          if (parentNode.children) {
            const nodeMap: { [key: string]: FileNode } = {};
            parentNode.children.forEach(child => {
              nodeMap[child.Path] = child;
            });
            currentNode = nodeMap;
          }
          
          if (file.Size) {
            updateNodeStats(parentNode, file.Size, file.Progress);
          }
        }
      }
    });

    return processTreeNodes(Object.values(root));
  };

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
      return nodes.map(n => {
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
      nodes.forEach(node => {
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
        return nodes.map(node => ({
          ...node,
          Wanted: newWanted,
          children: node.children ? updateAllNodes(node.children) : undefined
        }));
      };
      
      setFileTree(prev => {
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
      <FileNode key={node.Path} depth={depth} isDirectory={!!node.isDirectory}>
        {node.isDirectory && (
          <ExpandButton onClick={() => toggleExpand(node)}>
            {node.expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </ExpandButton>
        )}
        <Checkbox
          type="checkbox"
          checked={node.Wanted}
          onChange={(e) => toggleNode(node, e.target.checked)}
        />
        <FileName>{node.Name}</FileName>
        <FileProgress progress={node.Progress} />
        <FileSize>{formatFileSize(node.Size)}</FileSize>
        
        {node.isDirectory && node.expanded && node.children && (
          <FileTree>
            {node.children.map(child => renderFileNode(child, depth + 1))}
          </FileTree>
        )}
      </FileNode>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles["loading-container"]}>
          <ArrowPathIcon className={styles["loading-spinner"]} />
          <div className={styles["loading-text"]}>{t("torrent.loadingFiles")}</div>
        </div>
      );
    }

    if (error) {
      return <div className={styles["error-message"]}>{error}</div>;
    }

    return (
      <div>
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center" }}>
          <Checkbox
            type="checkbox"
            checked={allChecked}
            ref={el => {
              if (el) {
                el.indeterminate = indeterminate;
              }
            }}
            onChange={toggleAll}
          />
          <span style={{ marginLeft: "8px", color: "var(--text-primary)" }}>
            {t("torrent.selectAll")}
          </span>
        </div>
        <FileTree>
          {fileTree.map(node => renderFileNode(node))}
        </FileTree>
      </div>
    );
  };

  useEffect(() => {
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
  }, [id]);

  return (
    <Container>
      <Header>
        <Title>{name}</Title>
        <Button variant="icon" onClick={onClose} aria-label={t("common.close")}>
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </Header>
      <Content>
        {renderContent()}
      </Content>
    </Container>
  );
};