import { useState, useCallback, useEffect } from "react";
import { ConnectionConfig } from "../../../../App";
import { TestConnection } from "../../../../../wailsjs/go/main/App";
import { useLocalization } from "../../../../contexts/LocalizationContext";
import { StatusType } from "../../../StatusMessage"; // Предполагается, что StatusMessage экспортирует StatusType

/**
 * @interface UseConnectionTestResult
 * @property {boolean} isTestingConnection - Флаг, указывающий, идет ли тест соединения.
 * @property {StatusType} connectionStatus - Статус последнего теста соединения ('none', 'success', 'error').
 * @property {string} statusMessage - Сообщение о статусе последнего теста.
 * @property {() => Promise<void>} testConnection - Функция для запуска теста соединения.
 * @property {() => void} resetStatus - Функция для сброса статуса.
 */
interface UseConnectionTestResult {
  isTestingConnection: boolean;
  connectionStatus: StatusType;
  statusMessage: string;
  testConnection: () => Promise<void>;
  resetStatus: () => void;
}

/**
 * Хук для управления логикой тестирования соединения с Transmission сервером.
 * @param {ConnectionConfig} settings - Текущие настройки соединения.
 * @param {(success: boolean, errorMessage?: string) => void} [onConnectionTest] - Колбэк, вызываемый после завершения теста.
 * @returns {UseConnectionTestResult} - Состояние и функции для управления тестом соединения.
 */
export const useConnectionTest = (
  settings: ConnectionConfig,
  onConnectionTest?: (success: boolean, errorMessage?: string) => void,
): UseConnectionTestResult => {
  const { t } = useLocalization();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<StatusType>("none");
  const [statusMessage, setStatusMessage] = useState("");

  const resetStatus = useCallback(() => {
    setConnectionStatus("none");
    setStatusMessage("");
    if (onConnectionTest) {
      onConnectionTest(false); // Сбрасываем статус и у родителя
    }
  }, [onConnectionTest]);

  const testConnection = useCallback(async () => {
    if (!settings.host) return; // Не тестировать без хоста

    setIsTestingConnection(true);
    setConnectionStatus("none"); // Сброс перед новым тестом
    setStatusMessage("");
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus("success");
      const successMsg = t("settings.testSuccess");
      setStatusMessage(successMsg);
      if (onConnectionTest) {
        onConnectionTest(true);
      }
    } catch (error) {
      setConnectionStatus("error");
      let errorMessage = t("settings.testError");
      const errorStr = String(error);

      // Улучшенная проверка ошибок (можно расширить)
      if (errorStr.includes("errors.connectionAuthRequired")) {
        errorMessage = t("errors.connectionAuthRequired");
      } else if (errorStr.includes("connection refused")) {
        errorMessage = t("errors.connectionRefused");
      } else if (errorStr.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else if (errorStr.includes("invalid port")) {
        errorMessage = t("errors.invalidPort"); // Пример новой ошибки
      }
      // Добавить другие специфичные проверки ошибок от бэкенда, если они появятся

      setStatusMessage(errorMessage);
      if (onConnectionTest) {
        onConnectionTest(false, errorMessage);
      }
    } finally {
      setIsTestingConnection(false);
    }
  }, [settings, t, onConnectionTest]);

  // Сбрасываем статус соединения при изменении настроек
  useEffect(() => {
    resetStatus();
  }, [settings.host, settings.port, settings.username, settings.password, resetStatus]);

  return {
    isTestingConnection,
    connectionStatus,
    statusMessage,
    testConnection,
    resetStatus, // Экспортируем resetStatus, если он нужен вне хука (хотя useEffect уже его использует)
  };
};
