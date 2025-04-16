import React from "react";
import { TextField, Select, Flex, Text, Grid, Box } from "@radix-ui/themes";
import { ConnectionConfig } from "../../../App";
import { useLocalization } from "../../../contexts/LocalizationContext";
import styles from "./LimitsTab.module.css"; // Импорт стилей

/**
 * @interface LimitsTabProps
 * @property {ConnectionConfig} settings - Текущие настройки соединения (включая лимиты).
 * @property {(newSettings: Partial<ConnectionConfig>) => void} onSettingsChange - Колбэк для обновления настроек.
 * @property {{ [key: string]: string }} [errors] - Объект с ошибками валидации для полей.
 */
export interface LimitsTabProps {
    settings: ConnectionConfig;
    onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void;
    errors?: { [key: string]: string };
}

/**
 * Компонент вкладки настроек лимитов скорости и соотношения раздачи.
 *
 * @param {LimitsTabProps} props - Пропсы компонента.
 * @returns {React.ReactElement} - Элемент вкладки настроек лимитов.
 */
export const LimitsTab: React.FC<LimitsTabProps> = ({
    settings,
    onSettingsChange,
    errors = {},
}) => {
    const { t } = useLocalization();

    // Обработчик изменения максимального соотношения раздачи
    const handleMaxUploadRatioChange = (value: string) => {
        // Пустая строка или нечисловое значение преобразуется в 0
        const numValue = parseFloat(value);
        onSettingsChange({ maxUploadRatio: isNaN(numValue) ? 0 : numValue });
    };

    // Обработчик изменения лимита медленной скорости
    const handleSpeedLimitChange = (value: string) => {
        // Пустая строка или нечисловое значение преобразуется в 0
        const numValue = parseInt(value, 10);
        onSettingsChange({ slowSpeedLimit: isNaN(numValue) ? 0 : numValue });
    };

    return (
        <Grid columns="1" gap="3">
            <Flex direction="column" gap="2">
                <Text as="label" htmlFor="limits-max-upload-ratio-input" size="1" weight="medium">
                    {t("settings.maxUploadRatio")}
                </Text>
                {/* Используем класс из CSS-модуля */}
                <Box className={styles.inputMaxWidth}>
                    <TextField.Root
                        id="limits-max-upload-ratio-input"
                        data-testid="limits-max-upload-ratio-input"
                        size="1"
                        type="number"
                        placeholder="0"
                        // Используем || "" для обработки null/undefined/0
                        value={settings.maxUploadRatio || ""}
                        onChange={(e) => handleMaxUploadRatioChange(e.target.value)}
                        color={errors.maxUploadRatio ? "red" : undefined}
                        min="0" // Добавляем семантический атрибут min
                        step="0.1" // Добавляем шаг для удобства
                    />
                    {errors.maxUploadRatio && (
                        <Text size="1" color="red" data-testid="limits-max-upload-ratio-error">
                            {errors.maxUploadRatio}
                        </Text>
                    )}
                </Box>
            </Flex>

            <Flex direction="column" gap="2">
                <Text as="label" htmlFor="limits-slow-speed-limit-input" size="1" weight="medium">
                    {t("settings.slowSpeedLimit")}
                </Text>
                <Flex gap="2" align="start">
                    {/* Используем класс из CSS-модуля */}
                    <Box className={styles.inputMaxWidth}>
                        <TextField.Root
                            id="limits-slow-speed-limit-input"
                            data-testid="limits-slow-speed-limit-input"
                            size="1"
                            type="number"
                            placeholder="0"
                            // Используем || "" для обработки null/undefined/0
                            value={settings.slowSpeedLimit || ""}
                            onChange={(e) => handleSpeedLimitChange(e.target.value)}
                            color={errors.slowSpeedLimit ? "red" : undefined}
                            min="0" // Добавляем семантический атрибут min
                        />
                        {errors.slowSpeedLimit && (
                            <Text size="1" color="red" data-testid="limits-slow-speed-limit-error">
                                {errors.slowSpeedLimit}
                            </Text>
                        )}
                    </Box>
                    <Box>
                        <Select.Root
                            data-testid="limits-slow-speed-unit-select"
                            size="1"
                            value={settings.slowSpeedUnit}
                            onValueChange={(value) => {
                                // Добавляем проверку, чтобы убедиться, что значение допустимо
                                if (value === "KiB/s" || value === "MiB/s") {
                                    onSettingsChange({ slowSpeedUnit: value }); // Утверждение 'as' больше не нужно
                                }
                                // Можно добавить else для обработки неожиданных значений, если необходимо
                            }}
                        >
                            <Select.Trigger data-testid="limits-slow-speed-unit-trigger" />
                            <Select.Content>
                                <Select.Group>
                                    <Select.Item data-testid="limits-slow-speed-unit-item-kib" value="KiB/s">
                                        {t("settings.KiB/s")}
                                    </Select.Item>
                                    <Select.Item data-testid="limits-slow-speed-unit-item-mib" value="MiB/s">
                                        {t("settings.MiB/s")}
                                    </Select.Item>
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    </Box>
                </Flex>
                <Text size="1" color="gray">
                    {t("settings.slowSpeedLimitHint")}
                </Text>
            </Flex>
        </Grid>
    );
};
