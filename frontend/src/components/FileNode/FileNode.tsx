import React from "react";
import { Box, Flex, Text, IconButton, Checkbox } from "@radix-ui/themes";
import { ChevronDownIcon, FolderIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { FileNode as FileNodeType } from "../../types/FileTree";
import { formatFileSize } from "../../utils/fileTree/formatFileSize";
import styles from "./FileNode.module.css";

export interface FileNodeProps {
    /** Данные узла для отображения */
    node: FileNodeType;
    /** Уровень вложенности узла */
    depth?: number;
    /** Обработчик переключения состояния выбора узла */
    onToggleWanted: (node: FileNodeType, wanted: boolean) => void;
    /** Обработчик переключения свёрнутости узла */
    onToggleExpand: (node: FileNodeType) => void;
}

/**
 * Компонент для отображения узла в дереве файлов торрента
 */
export const FileNode: React.FC<FileNodeProps> = ({
    node,
    depth = 0,
    onToggleWanted,
    onToggleExpand,
}) => {
    const handleCheckboxChange = (checked: boolean) => {
        onToggleWanted(node, checked);
    };

    return (
        <Box
            className={styles.fileNode}
            style={{
                marginLeft: `${depth * 24}px`,
            }}
            data-testid={`file-node-${node.Path}`}
        >
            <Flex className={styles.fileNodeContent}>
                {node.isDirectory ? (
                    <Box className={styles.iconContainer}>
                        <IconButton
                            size="1"
                            variant="ghost"
                            onClick={() => onToggleExpand(node)}
                            aria-label={node.expanded ? "Свернуть" : "Развернуть"}
                            style={{
                                transform: node.expanded ? "rotate(0deg)" : "rotate(-90deg)",
                                transition: "transform 0.2s",
                            }}
                            data-testid={`expand-button-${node.Path}`}
                        >
                            <ChevronDownIcon width={16} height={16} />
                        </IconButton>
                    </Box>
                ) : (
                    <Box className={styles.iconContainer} />
                )}

                <Box className={styles.iconContainer}>
                    {node.isDirectory ? (
                        <FolderIcon width={20} height={20} className={styles.folderIcon} />
                    ) : (
                        <DocumentIcon width={20} height={20} className={styles.fileIcon} />
                    )}
                </Box>

                <Flex className={styles.nameContainer}>
                    <Box style={{ display: "flex", alignItems: "center" }}>
                        <Checkbox
                            checked={node.Wanted}
                            onCheckedChange={handleCheckboxChange}
                            ref={(el) => {
                                if (el) {
                                    // Поскольку Radix UI Checkbox использует button, а не input,
                                    // мы должны вернуться к использованию CSS класса
                                    if (node.indeterminate) {
                                        el.classList.add("indeterminate-checkbox");
                                    } else {
                                        el.classList.remove("indeterminate-checkbox");
                                    }
                                }
                            }}
                            className={node.indeterminate ? "indeterminate-checkbox" : ""}
                            data-testid={`checkbox-${node.Path}`}
                        />
                    </Box>

                    <Text
                        size="1"
                        className={styles.fileName}
                        title={node.Name}
                        data-testid={`name-${node.Path}`}
                    >
                        {node.Name}
                    </Text>
                </Flex>

                <Box className={styles.progressContainer}>
                    <Box className={styles.progressBar}>
                        <Box
                            className={styles.progressFill}
                            style={{ width: `${node.Progress ?? 0}%` }}
                            data-testid={`progress-${node.Path}`}
                        />
                    </Box>
                </Box>

                <Text
                    size="1"
                    color="gray"
                    className={styles.sizeText}
                    data-testid={`size-${node.Path}`}
                >
                    {formatFileSize(node.Size)}
                </Text>
            </Flex>

            {node.isDirectory && node.children && node.expanded && (
                <Box>
                    {node.children.map((child) => (
                        <FileNode
                            key={child.ID} // Используем ID вместо Path для уникального ключа
                            node={child}
                            depth={depth + 1}
                            onToggleWanted={onToggleWanted}
                            onToggleExpand={onToggleExpand}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};