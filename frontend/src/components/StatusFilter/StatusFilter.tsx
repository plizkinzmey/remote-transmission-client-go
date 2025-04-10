import React, { useCallback, useEffect, useMemo } from "react";
import { Button, Flex } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { StatusFilterProps, StatusOption } from "./types";
import styles from "./StatusFilter.module.css";

/**
 * Компонент фильтрации торрентов по статусам
 * Отображает ряд кнопок для фильтрации торрентов по их текущему состоянию
 */
export const StatusFilter: React.FC<StatusFilterProps> = ({
    selectedStatus,
    onStatusChange,
    hasNoTorrents,
    isReconnecting
}) => {
    const { t } = useLocalization();

    // Мемоизируем массив статусов
    const statuses = useMemo<StatusOption[]>(() => [
        { id: "downloading", label: "downloading", color: "blue" },
        { id: "seeding", label: "seeding", color: "grass" },
        { id: "stopped", label: "stopped", color: "gray" },
        { id: "checking", label: "checking", color: "amber" },
        {
            id: "queued",
            label: "queued",
            color: "purple",
            matchStatuses: ["queued", "queuedCheck", "queuedDownload"],
        },
        { id: "completed", label: "completed", color: "mint" },
        { id: "slow", label: "slow", color: "orange" },
    ], []);

    // Обработка сброса фильтра при переподключении
    useEffect(() => {
        if (isReconnecting && selectedStatus) {
            onStatusChange(null);
        }
    }, [isReconnecting, selectedStatus, onStatusChange]);

    // Мемоизируем обработчик клика по фильтру
    const handleFilterClick = useCallback((id: StatusOption["id"]) => {
        onStatusChange(selectedStatus === id ? null : id);
    }, [selectedStatus, onStatusChange]);

    return (
        <Flex
            className={styles.container}
            data-testid="status-filter-container"
        >
            {statuses.map(({ id, label, color }) => (
                <Button
                    key={id}
                    size="1"
                    color={color}
                    variant={selectedStatus === id ? "solid" : "soft"}
                    data-variant={selectedStatus === id ? "solid" : "soft"}
                    disabled={hasNoTorrents || isReconnecting}
                    onClick={() => handleFilterClick(id)}
                    className={styles.filterButton}
                    data-testid={`status-filter-button-${id}${selectedStatus === id ? "-active" : ""}`}
                    title={isReconnecting ? t("errors.needConnection") : undefined}
                >
                    {t(`filters.${label}`)}
                </Button>
            ))}
        </Flex>
    );
};