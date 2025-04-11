import React from "react";
import { Text, Checkbox } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import styles from "./SelectAllFiles.module.css";

export interface SelectAllFilesProps {
    /** Флаг, что все файлы выбраны */
    allChecked: boolean;
    /** Флаг, что выбраны не все файлы (промежуточное состояние) */
    indeterminate: boolean;
    /** Обработчик переключения выбора всех файлов */
    onToggleAll: () => void;
}

/**
 * Компонент для выбора всех файлов в дереве торрента
 */
export const SelectAllFiles: React.FC<SelectAllFilesProps> = ({
    allChecked,
    indeterminate,
    onToggleAll,
}) => {
    const { t } = useLocalization();

    return (
        <div className={styles.container} data-testid="select-all-files">
            <Checkbox
                checked={allChecked}
                onCheckedChange={onToggleAll}
                ref={(el) => {
                    if (el && indeterminate) {
                        el.classList.add("indeterminate-checkbox");
                    }
                }}
                className={indeterminate ? "indeterminate-checkbox" : ""}
                data-testid="select-all-checkbox"
            />
            <Text size="2" data-testid="select-all-label">
                {t("torrent.selectAll")}
            </Text>
        </div>
    );
};