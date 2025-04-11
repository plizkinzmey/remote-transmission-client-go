import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useLocalization } from "../../contexts/LocalizationContext";
import styles from "./DownloadDirectoryInfo.module.css";

export interface DownloadDirectoryInfoProps {
    /** Путь к директории загрузки */
    path: string;
}

/**
 * Компонент для отображения информации о директории загрузки торрента
 */
export const DownloadDirectoryInfo: React.FC<DownloadDirectoryInfoProps> = ({
    path,
}) => {
    const { t } = useLocalization();

    // Не рендерим компонент, если путь пустой
    if (!path) {
        return null;
    }

    return (
        <div className={styles.container} data-testid="download-directory-info">
            <Flex align="center" gap="2">
                <FolderIcon width={16} height={16} />
                <Text size="2" color="gray">
                    {t("torrent.downloadDirectory", "Директория загрузки")}:
                </Text>
                <Text
                    size="2"
                    className={`selectable-text ${styles.pathText}`}
                    title={path}
                    data-testid="download-path"
                >
                    {path}
                </Text>
            </Flex>
        </div>
    );
};