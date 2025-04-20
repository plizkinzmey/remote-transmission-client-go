import React, { useEffect } from "react";
import { Box, Text, ScrollArea, Dialog } from "@radix-ui/themes";
import { useLocalization } from "@contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { TorrentContentHeader } from "../TorrentContentHeader";
import { DownloadDirectoryInfo } from "../DownloadDirectoryInfo";
import { SelectAllFiles } from "../SelectAllFiles";
import { FileNode as FileNodeComponent } from "../FileNode";
import { useTorrentFiles } from "../../hooks/useTorrentFiles";
import { useDownloadDirectory } from "../../hooks/useDownloadDirectory";
import styles from "./TorrentContent.module.css";

export interface TorrentContentProps {
    /** ID торрента */
    id: number;
    /** Название торрента */
    name: string;
    /** Управляет видимостью диалога */
    open: boolean;
    /** Обработчик закрытия диалога */
    onClose: () => void;
}

/**
 * Компонент для отображения содержимого торрента
 * Показывает дерево файлов и директорий торрента с возможностью выбора файлов для загрузки
 */
export const TorrentContent: React.FC<TorrentContentProps> = ({
    id,
    name,
    open,
    onClose,
}) => {
    const { t } = useLocalization();
    const {
        fileTree,
        loading: filesLoading,
        error: filesError,
        allChecked,
        indeterminate,
        toggleNode,
        toggleAll,
        toggleExpand,
    } = useTorrentFiles(id);

    const {
        downloadDir,
    } = useDownloadDirectory(id);

    // Блокируем прокрутку основного содержимого при открытом окне
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "";
            };
        } else {
            document.body.style.overflow = "";
        }
    }, [open]);

    // Рендеринг содержимого диалога в зависимости от состояния загрузки и наличия ошибок
    const renderContent = () => {
        if (filesLoading) {
            return (
                <div className={styles.loadingContainer} data-testid="files-loading">
                    <LoadingSpinner size="large" />
                    <Text size="2" color="gray" className={styles.loadingText}>
                        {t("torrent.loadingFiles")}
                    </Text>
                </div>
            );
        }

        if (filesError) {
            return (
                <Box className={styles.errorContainer} data-testid="files-error">
                    <Text>{filesError}</Text>
                </Box>
            );
        }

        return (
            <div className={styles.fileListContainer} data-testid="file-list-container">
                <SelectAllFiles
                    allChecked={allChecked}
                    indeterminate={indeterminate}
                    onToggleAll={toggleAll}
                />

                <Box>
                    {fileTree.map((node) => (
                        <FileNodeComponent
                            key={node.Path}
                            node={node}
                            onToggleWanted={toggleNode}
                            onToggleExpand={toggleExpand}
                        />
                    ))}
                </Box>
            </div>
        );
    };

    return (
        <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <Dialog.Content
                className={`torrent-content-overlay ${styles.dialogContent}`}
                data-testid="torrent-content-dialog"
            >
                <TorrentContentHeader torrentName={name} onClose={onClose} />

                {downloadDir && <DownloadDirectoryInfo path={downloadDir} />}

                <Box className={styles.contentArea}>
                    <ScrollArea className={styles.scrollArea} scrollbars="both">
                        {renderContent()}
                    </ScrollArea>
                </Box>
            </Dialog.Content>
        </Dialog.Root>
    );
};