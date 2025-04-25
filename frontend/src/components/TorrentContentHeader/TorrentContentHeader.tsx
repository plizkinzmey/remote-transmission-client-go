import React from "react";
import { Dialog, Heading, IconButton } from "@radix-ui/themes";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useLocalization } from "@contexts/LocalizationContext";
import styles from "./TorrentContentHeader.module.css";

export interface TorrentContentHeaderProps {
    /** Название торрента */
    torrentName: string;
    /** Обработчик закрытия диалога */
    onClose: () => void;
}

/**
 * Компонент заголовка модального окна содержимого торрента
 */
export const TorrentContentHeader: React.FC<TorrentContentHeaderProps> = ({
    torrentName,
    onClose,
}) => {
    const { t } = useLocalization();

    return (
        <div className={styles.header} data-testid="torrent-content-header">
            <Heading
                size="4"
                className={styles.title}
                title={torrentName}
                data-testid="torrent-title"
            >
                {torrentName}
            </Heading>
            <IconButton
                variant="ghost"
                size="2"
                onClick={onClose}
                aria-label={t("common.close")}
                data-testid="close-button"
            >
                <XMarkIcon width={20} height={20} />
            </IconButton>
        </div>
    );
};