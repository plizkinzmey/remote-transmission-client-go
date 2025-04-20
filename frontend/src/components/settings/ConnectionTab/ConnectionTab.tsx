import React from "react";
import { TextField, Flex, Text, Grid, Box, Button } from "@radix-ui/themes";
import { ConnectionConfig } from "../../../App"; // Путь может измениться в зависимости от структуры
import { useLocalization } from "@contexts/LocalizationContext";
import { useConnectionTest } from "./hooks/useConnectionTest";
import styles from "./ConnectionTab.module.css"; // Импорт стилей

/**
 * @interface ConnectionTabProps
 * @property {ConnectionConfig} settings - Текущие настройки соединения.
 * @property {(newSettings: Partial<ConnectionConfig>) => void} onSettingsChange - Колбэк для обновления настроек.
 * @property {(success: boolean, errorMessage?: string) => void} [onConnectionTest] - Колбэк, вызываемый после теста соединения (например, для отображения общего статуса в родительском компоненте).
 * @property {{ [key: string]: string }} [errors] - Объект с ошибками валидации для полей.
 */
export interface ConnectionTabProps {
    settings: ConnectionConfig;
    onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void;
    onConnectionTest?: (success: boolean, errorMessage?: string) => void;
    errors?: { [key: string]: string };
}

/**
 * Компонент вкладки настроек соединения с Transmission сервером.
 * Позволяет пользователю вводить хост, порт, имя пользователя и пароль,
 * а также тестировать соединение.
 *
 * @param {ConnectionTabProps} props - Пропсы компонента.
 * @returns {React.ReactElement} - Элемент вкладки настроек соединения.
 */
export const ConnectionTab: React.FC<ConnectionTabProps> = ({
    settings,
    onSettingsChange,
    onConnectionTest,
    errors = {},
}) => {
    const { t } = useLocalization();
    const {
        isTestingConnection,
        // connectionStatus, // Статус теперь передается через onConnectionTest
        // statusMessage,    // Сообщение теперь передается через onConnectionTest
        testConnection,
    } = useConnectionTest(settings, onConnectionTest);

    // `useEffect` для сброса статуса теперь внутри хука `useConnectionTest`

    return (
        <Grid columns="1" gap="3">
            <Flex direction="column" gap="2">
                <Flex gap="2" align="start">
                    {/* Используем CSS-модули вместо инлайн-стилей */}
                    <Box className={styles.hostInputContainer}>
                        <Text as="label" htmlFor="connection-host-input" size="1" weight="medium">
                            {t("settings.host")}
                        </Text>
                        <TextField.Root
                            id="connection-host-input"
                            data-testid="connection-host-input"
                            size="1"
                            placeholder={t("settings.hostPlaceholder")}
                            value={settings.host}
                            onChange={(e) => onSettingsChange({ host: e.target.value })}
                            color={errors.host ? "red" : undefined}
                        />
                        {errors.host && (
                            <Text size="1" color="red">
                                {errors.host}
                            </Text>
                        )}
                    </Box>
                    <Box className={styles.portInputContainer}>
                        <Text as="label" htmlFor="connection-port-input" size="1" weight="medium">
                            {t("settings.port")}
                        </Text>
                        <TextField.Root
                            id="connection-port-input"
                            data-testid="connection-port-input"
                            type="number"
                            size="1"
                            value={settings.port ?? ""}
                            placeholder={t("settings.portPlaceholder")}
                            onChange={(e) =>
                                onSettingsChange({
                                    port: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                            }
                            color={errors.port ? "red" : undefined}
                        />
                        {errors.port && (
                            <Text size="1" color="red">
                                {errors.port}
                            </Text>
                        )}
                    </Box>
                </Flex>
            </Flex>

            <Flex direction="column" gap="2">
                <Text as="label" htmlFor="connection-username-input" size="1" weight="medium">
                    {t("settings.username")}
                </Text>
                <Box className={styles.usernameInputContainer}>
                    <TextField.Root
                        id="connection-username-input"
                        data-testid="connection-username-input"
                        size="1"
                        placeholder={t("settings.usernamePlaceholder")}
                        value={settings.username}
                        onChange={(e) => onSettingsChange({ username: e.target.value })}
                    />
                </Box>
            </Flex>

            <Flex direction="column" gap="2">
                <Text as="label" htmlFor="connection-password-input" size="1" weight="medium">
                    {t("settings.password")}
                </Text>
                <Box className={styles.passwordInputContainer}>
                    <TextField.Root
                        id="connection-password-input"
                        data-testid="connection-password-input"
                        type="password"
                        size="1"
                        placeholder={t("settings.passwordPlaceholder")}
                        value={settings.password}
                        onChange={(e) => onSettingsChange({ password: e.target.value })}
                    />
                </Box>
            </Flex>

            <Flex direction="column" gap="2">
                <Box>
                    <Button
                        data-testid="connection-test-button"
                        size="1"
                        variant="soft"
                        onClick={testConnection} // Используем функцию из хука
                        disabled={isTestingConnection || !settings.host}
                    >
                        {isTestingConnection
                            ? t("settings.testing")
                            : t("settings.testConnection")}
                    </Button>
                </Box>
                {/* Отображение статуса теперь должно управляться родительским компонентом,
            используя данные из колбэка onConnectionTest */}
            </Flex>
        </Grid>
    );
};
